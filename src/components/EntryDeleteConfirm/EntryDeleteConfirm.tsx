import type { TimeEntry } from "../../api/timeEntries";
import { useDeleteTimeEntry } from "../../api/timeEntries";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatShortDate, fromDateKey } from "../../utils/date";
import { formatDuration } from "../../utils/duration";
import { Button } from "../Button";
import { useModalClose } from "../Modal";
import styles from "./EntryDeleteConfirm.module.scss";

type EntryDeleteConfirmProps = {
  entry: TimeEntry;
  titleId?: string;
};

// Confirmation content for ticket 06 — rendered inside the shared Modal,
// same dialog treatment edit reuses from add (docs/adr/0004). Deletion has
// no route of its own; the assignment only requires a confirmation step
// (User Story 4), not a deep-linkable URL like edit's.
export function EntryDeleteConfirm({
  entry,
  titleId,
}: EntryDeleteConfirmProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const deleteTimeEntry = useDeleteTimeEntry(session);
  const onClose = useModalClose();

  async function handleDelete() {
    try {
      await deleteTimeEntry.mutateAsync(entry.id);
      showToast("Entry deleted.", "success");
      onClose();
    } catch {
      // Dialog stays open on failure, matching EntryForm's error handling —
      // the entry is untouched, so nothing to reflect and no reason to lose
      // the confirmation.
      showToast("Couldn't delete entry. Please try again.", "error");
    }
  }

  return (
    <div className={styles.dialog}>
      <h3 className={styles.title} id={titleId}>
        Delete this entry?
      </h3>
      <p className={styles.description}>
        {formatDuration(entry.minutes)} on{" "}
        {formatShortDate(fromDateKey(entry.date))} — “{entry.description}”. This
        cannot be undone.
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={deleteTimeEntry.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleteTimeEntry.isPending}
        >
          {deleteTimeEntry.isPending ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
