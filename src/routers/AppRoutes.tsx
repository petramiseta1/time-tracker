import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { TimeEntryPage } from "../pages/TimeEntryPage";
import { EntryEditOverlay } from "../components/EntryEditOverlay";
import { RequireAuth } from "./RequireAuth";
import { RedirectIfAuthed } from "./RedirectIfAuthed";
import { EntryDeepLink } from "./EntryDeepLink";
import { getBackgroundLocation } from "./backgroundLocation";
import { toDateKey } from "../utils/date";

// Background+overlay routing for the entry edit popup (ADR 0004). The first
// <Routes> renders against `backgroundLocation` when one is set — from an
// in-app Edit click (EntryListItem sets it directly) or from EntryDeepLink
// resolving a direct `/entries/:id` visit — keeping the day view mounted
// underneath. The second <Routes> renders only while a backgroundLocation
// is set, matching the *real* current location, so it's just the overlay
// route on top.
export function AppRoutes() {
  const location = useLocation();
  const backgroundLocation = getBackgroundLocation(location);

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/day/:date"
          element={
            <RequireAuth>
              <TimeEntryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/entries/:id"
          element={
            <RequireAuth>
              <EntryDeepLink />
            </RequireAuth>
          }
        />
        {/* "/" always resolves to today's day view; RequireAuth on that route
            handles the login redirect if there's no session. */}
        <Route
          path="/"
          element={<Navigate to={`/day/${toDateKey(new Date())}`} replace />}
        />
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route
            path="/entries/:id"
            element={
              <RequireAuth>
                <EntryEditOverlay />
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </>
  );
}
