import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { Session } from "../../context/AuthContext";
import {
  fromDateKey,
  getWeekEnd,
  getWeekStart,
  toDateKey,
} from "../../utils/date";
import {
  createTimeEntry,
  deleteTimeEntry,
  fetchTimeEntriesForRange,
  fetchTimeEntry,
  updateTimeEntry,
  type NewTimeEntryInput,
  type TimeEntry,
  type UpdateTimeEntryInput,
} from "./timeEntries";

// Keyed by the week's start date, not the selected day — so moving between
// days within the same week reuses this query instead of refetching, per
// docs/adr/0006-week-strip-in-day-view.md.
//
// Accepts a possibly-null session so callers on a RequireAuth-guarded route
// don't need to assert non-null themselves; the query simply stays disabled
// until a session exists.
export function useWeekTimeEntries(
  session: Session | null,
  selectedDate: Date,
) {
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = getWeekEnd(selectedDate);

  return useQuery({
    queryKey: [
      "timeEntries",
      "week",
      session?.personId ?? null,
      toDateKey(weekStart),
    ],
    queryFn: () => {
      if (!session) {
        throw new Error("useWeekTimeEntries called without a session");
      }
      return fetchTimeEntriesForRange(
        session,
        session.personId,
        weekStart,
        weekEnd,
      );
    },
    enabled: session !== null,
  });
}

// Looks for the entry in whichever week queries are already cached, so
// useTimeEntry can render instantly when opened from an already-loaded list
// (the common in-app Edit-click path) instead of waiting on a fresh fetch.
function findCachedTimeEntry(
  queryClient: QueryClient,
  personId: string | undefined,
  id: string | undefined,
): TimeEntry | undefined {
  if (!personId || !id) {
    return undefined;
  }

  const cachedWeeks = queryClient.getQueriesData<TimeEntry[]>({
    queryKey: ["timeEntries", "week", personId],
  });

  for (const [, entries] of cachedWeeks) {
    const match = entries?.find((entry) => entry.id === id);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function getWeekQueryKey(personId: string, date: Date) {
  return [
    "timeEntries",
    "week",
    personId,
    toDateKey(getWeekStart(date)),
  ] as const;
}

// Writes `entry` straight into whichever cached week list it belongs to
// (by `entry.date`), instead of invalidating and refetching — see
// docs/adr/0006-week-strip-in-day-view.md for why weeks are the cache unit.
// `invalidateQueries` would make the mutation's `onSuccess` await a second
// network round trip (the refetch) before `mutateAsync` resolves; under a
// throttled connection that makes a successful edit/delete look stuck for
// a full extra request after the API already confirmed it. A direct write
// is synchronous, and we already have the authoritative entry back from
// the API, so there's nothing the refetch would tell us that we don't
// already know.
//
// Replaces an existing copy in place (so its position in that day's list
// doesn't jump) or appends if it's new to that week, and strips any stale
// copy left behind in a *different* week's cache — relevant when an edit
// moves an entry's date across a week boundary. Only touches weeks that
// are already cached; an uncached week fetches fresh, correct contents
// the next time it's visited, so nothing needs to be invalidated there
// either.
function writeEntryToWeekCaches(
  queryClient: QueryClient,
  personId: string,
  entry: TimeEntry,
) {
  const targetKey = getWeekQueryKey(personId, fromDateKey(entry.date));
  const cachedWeeks = queryClient.getQueriesData<TimeEntry[]>({
    queryKey: ["timeEntries", "week", personId],
  });

  for (const [key, entries] of cachedWeeks) {
    if (!entries) {
      continue;
    }

    const isTargetWeek = key.every((part, index) => part === targetKey[index]);

    if (isTargetWeek) {
      const hasEntry = entries.some((existing) => existing.id === entry.id);
      queryClient.setQueryData(
        key,
        hasEntry
          ? entries.map((existing) =>
              existing.id === entry.id ? entry : existing,
            )
          : [...entries, entry],
      );
    } else if (entries.some((existing) => existing.id === entry.id)) {
      queryClient.setQueryData(
        key,
        entries.filter((existing) => existing.id !== entry.id),
      );
    }
  }
}

// Same rationale as writeEntryToWeekCaches, for delete: removes `id` from
// every cached week list for this person rather than invalidating them.
function removeEntryFromWeekCaches(
  queryClient: QueryClient,
  personId: string,
  id: string,
) {
  const cachedWeeks = queryClient.getQueriesData<TimeEntry[]>({
    queryKey: ["timeEntries", "week", personId],
  });

  for (const [key, entries] of cachedWeeks) {
    if (entries?.some((entry) => entry.id === id)) {
      queryClient.setQueryData(
        key,
        entries.filter((entry) => entry.id !== id),
      );
    }
  }
}

// Backs the edit route (`/day/:date/entries/:id`, ADR 0004). Falls back to
// a direct fetch-by-id when the entry isn't in any cached week — the route
// may be reached with nothing cached yet (a fresh tab, a direct link, a
// reload).
export function useTimeEntry(session: Session | null, id: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["timeEntries", "detail", id ?? null],
    queryFn: () => {
      if (!session || !id) {
        throw new Error("useTimeEntry called without a session or id");
      }
      return fetchTimeEntry(session, id);
    },
    enabled: session !== null && id !== undefined,
    initialData: () => findCachedTimeEntry(queryClient, session?.personId, id),
  });
}

// Writes the created entry straight into its week's cache (see
// writeEntryToWeekCaches) rather than invalidating and refetching.
export function useCreateTimeEntry(session: Session | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewTimeEntryInput) => {
      if (!session) {
        throw new Error("useCreateTimeEntry called without a session");
      }
      return createTimeEntry(session, session.personId, input);
    },
    onSuccess: (createdEntry) => {
      if (!session) {
        return;
      }
      writeEntryToWeekCaches(queryClient, session.personId, createdEntry);
    },
  });
}

// Same direct-write approach as useCreateTimeEntry, plus seeding the detail
// cache with the fresh result so a popup left open right after saving (or
// reopened immediately after) reflects it without waiting on a refetch.
export function useUpdateTimeEntry(session: Session | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTimeEntryInput) => {
      if (!session) {
        throw new Error("useUpdateTimeEntry called without a session");
      }
      return updateTimeEntry(session, input);
    },
    onSuccess: (updatedEntry) => {
      if (!session) {
        return;
      }
      writeEntryToWeekCaches(queryClient, session.personId, updatedEntry);
      queryClient.setQueryData(
        ["timeEntries", "detail", updatedEntry.id],
        updatedEntry,
      );
    },
  });
}

// Same direct-write approach as the other time entry mutations, plus
// dropping the detail cache entry so a stale copy can't resurface (e.g.
// reopening the edit overlay) after the entry no longer exists.
export function useDeleteTimeEntry(session: Session | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!session) {
        throw new Error("useDeleteTimeEntry called without a session");
      }
      return deleteTimeEntry(session, id);
    },
    onSuccess: (_data, id) => {
      if (session) {
        removeEntryFromWeekCaches(queryClient, session.personId, id);
      }
      queryClient.removeQueries({ queryKey: ["timeEntries", "detail", id] });
    },
  });
}
