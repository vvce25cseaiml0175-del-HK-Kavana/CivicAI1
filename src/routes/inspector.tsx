import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/civic/AppShell";
import { ComplaintCard, Panel } from "@/components/civic/parts";
import { Button } from "@/components/ui/button";
import { useComplaints, useInspectionReports, useRefresh } from "@/lib/api/hooks";
import { pendingInspections, queueInspection, syncInspections, submitInspection, currentInspectorId, DEMO_INSPECTOR, isDemoMode, onDataChange } from "@/lib/api/client";

export const Route = createFileRoute("/inspector")({
  head: () => ({
    meta: [
      { title: "Field inspector – CivicAI" },
      { name: "description", content: "Assigned inspections, field notes, photos and offline sync for civic inspectors." },
      { property: "og:title", content: "Field inspector – CivicAI" },
      { property: "og:description", content: "Record inspections offline and sync when connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inspector,
});

function Inspector() {
  const { data = [] } = useComplaints();
  const { data: reports = [] } = useInspectionReports();
  const refresh = useRefresh();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setOnline(navigator.onLine); setPending(pendingInspections().length);
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener("online", on); addEventListener("offline", off);
    const unsubscribe = onDataChange(() => setPending(pendingInspections().length));
    return () => { removeEventListener("online", on); removeEventListener("offline", off); unsubscribe(); };
  }, []);
  const assigned = data.filter((c) => c.inspectorId === currentInspectorId());

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!open || notes.trim().length < 3) { setError("Enter inspection findings (at least 3 characters)."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const report = { complaintId: open, notes: notes.trim(), remarks: remarks.trim() };
      if (online) {
        await submitInspection(report);
        setMessage("Inspection report submitted successfully. Awaiting admin review; official complaint status is unchanged.");
      } else {
        queueInspection(report);
        setMessage("Inspection report saved on this device. Sync when online to submit it for admin review. Official status is unchanged.");
      }
      setPending(pendingInspections().length); setOpen(null); setNotes(""); setRemarks(""); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the inspection report. Please try again."); }
    finally { setBusy(false); }
  };
  const sync = async () => {
    setBusy(true); setError(""); setMessage("");
    try {
      const count = await syncInspections();
      setMessage(`${count} report(s) submitted for admin review. Official complaint statuses are unchanged.`);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Sync failed. Unsent reports remain on this device."); }
    finally { setPending(pendingInspections().length); setBusy(false); }
  };

  return (
    <AppShell role="inspector">
      <h1 className="mb-1 text-3xl font-bold">Field inspections</h1>
      {isDemoMode && <p className="mb-4 text-sm font-medium">{DEMO_INSPECTOR.name} – {DEMO_INSPECTOR.ward}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 text-sm">
        {online ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
        <span>{online ? "Online" : "Offline — reports are saved on this device"}</span>
        <span className="ml-auto">{pending} report(s) waiting to sync</span>
        <Button size="sm" disabled={!online || pending === 0 || busy} onClick={sync}><RefreshCw className="h-4 w-4" /> {busy ? "Saving…" : "Sync"}</Button>
      </div>
      {message && <p role="status" className="mb-4 text-sm text-success">{message}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      <Panel title="Assigned complaints">
        <div className="space-y-3">
          {assigned.map((c) => {
            const report = reports.find((r) => r.complaintId === c.id && !r.reviewedAt) ?? reports.find((r) => r.complaintId === c.id);
            const queued = pending > 0 && pendingInspections().some((r) => r.complaintId === c.id);
            return (
            <ComplaintCard key={c.id} c={c}>
              {open === c.id ? (
                <form onSubmit={save} className="w-full space-y-3">
                  <label className="block text-sm font-medium">Inspection findings
                    <textarea required minLength={3} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm" />
                  </label>
                  <label className="block text-sm font-medium">Remarks (optional)
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={1000} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm" />
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>{busy ? "Submitting…" : online ? "Submit inspection report" : "Save report offline"}</Button>
                    <Button type="button" variant="outline" disabled={busy} onClick={() => { setOpen(null); setNotes(""); setRemarks(""); setError(""); }}>Cancel</Button>
                  </div>
                </form>
              ) : queued ? <p className="text-sm text-muted-foreground">Report saved offline — waiting to sync.</p>
                : report ? <div className="w-full space-y-1 text-sm">
                    <p className="font-medium">{report.reviewedAt ? "Inspection reviewed by admin" : "Report submitted — awaiting admin review"}</p>
                    <p className="whitespace-pre-wrap break-words"><span className="font-medium">Findings: </span>{report.notes}</p>
                    {report.remarks && <p className="whitespace-pre-wrap break-words"><span className="font-medium">Remarks: </span>{report.remarks}</p>}
                  </div>
                : c.status === "assigned" && <Button variant="outline" disabled={busy} onClick={() => { setOpen(c.id); setNotes(""); setRemarks(""); setError(""); setMessage(""); }}>Record Inspection</Button>}
            </ComplaintCard>
          ); })}
          {assigned.length === 0 && <p className="text-sm text-muted-foreground">No complaints assigned to you.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
