import { useEffect } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useTimeEntry } from "../api/timeEntries";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { toDateKey } from "../utils/date";
import { getBackgroundLocation } from "./backgroundLocation";

// Bridges a direct visit to `/entries/:id` (typed, pasted, or restored via
// back/forward with no `backgroundLocation` state yet) into the same
// background+overlay shape an in-app Edit click produces (ADR 0004): once
// the entry's date is known, replace this history entry with itself plus a
// synthesized `backgroundLocation`, so AppRoutes renders the day view
// underneath and the edit popup on top, exactly like the in-app path.
export function EntryDeepLink() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = getBackgroundLocation(location);
  const { data: entry, isError } = useTimeEntry(session, id);

  useEffect(() => {
    // Guards against re-navigating on every background refetch of `entry`
    // (a new object each time, so it's not a stable effect dependency) —
    // once bridged, this component stops matching any route and unmounts,
    // but the check also makes the effect a no-op if it somehow re-ran
    // first.
    if (!entry || backgroundLocation) {
      return;
    }
    navigate(location.pathname, {
      replace: true,
      state: { backgroundLocation: `/day/${entry.date}` },
    });
  }, [entry, backgroundLocation, location.pathname, navigate]);

  useEffect(() => {
    if (isError) {
      showToast("Couldn't find that entry.", "error");
    }
  }, [isError, showToast]);

  if (isError) {
    return <Navigate to={`/day/${toDateKey(new Date())}`} replace />;
  }

  return null;
}
