import { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { TimeEntry } from "../../api/timeEntries";
import { formatShortDate, fromDateKey } from "../../utils/date";
import { formatDuration } from "../../utils/duration";
import { EntryDeleteConfirm } from "../EntryDeleteConfirm";
import { Modal } from "../Modal";
import styles from "./EntryListItem.module.scss";

type EntryListItemProps = {
  entry: TimeEntry;
};

// The Edit link carries the current location as `backgroundLocation` state
// (docs/adr/0004-route-driven-entry-overlay.md), so AppRoutes keeps the day
// view mounted underneath instead of navigating away from it. Delete has no
// route of its own (ticket 06) — it's local component state, same as add
// (docs/adr/0007-add-entry-stays-inline.md), toggling the shared Modal.
export function EntryListItem({ entry }: EntryListItemProps) {
  const location = useLocation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteTitleId = useId();

  const entrySummary = `${formatDuration(entry.minutes)} on ${formatShortDate(
    fromDateKey(entry.date),
  )} — ${entry.description}`;

  return (
    <li className={styles.item}>
      <div className={styles.meta}>
        <span className={styles.duration}>{formatDuration(entry.minutes)}</span>
        <span className={styles.date}>
          {formatShortDate(fromDateKey(entry.date))}
        </span>
      </div>
      <div className={styles.description}>{entry.description}</div>
      <div className={styles.actions}>
        <Link
          to={`/entries/${entry.id}`}
          state={{ backgroundLocation: location.pathname }}
          className={styles.actionButton}
          aria-label={`Edit entry: ${entrySummary}`}
        >
          Edit
        </Link>
        <button
          type="button"
          className={styles.actionButton}
          aria-label={`Delete entry: ${entrySummary}`}
          onClick={() => setIsConfirmingDelete(true)}
        >
          Delete
        </button>
      </div>

      {isConfirmingDelete && (
        <Modal
          onClose={() => setIsConfirmingDelete(false)}
          labelledBy={deleteTitleId}
        >
          <EntryDeleteConfirm
            entry={entry}
            onClose={() => setIsConfirmingDelete(false)}
            titleId={deleteTitleId}
          />
        </Modal>
      )}
    </li>
  );
}
