import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { User, ClipboardCheck, LayoutDashboard, AlertTriangle } from "lucide-react";
import { login, register } from "@/lib/api/auth";
import { isDemoMode } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "citizen", label: "Citizen", icon: User, home: "/citizen" },
  { id: "inspector", label: "Field Inspector", icon: ClipboardCheck, home: "/inspector" },
  { id: "admin", label: "Administrator", icon: LayoutDashboard, home: "/admin" },
] as const;

const input = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/30";

export function AuthForm({ mode, initialRole }: { mode: "login" | "register"; initialRole: Role }) {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>(initialRole);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "", ward: "", employeeId: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(null);
    if (mode === "register") {
      if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
      if (f.password !== f.confirm) return setErr("Passwords do not match.");
    }
    setBusy(true);
    try {
      const u = mode === "login"
        ? await login({ email: f.email, password: f.password, role })
        : await register({ name: f.name, email: f.email, phone: f.phone, password: f.password, role, ward: f.ward || undefined, employeeId: f.employeeId || undefined });
      nav({ to: ROLES.find((r) => r.id === u.role)!.home });
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }

  const staff = role !== "citizen";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "login" ? "Access your CivicAI dashboard." : staff ? "Staff accounts are verified by your municipal body before activation." : "Report and track civic issues in your area."}
      </p>

      {isDemoMode && (
        <div className="mt-4 flex gap-2 rounded-lg border border-warning bg-warning/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span>The CivicAI server isn't connected yet, so sign-in won't work. You can still explore each role in <Link to="/" className="font-semibold underline">demo mode</Link>.</span>
        </div>
      )}

      <div role="tablist" aria-label="Role" className="mt-5 grid grid-cols-3 gap-2">
        {ROLES.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={role === r.id} onClick={() => setRole(r.id)}
            className={cn("flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium", role === r.id ? "border-saffron bg-saffron/10 text-foreground" : "bg-card text-muted-foreground")}>
            <r.icon className="h-5 w-5" />{r.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3 rounded-xl border bg-card p-5">
        {mode === "register" && (
          <>
            <label className="block text-sm font-medium">Full name<input required className={cn(input, "mt-1")} value={f.name} onChange={set("name")} /></label>
            <label className="block text-sm font-medium">Mobile number<input required type="tel" pattern="[0-9+ ]{10,14}" placeholder="+91 98xxxxxxxx" className={cn(input, "mt-1")} value={f.phone} onChange={set("phone")} /></label>
          </>
        )}
        <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" className={cn(input, "mt-1")} value={f.email} onChange={set("email")} /></label>
        {mode === "register" && staff && (
          <>
            <label className="block text-sm font-medium">Employee ID<input required className={cn(input, "mt-1")} value={f.employeeId} onChange={set("employeeId")} /></label>
            {role === "inspector" && <label className="block text-sm font-medium">Ward / zone<input required className={cn(input, "mt-1")} value={f.ward} onChange={set("ward")} /></label>}
          </>
        )}
        <label className="block text-sm font-medium">Password<input required type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className={cn(input, "mt-1")} value={f.password} onChange={set("password")} /></label>
        {mode === "register" && <label className="block text-sm font-medium">Confirm password<input required type="password" autoComplete="new-password" className={cn(input, "mt-1")} value={f.confirm} onChange={set("confirm")} /></label>}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-saffron py-2.5 font-semibold text-saffron-foreground disabled:opacity-60">
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "login"
          ? <>New to CivicAI? <Link to="/register" search={{ role }} className="font-semibold text-primary underline">Create an account</Link></>
          : <>Already registered? <Link to="/login" search={{ role }} className="font-semibold text-primary underline">Sign in</Link></>}
      </p>
    </div>
  );
}
