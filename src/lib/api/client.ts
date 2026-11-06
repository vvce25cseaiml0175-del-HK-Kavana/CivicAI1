
/**
 * CivicAI API client. UI components call only these functions.
 * Set VITE_CIVIC_API_URL to point at the Django REST backend; until then a
 * browser-local demo store is used and every seeded record is flagged `simulated`.
 */
import { authHeader, getSession } from "./auth";
import type {
  Complaint,
  Inspector,
  InspectionReport,
  SubmittedInspectionReport,
  NewComplaint,
  Status,
} from "./types";

const API = import.meta.env["VITE_CIVIC_API_URL"] as string | undefined;
export const isDemoMode = !API;

const KEY = "civicai.demo.v1";
const QUEUE = "civicai.offline.queue";
const day = 86400000;

export const DEMO_INSPECTOR: Inspector = {
  id: "i1",
  name: "R. Sharma",
  ward: "Ward 12",
  simulated: true,
};

const SEED_INSPECTORS: Inspector[] = [DEMO_INSPECTOR];
const CHANGE_EVENT = "civicai:data-change";

export function onDataChange(listener: () => void) {
  const storage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === QUEUE || e.key === null) listener();
  };

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", storage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", storage);
  };
}

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

function seed(): Complaint[] {
  const now = Date.now();

  const mk = (
    id: string,
    category: Complaint["category"],
    d: string,
    loc: string,
    status: Status,
    ageDays: number,
    extra: Partial<Complaint> = {}
  ): Complaint => ({
    id,
    category,
    description: d,
    locality: loc,
    status,
    hasVoiceNote: false,
    createdAt: new Date(now - ageDays * day).toISOString(),
    dueAt: new Date(now - ageDays * day + 5 * day).toISOString(),
    confirmations: Math.floor(ageDays * 2),
    simulated: true,
    ...extra,
  });

  return [
    mk(
      "SIM-101",
      "pothole",
      "Large pothole near bus stop",
      "MG Road, Ward 12",
      "assigned",
      7,
      {
        inspectorId: "i1",
        department: "Roads (PWD)",
        lat: 12.975,
        lng: 77.605,
      }
    ),
    mk(
      "SIM-102",
      "garbage",
      "Overflowing bin not cleared for days",
      "Gandhi Nagar, Ward 7",
      "submitted",
      2,
      { lat: 12.98, lng: 77.59 }
    ),
    mk(
      "SIM-103",
      "streetlight",
      "Three streetlights not working",
      "Lake View Colony",
      "resolved",
      12,
      {
        department: "Electricity",
        lat: 12.96,
        lng: 77.62,
      }
    ),
    mk(
      "SIM-104",
      "drainage",
      "Blocked drain floods lane during rain",
      "Village Panchayat Rd",
      "inspected",
      4,
      {
        inspectorId: "i1",
        department: "Sanitation",
        lat: 12.99,
        lng: 77.61,
      }
    ),
  ];
}

interface DemoConfirmation {
  complaintId: string;
  citizenId: string;
}

interface Store {
  complaints: Complaint[];
  inspectors: Inspector[];
  inspectionReports: SubmittedInspectionReport[];
  confirmations: DemoConfirmation[];
}

function load(): Store {
  const raw = localStorage.getItem(KEY);

  if (raw) {
    const s = JSON.parse(raw) as Store;

    // Upgrade existing demo data without dropping complaints or priority fields.
    s.inspectors = SEED_INSPECTORS;
    s.inspectionReports ??= [];
    s.confirmations ??= [];

    s.complaints.forEach((c) => {
      if (c.inspectorId === "i2") {
        c.inspectorId = DEMO_INSPECTOR.id;
      }
    });

    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }

  const s: Store = {
    complaints: seed(),
    inspectors: SEED_INSPECTORS,
    inspectionReports: [],
    confirmations: [],
  };

  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

const save = (s: Store) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  notify();
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...init?.headers,
    },
  });

  if (!r.ok) throw new Error(`API ${r.status}`);

  return r.json();
}

