import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { ToastStack } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./routers";

// No retries: a failed request should surface its error state right away
// (we always show an explicit Retry action) rather than sit on the loading
// state through several seconds of automatic exponential-backoff retries.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

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
