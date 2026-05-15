import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVehicleLogs = () => {
  return useQuery({
    queryKey: ["vehicle-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_logs")
        .select(`
          *,
          recorder:profiles(full_name)
        `)
        .order("entry_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateVehicleLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: any) => {
      const { data, error } = await supabase
        .from("vehicle_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-logs"] });
    },
  });
};

export const useUpdateVehicleExit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, exit_time }: { id: string, exit_time: string }) => {
      const { data, error } = await supabase
        .from("vehicle_logs")
        .update({ exit_time })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-logs"] });
    },
  });
};

export const useExitPasses = (status?: string) => {
  return useQuery({
    queryKey: ["exit-passes", status],
    queryFn: async () => {
      let query = supabase
        .from("exit_passes")
        .select(`
          *,
          learner:learners(full_name, admission_number),
          staff:profiles!exit_passes_staff_id_fkey(full_name),
          approver:profiles!exit_passes_approved_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (status) query = query.eq("status", status);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
