import { useCallback, useEffect, useId } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimeEntry } from "../../api/timeEntries";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getBackgroundLocation } from "../../routers/backgroundLocation";
import { Modal } from "../Modal";
import { EntryForm } from "../EntryForm";

// Rendered only from the background+overlay <Routes> pair in AppRoutes
// (ADR 0004) — the day view is already mounted separately as the
// background location, so this owns just the edit dialog. Reuses the same
// centered Modal as add (docs/adr/0004-route-driven-entry-overlay.md) —
// the assignment only requires edit to have its own route, not that the
// form stay visually anchored to its row.
export function EntryEditOverlay() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = getBackgroundLocation(location);
  const { data: entry, isPending, isError } = useTimeEntry(session, id);
  const titleId = useId();

  const close = useCallback(() => {
    navigate(backgroundLocation ?? "/", { replace: true });
  }, [navigate, backgroundLocation]);

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
