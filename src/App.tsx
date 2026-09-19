import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { ToastStack } from "./components/Toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { TimeEntryPage } from "./pages/TimeEntryPage";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (session) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// The background/overlay Routes for the entry edit popup (ADR 0004) land
// in ticket 05.
function AppRoutes() {
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
        path="/"
        element={
          <RequireAuth>
            <TimeEntryPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
        <ToastStack />
      </ToastProvider>
    </QueryClientProvider>
  );
}
