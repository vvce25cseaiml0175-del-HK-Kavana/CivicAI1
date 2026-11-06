
// Shared contracts. Mirror these in the Django REST serializers.

export type Role = "citizen" | "inspector" | "admin";

export type Severity = "low" | "medium" | "high";

export const CATEGORIES = [
  { id: "pothole", label: "Potholes" },
  { id: "road_damage", label: "Road damage" },
  { id: "garbage", label: "Garbage" },
  { id: "drainage", label: "Drainage" },
  { id: "streetlight", label: "Streetlights" },
  { id: "water_leak", label: "Water leakage" },
  { id: "other", label: "Other damage" },
] as const;

export type Category = (typeof CATEGORIES)[number]["id"];

export type Status =
  | "submitted"
  | "assigned"
  | "inspected"
  | "verified"
  | "resolved";

export const STATUSES: Status[] = [
  "submitted",
  "assigned",
  "inspected",
  "verified",
  "resolved",
];

export interface Complaint {
  id: string;
  category: Category;
  description: string;
  locality: string;
  lat?: number | undefined;
  lng?: number | undefined;
  photoDataUrl?: string | undefined;
  hasVoiceNote: boolean;
  status: Status;

  // Severity initially reported by the citizen
  reportedSeverity?: Severity;

  // Severity officially confirmed by the Admin
  confirmedSeverity?: Severity;

  // Whether the currently logged-in citizen has confirmed this complaint
  confirmedByMe?: boolean;

  createdAt: string;
  dueAt: string;
  confirmations: number;
  inspectorId?: string;
  department?: string;
  simulated: boolean;

  /** Filled later by the Python AI engine */
  ai?: {
    suggestedCategory?: Category;
    severity?: number;
    duplicateOf?: string;
  };
}

export interface Inspector {
  id: string;
  name: string;
  ward: string;
  simulated: boolean;
}

export interface NewComplaint {
  category: Category;
  description: string;
  locality: string;
  reportedSeverity: Severity;
  lat?: number | undefined;
  lng?: number | undefined;
  photoDataUrl?: string | undefined;
  voiceBlob?: Blob | undefined;
}

export interface InspectionReport {
  complaintId: string;
  notes: string;
  remarks?: string | undefined;
  photoDataUrl?: string | undefined;
}

export interface SubmittedInspectionReport extends InspectionReport {
  id: string;
  inspectorId: string;
  submittedAt: string;
  reviewedAt?: string;
  simulated: boolean;
}
