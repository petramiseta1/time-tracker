import { Link, useLocation } from "react-router-dom";
import type { TimeEntry } from "../../api/timeEntries";
import { formatShortDate, fromDateKey } from "../../utils/date";
import { formatDuration } from "../../utils/duration";
import styles from "./EntryListItem.module.scss";

type EntryListItemProps = {
  entry: TimeEntry;
};

// The Edit link carries the current location as `backgroundLocation` state
// (docs/adr/0004-route-driven-entry-overlay.md), so AppRoutes keeps the day
// view mounted underneath instead of navigating away from it.
export function EntryListItem({ entry }: EntryListItemProps) {
  const location = useLocation();

  return (
    <li className={styles.item}>
      <div className={styles.meta}>
        <span className={styles.duration}>{formatDuration(entry.minutes)}</span>
        <span className={styles.date}>
          {formatShortDate(fromDateKey(entry.date))}
        </span>
      </div>
      <div className={styles.description}>{entry.description}</div>
      <Link
        to={`/entries/${entry.id}`}
        state={{ backgroundLocation: location.pathname }}
        className={styles.editLink}
        aria-label="Edit entry"
      >
        Edit
      </Link>
    </li>
  );
}
