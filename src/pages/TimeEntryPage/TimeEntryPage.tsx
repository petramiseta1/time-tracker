import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { useWeekTimeEntries } from "../../api/timeEntries";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { DateNav } from "../../components/DateNav";
import { WeekStrip } from "../../components/WeekStrip";
import { EntryForm } from "../../components/EntryForm";
import { EntryList } from "../../components/EntryList";
import { Modal } from "../../components/Modal";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import {
  fromDateKey,
  formatShortDate,
  getWeekDates,
  isValidDateKey,
  toDateKey,
} from "../../utils/date";
import { DAILY_TARGET_MINUTES, formatHoursDecimal } from "../../utils/duration";
import styles from "./TimeEntryPage.module.scss";

export function TimeEntryPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { date: dateParam } = useParams<{ date: string }>();
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Hooks below must run unconditionally even for a bad param (a malformed
  // `/day/:date` — a typo, garbage, or a leap-day rollover) — the fallback
  // "today" here is only ever seen for the one render before the redirect
  // below takes over, so it never actually reaches the page.
  const isValidParam = isValidDateKey(dateParam);
  const selectedDate = useMemo(
    () => (isValidParam ? fromDateKey(dateParam) : new Date()),
    [isValidParam, dateParam],
  );

  const handleSelectDate = (date: Date) => {
    navigate(`/day/${toDateKey(date)}`);
  };

  const { data, error, isPending, isError, refetch } = useWeekTimeEntries(
    session,
    selectedDate,
  );

  // A 401 means the stored token is no longer valid (expired, revoked, or
  // tampered with) — the session that RequireAuth let us in with is stale.
  // Log out so the guard redirects to /login instead of leaving the user
  // stuck on a page that can never load.
  const isSessionExpired =
    isError && error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (isSessionExpired) {
      logout();
    }
  }, [isSessionExpired, logout]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const selectedDateKey = toDateKey(selectedDate);
  const entries = useMemo(() => data ?? [], [data]);

  const totalsByDate = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of entries) {
      totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.minutes);
    }
    return totals;
  }, [entries]);

  const dayEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDateKey),
    [entries, selectedDateKey],
  );
  const dayTotalMinutes = totalsByDate.get(selectedDateKey) ?? 0;

  if (!isValidParam) {
    return <Navigate to={`/day/${toDateKey(new Date())}`} replace />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoMark} />
          <h1 className={styles.title}>Time Tracker</h1>
        </div>
        <DateNav selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        <div className={styles.headerRight}>
          {session?.personName && <Avatar name={session.personName} />}
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <WeekStrip
          weekDates={weekDates}
          selectedDate={selectedDate}
          totalsByDate={totalsByDate}
          onSelectDate={handleSelectDate}
        />

        <div className={styles.content}>
          {!isPending && (
            <div className={styles.toolbar}>
              <p className={styles.summary}>
                {!isError && dayEntries.length > 0
                  ? `${dayEntries.length} ${
                      dayEntries.length === 1 ? "entry" : "entries"
                    } · ${formatHoursDecimal(dayTotalMinutes)} / ${
                      DAILY_TARGET_MINUTES / 60
                    } h logged`
                  : null}
              </p>
              <Button variant="accent" onClick={() => setIsAddingEntry(true)}>
                + Add entry
              </Button>
            </div>
          )}

          {isPending && (
            <div
              className={styles.skeleton}
              role="status"
              aria-label="Loading entries"
            >
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={styles.skeletonRow} />
              ))}
            </div>
          )}

          {!isPending && isError && !isSessionExpired && (
            <ErrorBanner
              title="Couldn't load entries"
              description="Something went wrong loading your time entries. Your data is safe — try again."
              onRetry={() => refetch()}
            />
          )}

          {!isPending && !isError && dayEntries.length === 0 && (
            <EmptyState
              title={`Nothing logged on ${formatShortDate(selectedDate)}`}
              description="Add your first entry for this day."
            />
          )}

          {!isPending && !isError && dayEntries.length > 0 && (
            <EntryList entries={dayEntries} />
          )}
        </div>
      </main>

      {isAddingEntry && (
        <Modal onClose={() => setIsAddingEntry(false)}>
          <EntryForm
            date={selectedDate}
            onClose={() => setIsAddingEntry(false)}
          />
        </Modal>
      )}
    </div>
  );
}
