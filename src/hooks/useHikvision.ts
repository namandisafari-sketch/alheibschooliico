import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeviceStatus {
  ok: boolean;
  info?: Record<string, string>;
  error?: string;
}

export interface DeviceMapping {
  id: string;
  employee_no: string;
  user_id: string | null;
  learner_id: string | null;
  device_name: string;
  employee_name: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; email: string; phone: string } | null;
  learners?: { full_name: string } | null;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

function api(path: string, options?: RequestInit) {
  return fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

export function useHikvisionStatus() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/hikvision/status");
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      setStatus({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return { status, loading, refresh: check };
}

export function useHikvisionMappings() {
  return useQuery({
    queryKey: ["hikvision-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_employee_mapping")
        .select("*, profiles:user_id(full_name, email, phone), learners:learner_id(full_name)")
        .order("employee_no");
      if (error) throw error;
      return data as DeviceMapping[];
    },
  });
}

export function useCreateMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: {
      employee_no: string;
      user_id?: string;
      learner_id?: string;
      employee_name?: string;
    }) => {
      const res = await api("/api/hikvision/mappings", {
        method: "POST",
        body: JSON.stringify(mapping),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create mapping");
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hikvision-mappings"] }),
  });
}

export function useDeleteMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api(`/api/hikvision/mappings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete mapping");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hikvision-mappings"] }),
  });
}

export function useHikvisionSync() {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async (from?: string, to?: string) => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await api("/api/hikvision/sync", {
        method: "POST",
        body: JSON.stringify({ from, to }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ synced: 0, failed: 0, errors: [e.message] });
    } finally {
      setSyncing(false);
    }
  }, []);

  return { result, syncing, sync };
}

export function useStaffList() {
  return useQuery({
    queryKey: ["staff-for-hikvision"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useLearnerList() {
  return useQuery({
    queryKey: ["learners-for-hikvision"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learners")
        .select("id, full_name, admission_number")
        .order("full_name")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}
