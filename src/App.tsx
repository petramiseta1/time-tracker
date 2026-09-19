import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { ToastStack } from "./components/Toast";
import { LoginPage } from "./pages/LoginPage";
import { TimeEntryPage } from "./pages/TimeEntryPage";

const queryClient = new QueryClient();

// Route guarding (unauthenticated -> login, authenticated -> day view) and
// the background/overlay Routes for the entry edit popup (ADR 0004) land
// in tickets 02 and 05 respectively.
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<TimeEntryPage />} />
          </Routes>
        </BrowserRouter>
        <ToastStack />
      </ToastProvider>
    </QueryClientProvider>
  );
}
