import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { Session } from "../../context/AuthContext";
import { getWeekEnd, getWeekStart, toDateKey } from "../../utils/date";
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

// Backs the edit route (`/entries/:id`, ADR 0004). Falls back to a direct
// fetch-by-id when the entry isn't in any cached week — the route may be
// reached with nothing cached yet (a fresh tab, a direct link, a reload).
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

// Invalidates every cached week for this person rather than just the
// currently viewed one, so a stale week the user navigates back to later
// also refetches — matching the "mutation-driven invalidation" approach
// from docs/spec.md rather than hand-merging the new entry into the cache.
export function useCreateTimeEntry(session: Session | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewTimeEntryInput) => {
      if (!session) {
        throw new Error("useCreateTimeEntry called without a session");
      }
      return createTimeEntry(session, session.personId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeEntries", "week", session?.personId ?? null],
      });
    },
  });
}

// Same mutation-driven invalidation as useCreateTimeEntry, plus seeding the
// detail cache with the fresh result so a popup left open right after saving
// (or reopened immediately after) reflects it without waiting on a refetch.
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
      queryClient.invalidateQueries({
        queryKey: ["timeEntries", "week", session?.personId ?? null],
      });
      queryClient.setQueryData(
        ["timeEntries", "detail", updatedEntry.id],
        updatedEntry,
      );
    },
  });
}

// Same mutation-driven invalidation as the other time entry mutations, plus
// dropping the detail cache entry so a stale copy can't resurface (e.g. via
// EntryDeepLink) after the entry no longer exists.
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
      queryClient.invalidateQueries({
        queryKey: ["timeEntries", "week", session?.personId ?? null],
      });
      queryClient.removeQueries({ queryKey: ["timeEntries", "detail", id] });
    },
  });
}
