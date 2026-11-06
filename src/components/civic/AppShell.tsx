
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  User,
  ClipboardCheck,
  LayoutDashboard,
  Landmark,
  LogIn,
  LogOut,
} from "lucide-react";
import { RoleGate } from "./RoleGate";
import { logout } from "@/lib/api/auth";
import { useAuth } from "@/lib/api/useAuth";
import type { Role } from "@/lib/api/types";
import type { ReactNode } from "react";
import { isDemoMode } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home, roles: ["citizen", "inspector", "admin"] },
  { to: "/citizen", label: "Citizen", icon: User, roles: ["citizen"] },
  { to: "/inspector", label: "Inspector", icon: ClipboardCheck, roles: ["inspector"] },
  { to: "/admin", label: "Admin", icon: LayoutDashboard, roles: ["admin"] },
] as const;

export function AppShell({
  children,
  role,
}: {
  children: ReactNode;
  role?: Role;
}) {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const currentRole = user?.role ?? null;

  const visibleNav = NAV.filter((n) => {
  if (!currentRole) return true;
  return n.roles.some((r) => r === currentRole);
});

  const active = (to: string) =>
    to === "/" ? path === "/" : path.startsWith(to);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="tricolor-bar h-1" />

      <header className="sticky top-0 z-30 border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-saffron" />
            <span className="font-display text-xl font-bold">CivicAI</span>
          </Link>

          <nav className="ml-auto hidden gap-1 md:flex">
            {visibleNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active(n.to)
                    ? "bg-saffron text-saffron-foreground"
                    : "hover:bg-sidebar-accent"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <button
              onClick={() => logout()}
              className="ml-auto flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-sidebar-accent md:ml-2"
              title={user.email}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-auto flex items-center gap-1 rounded-md border border-sidebar-border px-3 py-1.5 text-sm font-medium hover:bg-sidebar-accent md:ml-2"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>

        {isDemoMode && (
          <div className="hatch-sim border-t border-sidebar-border bg-warning px-4 py-1 text-center text-xs font-semibold text-saffron-foreground">
            Demo mode — role switching is a demonstration, not secure sign-in.
            Records marked SIMULATED are sample data. No backend connected yet.
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {role ? <RoleGate role={role}>{children}</RoleGate> : children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t bg-card md:hidden">
        {visibleNav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-xs",
              active(n.to)
                ? "text-saffron font-semibold"
                : "text-muted-foreground"
            )}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
