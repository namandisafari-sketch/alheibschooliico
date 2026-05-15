import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Visitor {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  id_number: string | null;
  photo_url: string | null;
  notes: string | null;
  is_recurring: boolean;
  created_at: string;
}

export interface VisitorVisit {
  id: string;
  visitor_id: string | null;
  appointment_id: string | null;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_photo_url: string | null;
  purpose: string | null;
  host_staff_id: string | null;
  host_name: string | null;
  learner_id: string | null;
  badge_number: string | null;
  check_in_at: string;
  check_out_at: string | null;
  status: "checked_in" | "checked_out";
  notes: string | null;
  created_at: string;
}

export const useVisitors = () =>
  useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Visitor[];
    },
  });

export const useCreateVisitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Omit<Visitor, "id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("visitors")
        .insert({ ...v, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Visitor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
  });
};

export const useVisitorVisits = (filter: "active" | "all" = "all") =>
  useQuery({
    queryKey: ["visitor-visits", filter],
    queryFn: async () => {
      let q = supabase
        .from("visitor_visits")
        .select("*")
        .order("check_in_at", { ascending: false })
        .limit(200);
      if (filter === "active") q = q.eq("status", "checked_in");
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as VisitorVisit[];
    },
  });

export const useCheckInVisitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<VisitorVisit> & { visitor_name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const badge = `V-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from("visitor_visits")
        .insert({
          ...input,
          badge_number: input.badge_number || badge,
          status: "checked_in",
          check_in_at: new Date().toISOString(),
          recorded_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Mark linked appointment as checked_in
      if (input.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "checked_in" })
          .eq("id", input.appointment_id);
      }
      return data as VisitorVisit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-visits"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useCheckOutVisitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: VisitorVisit) => {
      const { error } = await supabase
        .from("visitor_visits")
        .update({ status: "checked_out", check_out_at: new Date().toISOString() })
        .eq("id", visit.id);
      if (error) throw error;
      if (visit.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", visit.appointment_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-visits"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