export async function listComplaints(): Promise<Complaint[]> {
  if (API) return http("/complaints/");

  const s = load();
  const citizenId = getSession()?.user.id ?? "demo-citizen";

  return s.complaints
    .map((c) => ({
      ...c,
      confirmedByMe: s.confirmations.some(
        (confirmation) =>
          confirmation.complaintId === c.id &&
          confirmation.citizenId === citizenId
      ),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listInspectors(): Promise<Inspector[]> {
  if (API) return http("/inspectors/");

  return load().inspectors;
}

export async function createComplaint(
  input: NewComplaint
): Promise<Complaint> {
  if (API) {
    const fd = new FormData();

    Object.entries(input).forEach(([k, v]) => {
      if (v !== undefined) {
        fd.append(k, v instanceof Blob ? v : String(v));
      }
    });

    const r = await fetch(`${API}/complaints/`, {
      method: "POST",
      body: fd,
      headers: authHeader(),
    });

    if (!r.ok) throw new Error(`API ${r.status}`);

    return r.json();
  }

  const s = load();
  const now = Date.now();

  const c: Complaint = {
    id: `CIV-${String(now).slice(-6)}`,
    category: input.category,
    description: input.description,
    locality: input.locality,
    reportedSeverity: input.reportedSeverity,
    lat: input.lat,
    lng: input.lng,
    photoDataUrl: input.photoDataUrl,
    hasVoiceNote: !!input.voiceBlob,
    status: "submitted",
    createdAt: new Date(now).toISOString(),
    dueAt: new Date(now + 5 * day).toISOString(),
    confirmations: 0,
    simulated: false,
  };

  s.complaints.push(c);
  save(s);

  return c;
}

export async function confirmComplaint(id: string): Promise<void> {
  if (API) {
    await http(`/complaints/${id}/confirm/`, { method: "POST" });
    return;
  }

  const s = load();
  const c = s.complaints.find((x) => x.id === id);

  if (!c) {
    throw new Error("Complaint not found.");
  }

  if (!c.simulated) {
    throw new Error("You cannot confirm your own complaint.");
  }

  if (c.status === "resolved") {
    throw new Error("Resolved complaints cannot be confirmed.");
  }

  const citizenId = getSession()?.user.id ?? "demo-citizen";

  const alreadyConfirmed = s.confirmations.some(
    (confirmation) =>
      confirmation.complaintId === id &&
      confirmation.citizenId === citizenId
  );

  if (alreadyConfirmed) {
    throw new Error("You have already confirmed this complaint.");
  }

  s.confirmations.push({
    complaintId: id,
    citizenId,
  });

  c.confirmations++;

  save(s);
}

export async function updateComplaint(
  id: string,
  patch: Partial<Complaint>
): Promise<void> {
  if (patch.status === "inspected") {
    throw new Error(
      "Review an inspection report before marking a complaint inspected."
    );
  }

  if (API) {
    await http(`/complaints/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return;
  }

  const s = load();
  const c = s.complaints.find((x) => x.id === id);

  if (c) Object.assign(c, patch);

  save(s);
}

/* Django contract: GET/POST /inspections/; POST /inspections/:id/review/.
 * The review endpoint must enforce admin permissions and atomically set status to inspected.
 * Submission accepts complaintId, notes (findings), remarks, photoDataUrl; server supplies identity/time.
 * Django must verify assignment on submission and enforce permissions on all endpoints.
 */

export async function listInspectionReports(): Promise<
  SubmittedInspectionReport[]
> {
  if (API) return http("/inspections/");

  return load().inspectionReports;
}

export async function submitInspection(
  r: InspectionReport & { id?: string }
): Promise<SubmittedInspectionReport> {
  if (API) {
    return http("/inspections/", {
      method: "POST",
      body: JSON.stringify(r),
    });
  }

  const s = load();
  const existing = s.inspectionReports.find((x) => x.id === r.id);

  if (existing) return existing;

  const c = s.complaints.find((x) => x.id === r.complaintId);

  if (!c || c.inspectorId !== DEMO_INSPECTOR.id) {
    throw new Error("This complaint is not assigned to R. Sharma.");
  }

  if (c.status !== "assigned") {
    throw new Error(
      "This complaint is not awaiting an inspection report."
    );
  }

  if (r.notes.trim().length < 3) {
    throw new Error("Enter inspection findings.");
  }

  if (
    s.inspectionReports.some(
      (x) => x.complaintId === c.id && !x.reviewedAt
    )
  ) {
    throw new Error(
      "A report is already awaiting admin review."
    );
  }

  const report: SubmittedInspectionReport = {
    ...r,
    id: r.id ?? crypto.randomUUID(),
    notes: r.notes.trim(),
    remarks: r.remarks?.trim(),
    inspectorId: DEMO_INSPECTOR.id,
    submittedAt: new Date().toISOString(),
    simulated: c.simulated,
  };

  s.inspectionReports.push(report);
  save(s);

  return report;
}

export async function reviewInspectionReport(id: string): Promise<void> {
  if (API) {
    await http(`/inspections/${id}/review/`, { method: "POST" });
    return;
  }

  const s = load();
  const r = s.inspectionReports.find((x) => x.id === id);

  if (!r) throw new Error("Inspection report not found.");

  const c = s.complaints.find((x) => x.id === r.complaintId);

  if (!c) throw new Error("Associated complaint not found.");

  if (r.reviewedAt) return;

  if (
    c.status !== "assigned" ||
    c.inspectorId !== r.inspectorId
  ) {
    throw new Error(
      "The complaint assignment changed. Review its current assignment first."
    );
  }

  r.reviewedAt = new Date().toISOString();
  c.status = "inspected";

  save(s);
}

export const currentInspectorId = () =>
  isDemoMode ? DEMO_INSPECTOR.id : getSession()?.user.id;

/* Offline inspection queue: reports sync without changing official complaint status. */

export function queueInspection(r: InspectionReport) {
  const q = pendingInspections();

  if (q.some((x) => x.complaintId === r.complaintId)) {
    throw new Error(
      "This complaint already has a queued report."
    );
  }

  q.push({ ...r, id: crypto.randomUUID() });

  localStorage.setItem(QUEUE, JSON.stringify(q));
  notify();
}

export const pendingInspections = (): (
  InspectionReport & { id?: string }
)[] => JSON.parse(localStorage.getItem(QUEUE) || "[]");

export async function syncInspections(): Promise<number> {
  const q = pendingInspections();

  for (const r of q) {
    await submitInspection(r);

    const remaining = pendingInspections();

    const index = remaining.findIndex((x) =>
      r.id
        ? x.id === r.id
        : x.complaintId === r.complaintId
    );

    if (index >= 0) remaining.splice(index, 1);

    localStorage.setItem(QUEUE, JSON.stringify(remaining));
    notify();
  }

  return q.length;
}

export function resetDemo() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(QUEUE);
  notify();
}
