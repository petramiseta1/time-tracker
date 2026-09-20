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

// Keyed by week start so moving between days in the same week reuses the
// query. `session` may be null; the query stays disabled until one exists.
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

// Prefer a cached week list so Edit can open without a refetch.
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

// Patch cached week lists instead of invalidating — a refetch would delay
// mutateAsync after the API already succeeded. Replaces in place, appends
// if new, and drops a stale copy when the date crosses a week boundary.
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

// Same as writeEntryToWeekCaches, for delete.
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

// Falls back to fetch-by-id when the entry isn't in any cached week.
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
