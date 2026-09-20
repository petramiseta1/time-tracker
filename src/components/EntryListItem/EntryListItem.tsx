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
  // True while EntryList holds a just-deleted row for its collapse animation.
  removing?: boolean;
};

export function EntryListItem({ entry, removing = false }: EntryListItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] =
    useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const deleteTitleId = useId();
  const descriptionId = useId();

  // Reset expand state when an edit replaces the note in place, during
  // render so the next paint is already collapsed.
  const [prevDescription, setPrevDescription] = useState(entry.description);
  if (entry.description !== prevDescription) {
    setPrevDescription(entry.description);
    setIsDescriptionExpanded(false);
  }

  // Show the toggle only when the CSS clamp actually overflows —
  // wrapping and newlines make character count a poor proxy.
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
