import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { TimeEntryPage } from "../pages/TimeEntryPage";
import { RequireAuth } from "./RequireAuth";
import { RedirectIfAuthed } from "./RedirectIfAuthed";
import { toDateKey } from "../utils/date";

// The background/overlay Routes for the entry edit popup (ADR 0004) land
// in ticket 05.
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
      />
      {/* "/" always resolves to today's day view; RequireAuth on that route
          handles the login redirect if there's no session. */}
      <Route
        path="/"
        element={<Navigate to={`/day/${toDateKey(new Date())}`} replace />}
      />
    </Routes>
  );
}
