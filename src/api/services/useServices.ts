import { useQuery } from "@tanstack/react-query";
import type { Session } from "../../context/AuthContext";
import { resolveDefaultServiceId } from "./services";

// A person's set of trackable services doesn't change within a session, so
// this is resolved once and kept — no invalidation trigger ever needs it
// fresher than that.
export function useDefaultServiceId(session: Session | null) {
  return useQuery({
    queryKey: ["services", "default", session?.personId ?? null],
    queryFn: () => {
      if (!session) {
        throw new Error("useDefaultServiceId called without a session");
      }
      return resolveDefaultServiceId(session, session.personId);
    },
    enabled: session !== null,
    staleTime: Infinity,
  });
}
