import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "../../api/client";
import { findMembershipForOrganization } from "../../api/organizationMemberships";

export type Session = {
  token: string;
  organizationId: string;
  personId: string;
  personName?: string;
};

export type LoginFailureReason =
  "invalid-token" | "no-organization" | "unknown";

export type LoginResult =
  { ok: true } | { ok: false; reason: LoginFailureReason };

type AuthContextValue = {
  session: Session | null;
  login: (token: string, organizationId: string) => Promise<LoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "productive-time-tracker:session";

function loadStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Session).token === "string" &&
      typeof (parsed as Session).organizationId === "string" &&
      typeof (parsed as Session).personId === "string" &&
      ((parsed as Session).personName === undefined ||
        typeof (parsed as Session).personName === "string")
    ) {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    loadStoredSession(),
  );

  const login = useCallback(
    async (token: string, organizationId: string): Promise<LoginResult> => {
      try {
        const membership = await findMembershipForOrganization({
          token,
          organizationId,
        });

        if (!membership) {
          return { ok: false, reason: "no-organization" };
        }

        const newSession: Session = {
          token,
          organizationId,
          personId: membership.personId,
          personName: membership.personName,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        setSession(newSession);
        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            return { ok: false, reason: "invalid-token" };
          }
          // 403/404 on the org-scoped request means a bad org ID, not a bad token.
          if (error.status === 403 || error.status === 404) {
            return { ok: false, reason: "no-organization" };
          }
        }
        return { ok: false, reason: "unknown" };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
