import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { TimeEntryPage } from "../pages/TimeEntryPage";
import { EntryEditOverlay } from "../components/EntryEditOverlay";
import { RequireAuth } from "./RequireAuth";
import { RedirectIfAuthed } from "./RedirectIfAuthed";
import { toDateKey } from "../utils/date";

// Nested `/day/:date/entries/:id` keeps TimeEntryPage mounted and renders
// the edit dialog through its <Outlet /> (ADR 0004: edit exists in its
// own route, as an overlay on the day view rather than a full page).
export function AppRoutes() {
  return (
    <Routes>
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
      >
        <Route path="entries/:id" element={<EntryEditOverlay />} />
      </Route>
      {/* "/" always resolves to today's day view; RequireAuth on that route
          handles the login redirect if there's no session. */}
      <Route
        path="/"
        element={<Navigate to={`/day/${toDateKey(new Date())}`} replace />}
      />
    </Routes>
  );
}
