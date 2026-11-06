
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/civic/AppShell";
import {
  ComplaintCard,
  Panel,
  Stat,
  SimBadge,
  catLabel,
  isOverdue,
} from "@/components/civic/parts";
import {
  useComplaints,
  useInspectors,
  useInspectionReports,
  useRefresh,
} from "@/lib/api/hooks";
import {
  updateComplaint,
  reviewInspectionReport,
  isDemoMode,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type Complaint } from "@/lib/api/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administrator – CivicAI" },
      {
        name: "description",
        content:
          "Complaint analytics, map, departments, inspectors and resolution tracking.",
      },
      { property: "og:title", content: "Administrator – CivicAI" },
      {
        property: "og:description",
        content: "Civic complaint analytics and accountability dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const DEPTS = [
  "Roads (PWD)",
  "Sanitation",
  "Electricity",
  "Water Supply",
];

// Convert an ISO date into the format required by datetime-local.
function toLocalDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function MiniMap({ items }: { items: Complaint[] }) {
  const pts = items.flatMap((c) =>
    typeof c.lat === "number" && typeof c.lng === "number"
      ? [{ ...c, lat: c.lat, lng: c.lng }]
      : [],
  );

  if (!pts.length)
    return (
      <p className="text-sm text-muted-foreground">
        No geotagged complaints yet.
      </p>
    );

  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);

  const [a, b, c, d] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];

  return (
    <div className="relative h-56 overflow-hidden rounded-lg border bg-secondary">
      {pts.map((p) => (
        <div
          key={p.id}
          title={`${p.id} · ${catLabel(p.category)}`}
          className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${
            p.status === "resolved"
              ? "bg-success"
              : isOverdue(p)
                ? "bg-destructive"
                : "bg-saffron"
          }`}
          style={{
            left: `${10 + ((p.lng - c) / (d - c || 1)) * 80}%`,
            top: `${10 + (1 - (p.lat - a) / (b - a || 1)) * 80}%`,
          }}
        />
      ))}
      <p className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
        Schematic plot · map tiles to be added
      </p>
    </div>
  );
}

function Admin() {
  const { data = [] } = useComplaints();
  const { data: inspectors = [] } = useInspectors();
  const { data: reports = [] } = useInspectionReports();

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useRefresh();

  const simCount = data.filter((c) => c.simulated).length;
  const overdue = data.filter(isOverdue);

  const act = async (id: string, patch: Partial<Complaint>) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await updateComplaint(id, patch);
      await refresh();
      setMessage("Complaint updated successfully.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update complaint.",
      );
    } finally {
      setBusy(false);
    }
  };

  const approve = async (id: string) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await reviewInspectionReport(id);
      await refresh();
      setReviewing(null);
      setMessage(
        "Inspection report reviewed. Complaint marked INSPECTED.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not review report.",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateDeadline = async (id: string, value: string) => {
    if (!value) return;

    const selectedDate = new Date(value);

    if (Number.isNaN(selectedDate.getTime())) {
      setError("Please select a valid deadline.");
      return;
    }

    await act(id, { dueAt: selectedDate.toISOString() });
  };

  return (
    <AppShell role="admin">
      <h1 className="mb-1 text-3xl font-bold">Administration</h1>

      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-3 text-sm text-success">
          {message}
        </p>
      )}

      {isDemoMode && (
        <p className="mb-4 text-xs text-muted-foreground">
          Counts below are computed from the browser demo store — {simCount}{" "}
          of {data.length} records are simulated.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total" value={data.length} />
        <Stat
          label="Open"
          value={data.filter((c) => c.status !== "resolved").length}
        />
        <Stat label="Overdue" value={overdue.length} />
        <Stat
          label="Resolved"
          value={data.filter((c) => c.status === "resolved").length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="By category" className="lg:col-span-1">
          <ul className="space-y-2">
            {CATEGORIES.map((cat) => {
              const n = data.filter(
                (c) => c.category === cat.id,
              ).length;

              return (
                <li key={cat.id} className="text-sm">
                  <div className="flex justify-between">
                    <span>{cat.label}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${data.length ? (n / data.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Complaint map" className="lg:col-span-2">
          <MiniMap items={data} />
        </Panel>

        <Panel title="Inspectors">
          <ul className="space-y-2 text-sm">
            {inspectors.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  {i.name} · {i.ward}
                </span>
                <span className="flex items-center gap-2">
                  {
                    data.filter(
                      (c) =>
                        c.inspectorId === i.id &&
                        c.status !== "resolved",
                    ).length
                  }{" "}
                  open
                  {i.simulated && <SimBadge />}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={`Overdue (${overdue.length})`} className="lg:col-span-2">
          <div className="space-y-3">
            {overdue.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing overdue.
              </p>
            )}

            {overdue.map((c) => (
              <ComplaintCard key={c.id} c={c} />
            ))}
          </div>
        </Panel>
      </div>

      {/* Inspection reports */}
      <Panel title="Inspection reports" className="mt-6">
        <div className="space-y-3">
          {reports.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No inspection reports submitted yet.
            </p>
          )}

          {reports.map((r) => {
            const c = data.find(
              (item) => item.id === r.complaintId,
            );

            if (!c)
              return (
                <p
                  key={r.id}
                  className="text-sm text-muted-foreground"
                >
                  Report for {r.complaintId} — complaint details unavailable.
                </p>
              );

            const inspector = inspectors.find(
              (i) => i.id === r.inspectorId,
            );

            return (
              <ComplaintCard key={r.id} c={c}>
                <div className="w-full space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {inspector?.name ?? r.inspectorId}
                    {inspector && ` · ${inspector.ward}`} ·{" "}
                    {new Date(r.submittedAt).toLocaleString("en-IN")}{" "}
                    {r.simulated && <SimBadge />}
                  </p>

                  {r.reviewedAt ? (
                    <p className="font-medium text-success">
                      Reviewed ·{" "}
                      {new Date(r.reviewedAt).toLocaleString("en-IN")}
                    </p>
                  ) : reviewing !== r.id ? (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => setReviewing(r.id)}
                    >
                      Review inspection report
                    </Button>
                  ) : null}

                  {(r.reviewedAt || reviewing === r.id) && (
                    <>
                      <p className="whitespace-pre-wrap break-words">
                        <span className="font-medium">
                          Inspection findings:{" "}
                        </span>
                        {r.notes}
                      </p>

                      <p className="whitespace-pre-wrap break-words">
                        <span className="font-medium">Remarks: </span>
                        {r.remarks || "No additional remarks."}
                      </p>

                      {!r.reviewedAt && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={
                              busy ||
                              c.status !== "assigned" ||
                              c.inspectorId !== r.inspectorId
                            }
                            onClick={() => approve(r.id)}
                          >
                            {busy ? "Saving…" : "Mark as INSPECTED"}
                          </Button>

                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => setReviewing(null)}
                          >
                            Cancel review
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ComplaintCard>
            );
          })}
        </div>
      </Panel>

      {/* Assignment, severity, deadline and resolution */}
      <Panel
        title="Assignment, severity & resolution"
        className="mt-6"
      >
        <div className="space-y-3">
          {data
            .filter((c) => c.status !== "resolved")
            .map((c) => (
              <ComplaintCard key={c.id} c={c}>
                <div className="w-full space-y-4">
                  {/* Department and inspector assignment */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      aria-label={`Department for ${c.id}`}
                      disabled={busy}
                      value={c.department ?? ""}
                      onChange={(e) =>
                        act(c.id, { department: e.target.value })
                      }
                      className="rounded-md border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="">Department…</option>
                      {DEPTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      aria-label={`Inspector for ${c.id}`}
                      disabled={
                        busy ||
                        (c.status !== "submitted" &&
                          c.status !== "assigned")
                      }
                      value={c.inspectorId ?? ""}
                      onChange={(e) =>
                        act(c.id, {
                          inspectorId: e.target.value,
                          status: "assigned",
                        })
                      }
                      className="rounded-md border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="" disabled>
                        Assign inspector…
                      </option>
                      {inspectors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin severity and deadline controls */}
                  {(c.status === "inspected" ||
                    c.status === "verified") && (
                    <div className="rounded-lg border p-3 space-y-3">
                      <h3 className="font-semibold text-sm">
                        Admin assessment
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="font-medium">
                            Confirm severity
                          </span>
                          <select
                            aria-label={`Confirmed severity for ${c.id}`}
                            disabled={busy}
                            value={c.confirmedSeverity ?? ""}
                            onChange={(e) =>
                              act(c.id, {
                                confirmedSeverity: e.target.value as
                                  | "low"
                                  | "medium"
                                  | "high",
                              })
                            }
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                          >
                            <option value="" disabled>
                              Select severity…
                            </option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>

                        <label className="block text-sm">
                          <span className="font-medium">
                            Resolution deadline
                          </span>
                          <input
                            type="datetime-local"
                            aria-label={`Resolution deadline for ${c.id}`}
                            disabled={busy}
                            min={toLocalDateTime(
                              new Date().toISOString(),
                            )}
                            value={toLocalDateTime(c.dueAt)}
                            onChange={(e) =>
                              updateDeadline(c.id, e.target.value)
                            }
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                          />
                        </label>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        The Admin confirms the official severity and sets
                        the expected resolution deadline after reviewing
                        the inspection report.
                      </p>
                    </div>
                  )}

                  {/* Verification and resolution */}
                  <div className="flex flex-wrap gap-2">
                    {c.status === "inspected" && (
                      <Button
                        variant="outline"
                        disabled={
                          busy ||
                          !c.confirmedSeverity ||
                          !c.dueAt
                        }
                        onClick={() =>
                          act(c.id, { status: "verified" })
                        }
                      >
                        Verify complaint
                      </Button>
                    )}

                    {c.status === "verified" && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          act(c.id, { status: "resolved" })
                        }
                        className="bg-success text-success-foreground"
                      >
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </div>
              </ComplaintCard>
            ))}
        </div>
      </Panel>
    </AppShell>
  );
}
