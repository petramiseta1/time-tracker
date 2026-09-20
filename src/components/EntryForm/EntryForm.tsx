import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useCreateTimeEntry } from "../../api/timeEntries";
import { useDefaultServiceId } from "../../api/services";
import { toDateKey } from "../../utils/date";
import { parseDuration } from "../../utils/duration";
import { Button } from "../Button";
import { NumberInput } from "../NumberInput";
import { TextArea } from "../TextArea";
import styles from "./EntryForm.module.scss";

const DURATION_CHIPS = ["15m", "30m", "1h", "2h"];

type EntryFormProps = {
  date: Date;
  onClose: () => void;
};

// Ticket 04's inline add-entry form — the expanded card only; the day view
// owns whether it's shown at all (its "+ Add entry" trigger) since that
// toggle sits in the same toolbar as the day's summary text, not inside this
// component. Add stays an inline action with no dedicated route
// (docs/adr/0007-add-entry-stays-inline.md), so there's no route to carry
// open/closed state instead — the day view unmounting this component on
// close is what resets its fields for next time.
export function EntryForm({ date, onClose }: EntryFormProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const createTimeEntry = useCreateTimeEntry(session);
  const { data: defaultServiceId, isPending: isServicePending } =
    useDefaultServiceId(session);

  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const parsedMinutes = parseDuration(duration);
  const isDurationValid = parsedMinutes !== null && parsedMinutes > 0;
  const trimmedDescription = description.trim();
  const isDescriptionValid = trimmedDescription !== "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!isDurationValid || !isDescriptionValid || parsedMinutes === null) {
      return;
    }

    if (!defaultServiceId) {
      showToast("Couldn't find a trackable service for your account.", "error");
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        date: toDateKey(date),
        minutes: parsedMinutes,
        description: trimmedDescription,
        serviceId: defaultServiceId,
      });
      showToast("Entry added.", "success");
      onClose();
    } catch {
      // Form stays open with the entered values so the user can retry
      // without re-typing — nothing was added to the list.
      showToast("Couldn't add entry. Please try again.", "error");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h3 className={styles.title}>New entry</h3>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <NumberInput
        label="Duration"
        placeholder="e.g. 1:30, 1.5, or 90m"
        autoFocus
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
        error={
          submitAttempted && !isDurationValid
            ? "Enter a duration like 1:30, 1.5, or 90m."
            : undefined
        }
      />

      <div className={styles.chips}>
        {DURATION_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className={styles.chip}
            onClick={() => setDuration(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <TextArea
        label="Description"
        placeholder="What did you work on?"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        error={
          submitAttempted && !isDescriptionValid
            ? "Description can't be empty."
            : undefined
        }
      />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="accent"
          disabled={createTimeEntry.isPending || isServicePending}
        >
          {createTimeEntry.isPending ? "Saving…" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
