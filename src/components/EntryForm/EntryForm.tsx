import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useCreateTimeEntry, useUpdateTimeEntry } from "../../api/timeEntries";
import type { TimeEntry } from "../../api/timeEntries";
import { useDefaultServiceId } from "../../api/services";
import { isValidDateKey, toDateKey } from "../../utils/date";
import { formatDurationInput, parseDuration } from "../../utils/duration";
import { Button } from "../Button";
import { NumberInput } from "../NumberInput";
import { TextArea } from "../TextArea";
import { TextField } from "../TextField";
import styles from "./EntryForm.module.scss";

const DURATION_CHIPS = ["15m", "30m", "1h", "2h"];

type EntryFormProps = { onClose: () => void; titleId?: string } & (
  { mode?: "create"; date: Date } | { mode: "edit"; entry: TimeEntry }
);

// Ticket 04's inline add-entry form, reused as-is by ticket 05's edit popup
// (mode: "edit") — same fields and validation, plus a date field (add fixes
// the date to the day view's selected day; edit lets it change, per the
// assignment's field list). The day view owns whether the add form is shown
// at all (its "+ Add entry" trigger); add stays an inline action with no
// dedicated route (docs/adr/0007-add-entry-stays-inline.md), so the day view
// unmounting this component on close is what resets its fields for next
// time. Edit's own route/lifecycle is owned by EntryEditOverlay instead.
export function EntryForm(props: EntryFormProps) {
  const { onClose, titleId } = props;
  const isEdit = props.mode === "edit";
  const { session } = useAuth();
  const { showToast } = useToast();
  const createTimeEntry = useCreateTimeEntry(session);
  const updateTimeEntry = useUpdateTimeEntry(session);
  const { data: defaultServiceId, isPending: isServicePending } =
    useDefaultServiceId(session);

  const [dateKey, setDateKey] = useState(
    props.mode === "edit" ? props.entry.date : toDateKey(props.date),
  );
  const [duration, setDuration] = useState(
    props.mode === "edit" ? formatDurationInput(props.entry.minutes) : "",
  );
  const [description, setDescription] = useState(
    props.mode === "edit" ? props.entry.description : "",
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const parsedMinutes = parseDuration(duration);
  const isDurationValid = parsedMinutes !== null && parsedMinutes > 0;
  const trimmedDescription = description.trim();
  const isDescriptionValid = trimmedDescription !== "";
  const isDateValid = isValidDateKey(dateKey);
  const isSaving = isEdit
    ? updateTimeEntry.isPending
    : createTimeEntry.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (
      !isDurationValid ||
      !isDescriptionValid ||
      !isDateValid ||
      parsedMinutes === null
    ) {
      return;
    }

    try {
      if (props.mode === "edit") {
        await updateTimeEntry.mutateAsync({
          id: props.entry.id,
          date: dateKey,
          minutes: parsedMinutes,
          description: trimmedDescription,
        });
        showToast("Entry updated.", "success");
      } else {
        if (!defaultServiceId) {
          showToast(
            "Couldn't find a trackable service for your account.",
            "error",
          );
          return;
        }

        await createTimeEntry.mutateAsync({
          date: dateKey,
          minutes: parsedMinutes,
          description: trimmedDescription,
          serviceId: defaultServiceId,
        });
        showToast("Entry added.", "success");
      }
      onClose();
    } catch {
      // Form stays open with the entered values so the user can retry
      // without re-typing — nothing changed in the list.
      showToast(
        isEdit
          ? "Couldn't update entry. Please try again."
          : "Couldn't add entry. Please try again.",
        "error",
      );
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h3 className={styles.title} id={titleId}>
          {isEdit ? "Edit entry" : "New entry"}
        </h3>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          title="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {isEdit && (
        <TextField
          label="Date"
          type="date"
          value={dateKey}
          onChange={(event) => setDateKey(event.target.value)}
        />
      )}

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
          disabled={isSaving || (!isEdit && isServicePending)}
        >
          {isSaving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
