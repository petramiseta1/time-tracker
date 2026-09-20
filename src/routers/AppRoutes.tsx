import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DayEntriesPage } from "../pages/DayEntriesPage";
import { EntryEditOverlay } from "../components/EntryEditOverlay";
import { RequireAuth } from "./RequireAuth";
import { RedirectIfAuthed } from "./RedirectIfAuthed";
import { toDateKey } from "../utils/date";

// Nested `entries/:id` keeps DayEntriesPage mounted and renders the edit
// dialog through its Outlet.
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
            <DayEntriesPage />
          </RequireAuth>
        }
      >
        <Route path="entries/:id" element={<EntryEditOverlay />} />
      </Route>
      <Route
        path="/"
        element={<Navigate to={`/day/${toDateKey(new Date())}`} replace />}
      />
    </Routes>
  );
}
