import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { isDemoMode } from "@/lib/api/client";
import { setDemoRole } from "@/lib/api/auth";
import { useAuth } from "@/lib/api/useAuth";
import type { Role } from "@/lib/api/types";

const LABEL: Record<Role, string> = { citizen: "Citizen", inspector: "Field Inspector", admin: "Administrator" };

/** Role-based protection. With a backend: requires a signed-in user of this role.
 *  In demo mode: pages stay open for demonstration, clearly labelled as unauthenticated. */
export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, user, demoRole } = useAuth();
  if (!ready) return null;

  if (user?.role === role) return <>{children}</>;

  if (isDemoMode) {
    return (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-warning bg-warning/10 px-3 py-2 text-sm">
          <span className="rounded bg-warning px-1.5 py-0.5 text-xs font-bold text-saffron-foreground">DEMONSTRATION</span>
          <span>Viewing as {LABEL[role]} without sign-in. Role switching is not secure authentication.</span>
          {demoRole !== role && (
            <button onClick={() => setDemoRole(role)} className="ml-auto text-xs font-semibold underline">Set as demo role</button>
          )}
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center">
      <Lock className="mx-auto h-8 w-8 text-primary" />
      <h1 className="mt-3 text-xl font-semibold">{LABEL[role]} sign-in required</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {user ? `You are signed in as ${LABEL[user.role]}. This area is for ${LABEL[role]}s.` : "Please sign in to continue."}
      </p>
      <Link to="/login" search={{ role }} className="mt-4 inline-block rounded-lg bg-saffron px-5 py-2 font-semibold text-saffron-foreground">Sign in</Link>
    </div>
  );
}
