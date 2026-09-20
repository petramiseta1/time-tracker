import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "../../context/AuthContext";
import { getWeekEnd, getWeekStart, toDateKey } from "../../utils/date";
import {
  createTimeEntry,
  fetchTimeEntriesForRange,
  type NewTimeEntryInput,
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
