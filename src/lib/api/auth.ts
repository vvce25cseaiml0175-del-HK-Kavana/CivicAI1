
/**
 * CivicAI Authentication Service
 *
 * Two modes:
 * 1. Demo mode: Used when VITE_CIVIC_API_URL is not configured.
 *    Allows testing Citizen, Inspector and Admin dashboards locally.
 *
 * 2. Backend mode: Uses Django REST Framework + JWT authentication
 *    when VITE_CIVIC_API_URL is configured.
 */

import type { Role } from "./types";

const API = import.meta.env["VITE_CIVIC_API_URL"] as string | undefined;

const TOKENS = "civicai.auth.tokens";
const DEMO_ROLE = "civicai.demo.role";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  ward?: string;
}

export interface Session {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
  role: Role;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  ward?: string | undefined;
  employeeId?: string | undefined;
}

export class BackendNotConnectedError extends Error {
  constructor() {
    super(
      "The CivicAI backend is not connected. You can still explore the dashboards using demo mode."
    );
    this.name = "BackendNotConnectedError";
  }
}

// Auth state listeners
const listeners = new Set<() => void>();

export const onAuthChange = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const emit = () => listeners.forEach((fn) => fn());

// Session management
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKENS);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(TOKENS);
    return null;
  }
}

function setSession(session: Session | null) {
  if (typeof window === "undefined") return;

  if (session) {
    localStorage.setItem(TOKENS, JSON.stringify(session));
  } else {
    localStorage.removeItem(TOKENS);
  }

  emit();
}

export const authHeader = (): Record<string, string> => {
  const session = getSession();

  return session
    ? { Authorization: `Bearer ${session.access}` }
    : {};
};

// Backend POST helper
async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API) {
    throw new BackendNotConnectedError();
  }

  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      Object.values(data).flat().join(" ") ||
      `Request failed (${response.status})`;

    throw new Error(String(message));
  }

  return data as T;
}

// Create a temporary demo session
function createDemoSession(
  role: Role,
  name: string,
  email: string
): AuthUser {
  const user: AuthUser = {
    id: `demo-${role}`,
    name,
    email,
    role,
    ward: role === "inspector" ? "Ward 12" : "",
  };

  setDemoRole(role);

  setSession({
    access: "demo-access-token",
    refresh: "demo-refresh-token",
    user,
  });

  return user;
}

// Login
export async function login(input: LoginInput): Promise<AuthUser> {
  // Demo login when backend URL is not configured
  if (!API) {
    return createDemoSession(
      input.role,
      input.email.split("@")[0] || "Demo User",
      input.email
    );
  }

  // Real Django backend login
  const session = await post<Session>("/auth/login/", input);

  if (session.user.role !== input.role) {
    throw new Error(
      `This account is not registered as ${input.role}.`
    );
  }

  setSession(session);

  return session.user;
}

// Registration
export async function register(
  input: RegisterInput
): Promise<AuthUser> {
  // Demo registration when backend URL is not configured
  if (!API) {
    return createDemoSession(
      input.role,
      input.name,
      input.email
    );
  }

  // Real Django backend registration
  const { employeeId, ...rest } = input;

  const session = await post<Session>("/auth/register/", {
    ...rest,
    employee_id: employeeId,
  });

  setSession(session);

  return session.user;
}

// Refresh JWT token
export async function refreshToken(): Promise<boolean> {
  const session = getSession();

  if (!session) return false;

  // Demo sessions do not need token refresh
  if (!API) return true;

  try {
    const { access } = await post<{ access: string }>(
      "/auth/refresh/",
      { refresh: session.refresh }
    );

    setSession({
      ...session,
      access,
    });

    return true;
  } catch {
    setSession(null);
    return false;
  }
}

// Logout
export async function logout() {
  const session = getSession();

  if (session && API) {
    await post("/auth/logout/", {
      refresh: session.refresh,
    }).catch(() => {});
  }

  setSession(null);
  setDemoRole(null);
}

// Demo role management
// This is only for demonstration, NOT secure authentication.

export const getDemoRole = (): Role | null => {
  if (typeof window === "undefined" || API) {
    return null;
  }

  return localStorage.getItem(DEMO_ROLE) as Role | null;
};

export function setDemoRole(role: Role | null) {
  if (typeof window === "undefined") return;

  if (role) {
    localStorage.setItem(DEMO_ROLE, role);
  } else {
    localStorage.removeItem(DEMO_ROLE);
  }

  emit();
}
