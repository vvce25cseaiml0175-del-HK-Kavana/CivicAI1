import { useEffect, useState } from "react";
import { getDemoRole, getSession, onAuthChange, type AuthUser } from "./auth";
import type { Role } from "./types";

/** Reads auth state after hydration (storage is browser-only). */
export function useAuth() {
  const [state, setState] = useState<{ ready: boolean; user: AuthUser | null; demoRole: Role | null }>({ ready: false, user: null, demoRole: null });
  useEffect(() => {
    const read = () => setState({ ready: true, user: getSession()?.user ?? null, demoRole: getDemoRole() });
    read();
    return onAuthChange(read);
  }, []);
  return state;
}
