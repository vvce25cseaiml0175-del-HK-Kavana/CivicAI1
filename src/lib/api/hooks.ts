import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { listComplaints, listInspectors, listInspectionReports, onDataChange } from "./client";

function useSharedData() {
  const qc = useQueryClient();
  useEffect(() => onDataChange(() => { void qc.invalidateQueries(); }), [qc]);
}

// Client-only queries: demo store lives in the browser.
export const useComplaints = () => {
  useSharedData();
  return useQuery({ queryKey: ["complaints"], queryFn: listComplaints, enabled: typeof window !== "undefined" });
};
export const useInspectors = () =>
  useQuery({ queryKey: ["inspectors"], queryFn: listInspectors, enabled: typeof window !== "undefined" });
export const useInspectionReports = () => {
  useSharedData();
  return useQuery({ queryKey: ["inspection-reports"], queryFn: listInspectionReports, enabled: typeof window !== "undefined" });
};
export const useRefresh = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
};
