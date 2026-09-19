import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (session) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
