import { useQuery } from "@tanstack/react-query";
import type { Session } from "../../context/AuthContext";
import { getWeekEnd, getWeekStart, toDateKey } from "../../utils/date";
import { fetchTimeEntriesForRange } from "./timeEntries";

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
