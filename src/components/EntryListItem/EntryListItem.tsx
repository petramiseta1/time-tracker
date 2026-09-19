import type { TimeEntry } from "../../api/timeEntries";
import { formatShortDate, fromDateKey } from "../../utils/date";
import { formatDuration } from "../../utils/duration";
import styles from "./EntryListItem.module.scss";

type EntryListItemProps = {
  entry: TimeEntry;
};

export function EntryListItem({ entry }: EntryListItemProps) {
  return (
    <li className={styles.item}>
      <div className={styles.meta}>
        <span className={styles.duration}>{formatDuration(entry.minutes)}</span>
        <span className={styles.date}>
          {formatShortDate(fromDateKey(entry.date))}
        </span>
      </div>
      <div className={styles.description}>{entry.description}</div>
    </li>
  );
}
