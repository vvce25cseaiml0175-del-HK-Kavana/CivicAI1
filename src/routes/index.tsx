import { createFileRoute, Link } from "@tanstack/react-router";
import { User, ClipboardCheck, LayoutDashboard, Camera, Mic, MapPin } from "lucide-react";
import { AppShell } from "@/components/civic/AppShell";
import { CATEGORIES } from "@/lib/api/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicAI – Smart Civic Intelligence & Accountability" },
      { name: "description", content: "Report potholes, garbage, drainage and streetlight issues in Indian cities and villages, and track them to resolution." },
      { property: "og:title", content: "CivicAI – Smart Civic Intelligence & Accountability" },
      { property: "og:description", content: "Citizen-powered infrastructure reporting and accountability for Indian cities and villages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ROLES = [
  { to: "/citizen", icon: User, title: "Citizen", text: "Report issues with text, photo or voice. Track and confirm complaints in your area." },
  { to: "/inspector", icon: ClipboardCheck, title: "Field Inspector", text: "View assigned inspections, record findings, work offline and sync later." },
  { to: "/admin", icon: LayoutDashboard, title: "Administrator", text: "Analytics, map, departments, inspectors, overdue cases and resolution tracking." },
] as const;

function Index() {
  return (
    <AppShell>
      <section className="py-6 md:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-saffron">Nagrik · Nirikshak · Prashasan</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold md:text-5xl">Every pothole reported. Every repair accounted for.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          CivicAI connects citizens, field inspectors and civic administrators to fix public infrastructure — powered by people's photographs and reports, not sensors or CCTV.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/citizen/new" className="rounded-lg bg-saffron px-5 py-3 font-semibold text-saffron-foreground shadow-sm hover:opacity-90">Report an issue</Link>
          <Link to="/citizen" className="rounded-lg border bg-card px-5 py-3 font-semibold hover:bg-muted">Track complaints</Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Camera className="h-4 w-4" /> Photo</span>
          <span className="flex items-center gap-1"><Mic className="h-4 w-4" /> Voice note</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Location</span>
        </div>
      </section>

      <h2 className="mb-3 text-2xl font-semibold">Choose your role</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <Link key={r.to} to={r.to} className="group rounded-xl border bg-card p-5 transition hover:border-saffron hover:shadow-md">
            <r.icon className="h-8 w-8 text-primary group-hover:text-saffron" />
            <h3 className="mt-3 text-xl font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-2xl font-semibold">What you can report</h2>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => <span key={c.id} className="rounded-full border bg-secondary px-3 py-1 text-sm">{c.label}</span>)}
      </div>
    </AppShell>
  );
}
