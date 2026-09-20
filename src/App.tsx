import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { ToastStack } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./routers";

// Surface errors immediately — the UI has an explicit Retry.
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
