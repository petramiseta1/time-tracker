import { useCallback, useEffect, useId } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTimeEntry } from "../../api/timeEntries";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../Modal";
import { EntryForm } from "../EntryForm";

export function EntryEditOverlay() {
  const { id, date } = useParams<{ id: string; date: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { data: entry, isPending, isError } = useTimeEntry(session, id);
  const titleId = useId();

  const close = useCallback(() => {
    navigate(`/day/${date}`, { replace: true });
  }, [navigate, date]);

  useEffect(() => {
    if (isError) {
      showToast("Couldn't load that entry.", "error");
      close();
    }
  }, [isError, showToast, close]);

  if (!id || isPending || !entry) {
    return null;
  }

  return (
    <Modal onClose={close} labelledBy={titleId}>
      <EntryForm mode="edit" entry={entry} titleId={titleId} />
    </Modal>
  );
}
