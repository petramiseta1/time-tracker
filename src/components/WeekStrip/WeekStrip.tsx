import clsx from "clsx";
import {
  formatDayLabel,
  formatDayOfMonth,
  formatFullDate,
  isSameDay,
  isToday,
  toDateKey,
} from "../../utils/date";
import { DAILY_TARGET_MINUTES, formatHoursDecimal } from "../../utils/duration";
import styles from "./WeekStrip.module.scss";

type WeekStripProps = {
  weekDates: Date[];
  selectedDate: Date;
  totalsByDate: Map<string, number>;
  onSelectDate: (date: Date) => void;
};

export function WeekStrip({
  weekDates,
  selectedDate,
  totalsByDate,
  onSelectDate,
}: WeekStripProps) {
  return (
    <div className={styles.strip}>
      {weekDates.map((date) => {
        const dateKey = toDateKey(date);
        const minutes = totalsByDate.get(dateKey) ?? 0;
        const percent = Math.min(100, (minutes / DAILY_TARGET_MINUTES) * 100);
        const isOverTarget = minutes > DAILY_TARGET_MINUTES;
        const selected = isSameDay(date, selectedDate);
        const today = isToday(date);

        return (
          <button
            type="button"
            key={dateKey}
            className={clsx(styles.day, selected && styles.selected)}
            onClick={() => onSelectDate(date)}
            aria-pressed={selected}
            aria-current={today ? "date" : undefined}
            aria-label={`${formatFullDate(date)}, ${
              minutes > 0
                ? `${formatHoursDecimal(minutes)} hours logged`
                : "no entries"
            }`}
          >
            <span className={styles.content}>
              <span className={styles.topRow}>
                <span className={styles.dateGroup}>
                  <span className={styles.label}>{formatDayLabel(date)}</span>
                  <span className={styles.dayNumber}>
                    {formatDayOfMonth(date)}
                  </span>
                  {today && <span className={styles.todayDot} />}
                </span>
                <span
                  className={clsx(
                    styles.hours,
                    isOverTarget && styles.overTarget,
                  )}
                >
                  {minutes > 0 ? `${formatHoursDecimal(minutes)}h` : "—"}
                </span>
              </span>
              <span className={styles.progressTrack}>
                <span
                  className={clsx(
                    styles.progressFill,
                    isOverTarget && styles.progressOverTarget,
                  )}
                  style={{ width: `${percent}%` }}
                />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
