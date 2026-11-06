import type { ReactNode } from "react";
import { CATEGORIES, STATUSES, type Complaint, type Status } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function SimBadge() {
  return <span className="hatch-sim rounded border border-warning px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-saffron-foreground">Simulated</span>;
}

const statusStyle: Record<Status, string> = {
  submitted: "bg-secondary text-secondary-foreground",
  assigned: "bg-saffron/20 text-saffron-foreground",
  inspected: "bg-warning/30 text-saffron-foreground",
  verified: "bg-accent text-accent-foreground",
  resolved: "bg-success text-success-foreground",
};
export function StatusPill({ status }: { status: Status }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", statusStyle[status])}>{status}</span>;
}

export function StatusTrack({ status }: { status: Status }) {
  const idx = STATUSES.indexOf(status);
  return (
    <div className="flex gap-1">
      {STATUSES.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={cn("h-1.5 rounded-full", i <= idx ? "bg-success" : "bg-muted")} />
          <p className="mt-1 hidden text-[10px] capitalize text-muted-foreground sm:block">{s}</p>
        </div>
      ))}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export const isOverdue = (c: Complaint) => c.status !== "resolved" && new Date(c.dueAt) < new Date();

export function ComplaintCard({ c, children }: { c: Complaint; children?: ReactNode }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
        <StatusPill status={c.status} />
        {c.simulated && <SimBadge />}
        {isOverdue(c) && <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">Overdue</span>}
      </div>
      <div className="mt-2 flex gap-3">
        {c.photoDataUrl && <img src={c.photoDataUrl} alt="" className="h-16 w-16 rounded-md object-cover" />}
        <div className="min-w-0">
          <h3 className="font-sans text-base font-semibold">{catLabel(c.category)}</h3>
          <p className="text-sm text-muted-foreground">{c.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">📍 {c.locality} · {new Date(c.createdAt).toLocaleDateString("en-IN")} · 👥 {c.confirmations} confirmations{c.hasVoiceNote ? " · 🎙 voice note" : ""}</p>
        </div>
      </div>
      <div className="mt-3"><StatusTrack status={c.status} /></div>
      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </article>
  );
}
