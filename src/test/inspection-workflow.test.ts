import { beforeEach, describe, expect, it } from "vitest";
import { createComplaint, listComplaints, listInspectors, listInspectionReports, updateComplaint, submitInspection, reviewInspectionReport, queueInspection, syncInspections, pendingInspections, currentInspectorId } from "@/lib/api/client";

beforeEach(() => localStorage.clear());
const assigned = async () => {
  const c = await createComplaint({ category: "pothole", description: "Pothole by school", locality: "Ward 12" });
  await updateComplaint(c.id, { inspectorId: "i1", status: "assigned" });
  return c;
};

describe("Inspection workflow", () => {
  it("uses only R. Sharma – Ward 12, preserving existing complaints and priority fields", async () => {
    const c = await assigned();
    const s = JSON.parse(localStorage.getItem("civicai.demo.v1") ?? "{}");
    s.complaints[0].inspectorId = "i2";
    s.complaints[0].priority = "high";
    localStorage.setItem("civicai.demo.v1", JSON.stringify(s));
    expect(await listInspectors()).toEqual([{ id: "i1", name: "R. Sharma", ward: "Ward 12", simulated: true }]);
    expect(currentInspectorId()).toBe("i1");
    const complaints = await listComplaints();
    expect(complaints.find((x) => x.id === "SIM-101")).toMatchObject({ inspectorId: "i1", priority: "high" });
    expect(complaints.find((x) => x.id === c.id)).toBeDefined();
  });

  it("persists findings and remarks but leaves official status assigned", async () => {
    const c = await assigned();
    await submitInspection({ complaintId: c.id, notes: "Physically inspected the pothole", remarks: "Repairs required" });
    expect(await listInspectionReports()).toEqual([expect.objectContaining({ complaintId: c.id, notes: "Physically inspected the pothole", remarks: "Repairs required", inspectorId: "i1" })]);
    expect((await listComplaints()).find((x) => x.id === c.id)?.status).toBe("assigned");
  });

  it("rejects inspector reports for unassigned complaints", async () => {
    await expect(submitInspection({ complaintId: "SIM-102", notes: "Inspected" })).rejects.toThrow("not assigned");
    expect(await listInspectionReports()).toEqual([]);
  });

  it("requires report review rather than a direct official INSPECTED update", async () => {
    const c = await assigned();
    await expect(updateComplaint(c.id, { status: "inspected" })).rejects.toThrow("Review an inspection report");
    expect((await listComplaints()).find((x) => x.id === c.id)?.status).toBe("assigned");
  });

  it("admin review changes the shared complaint to inspected and records review time", async () => {
    const c = await assigned();
    const r = await submitInspection({ complaintId: c.id, notes: "Physically inspected" });
    await reviewInspectionReport(r.id);
    expect((await listComplaints()).find((x) => x.id === c.id)?.status).toBe("inspected");
    expect((await listInspectionReports())[0]?.reviewedAt).toEqual(expect.any(String));
  });

  it("syncs offline reports to admin without changing official status", async () => {
    const c = await assigned();
    queueInspection({ complaintId: c.id, notes: "Checked on site", remarks: "Needs repair" });
    expect(await listInspectionReports()).toEqual([]);
    expect(await syncInspections()).toBe(1);
    expect(pendingInspections()).toEqual([]);
    expect((await listInspectionReports())[0]).toMatchObject({ notes: "Checked on site", remarks: "Needs repair" });
    expect((await listComplaints()).find((x) => x.id === c.id)?.status).toBe("assigned");
  });

  it("keeps failed offline submissions on the device", async () => {
    queueInspection({ complaintId: "SIM-102", notes: "Checked on site" });
    await expect(syncInspections()).rejects.toThrow("not assigned");
    expect(pendingInspections()).toHaveLength(1);
  });
});