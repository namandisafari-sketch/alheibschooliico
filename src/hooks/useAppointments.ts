import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Appointment {
  id: string;
  visitor_id: string | null;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string;
  scheduled_for: string;
  duration_minutes: number;
  location: string | null;
  host_staff_id: string | null;
  host_name: string | null;
  learner_id: string | null;
  notes: string | null;
  reminder_enabled: boolean;
  recurrence_pattern: "none" | "daily" | "weekly" | "monthly";
  recurrence_end_at: string | null;
  status: "scheduled" | "checked_in" | "completed" | "cancelled" | "no_show";
  created_at: string;
}

export const useAppointments = (range?: { from?: string; to?: string }) =>
  useQuery({
    queryKey: ["appointments", range],
    queryFn: async () => {
      let q = supabase.from("appointments").select("*").order("scheduled_for", { ascending: true });
      if (range?.from) q = q.gte("scheduled_for", range.from);
      if (range?.to) q = q.lte("scheduled_for", range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Appointment[];
    },
  });

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Appointment, "id" | "created_at" | "status"> & { status?: Appointment["status"] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...input, status: input.status ?? "scheduled", created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
};

export const useUpdateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Appointment> & { id: string }) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
};

export const useDeleteAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
};
