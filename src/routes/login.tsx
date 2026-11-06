import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/civic/AppShell";
import { AuthForm } from "@/components/civic/AuthForm";
import type { Role } from "@/lib/api/types";

const roles: Role[] = ["citizen", "inspector", "admin"];

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { role?: Role } => (roles.includes(s['role'] as Role) ? { role: s['role'] as Role } : {}),
  head: () => ({
    meta: [
      { title: "Sign in – CivicAI" },
      { name: "description", content: "Sign in to CivicAI as a citizen, field inspector or administrator." },
      { property: "og:title", content: "Sign in – CivicAI" },
      { property: "og:description", content: "Access your CivicAI civic dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { role } = Route.useSearch();
    return <AppShell><AuthForm key={role} mode="login" initialRole={role ?? "citizen"} /></AppShell>;
  },
});
