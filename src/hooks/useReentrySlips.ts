import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReentrySlip {
  id: string;
  original_visit_id: string | null;
  visitor_id: string | null;
  visitor_name: string;
  visitor_phone: string | null;
  id_number: string | null;
  purpose: string | null;
  host_name: string | null;
  badge_number: string;
  serial: string;
  duration_minutes: number;
  print_width: number;
  issued_at: string;
  expires_at: string;
  issued_by: string | null;
  notes: string | null;
  voided: boolean;
  voided_at: string | null;
  created_at: string;
}

export const useReentrySlips = () =>
  useQuery({
    queryKey: ["reentry-slips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_reentry_slips")
        .select("*")
        .order("issued_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data || []) as ReentrySlip[];
    },
  });

export const useIssueReentrySlip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      visitor_name: string;
      visitor_phone?: string | null;
      id_number?: string | null;
      purpose?: string | null;
      host_name?: string | null;
      duration_minutes: number;
      print_width: 54 | 80;
      original_visit_id?: string | null;
      visitor_id?: string | null;
      notes?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const issued = new Date();
      const expires = new Date(issued.getTime() + input.duration_minutes * 60_000);
      const serial = `ER-${Date.now().toString().slice(-8)}`;
      const badge = `T-${Date.now().toString().slice(-6)}`;

      const { data, error } = await supabase
        .from("emergency_reentry_slips")
        .insert({
          visitor_name: input.visitor_name,
          visitor_phone: input.visitor_phone ?? null,
          id_number: input.id_number ?? null,
          purpose: input.purpose ?? null,
          host_name: input.host_name ?? null,
          duration_minutes: input.duration_minutes,
          print_width: input.print_width,
          original_visit_id: input.original_visit_id ?? null,
          visitor_id: input.visitor_id ?? null,
          notes: input.notes ?? null,
          badge_number: badge,
          serial,
          issued_at: issued.toISOString(),
          expires_at: expires.toISOString(),
          issued_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ReentrySlip;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reentry-slips"] }),
  });
};

export const useVoidReentrySlip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_reentry_slips")
        .update({ voided: true, voided_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reentry-slips"] }),
  });
};
