import { useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { TimeEntry } from "../../api/timeEntries";
import { formatShortDate, fromDateKey } from "../../utils/date";
import { formatDuration } from "../../utils/duration";
import { EntryDeleteConfirm } from "../EntryDeleteConfirm";
import { Modal } from "../Modal";
import styles from "./EntryListItem.module.scss";

type EntryListItemProps = {
  entry: TimeEntry;
  // Set by EntryList once this entry has dropped out of the incoming
  // `entries` prop (i.e. the delete succeeded) — plays the row's collapse
  // animation before EntryList actually drops it from the DOM.
  removing?: boolean;
};

// Edit navigates to the nested `/day/:date/entries/:id` route, which
// keeps this day view mounted and renders the dialog through TimeEntryPage's
// <Outlet /> (ADR 0004). Delete has no route of its own (ticket 06) — it's
// local component state, same as add (docs/adr/0007-add-entry-stays-inline.md),
// toggling the shared Modal.
export function EntryListItem({ entry, removing = false }: EntryListItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] =
    useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const deleteTitleId = useId();
  const descriptionId = useId();

  // An edit can replace the note in place (same list row, new text). Drop
  // the expanded state so a now-short description doesn't keep a stale
  // "Show less", and so a still-long one remeasures against the clamp.
  // Compared during render (not via a ref or an effect) so the next paint
  // is already collapsed — React's "adjusting state when a prop changes"
  // pattern: https://react.dev/learn/you-might-not-need-an-effect
  const [prevDescription, setPrevDescription] = useState(entry.description);
  if (entry.description !== prevDescription) {
    setPrevDescription(entry.description);
    setIsDescriptionExpanded(false);
  }

  // Clamp is CSS-only; the toggle is shown only when the clamped box
  // actually overflows. Character count is a bad proxy here: `pre-line`
  // plus wrapping means a short string with many newlines can overflow
  // while a long one on a wide screen might not.
  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!el || isDescriptionExpanded) {
      return;
    }

    const measure = () => {
      setIsDescriptionOverflowing(el.scrollHeight - el.clientHeight > 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDescriptionExpanded, entry.description]);

  const entrySummary = `${formatDuration(entry.minutes)} on ${formatShortDate(
    fromDateKey(entry.date),
  )} — ${entry.description}`;

  return (
    <li
      className={clsx(styles.item, removing && styles.itemRemoving)}
      aria-hidden={removing}
    >
      <div className={styles.itemInner}>
        <div className={styles.meta}>
          <span className={styles.duration}>
            {formatDuration(entry.minutes)}
          </span>
          <span className={styles.date}>
            {formatShortDate(fromDateKey(entry.date))}
          </span>
        </div>
        <div className={styles.description}>
          <div
            id={descriptionId}
            ref={descriptionRef}
            className={clsx(
              styles.text,
              !isDescriptionExpanded && styles.clamped,
            )}
          >
            {entry.description}
          </div>
          {(isDescriptionOverflowing || isDescriptionExpanded) && (
            <button
              type="button"
              className={styles.showMore}
              aria-expanded={isDescriptionExpanded}
              aria-controls={descriptionId}
              onClick={() => setIsDescriptionExpanded((open) => !open)}
            >
              {isDescriptionExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className={styles.actions}>
          <Link
            to={`/day/${entry.date}/entries/${entry.id}`}
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
            <EntryDeleteConfirm entry={entry} titleId={deleteTitleId} />
          </Modal>
        )}
      </div>
    </li>
  );
}
