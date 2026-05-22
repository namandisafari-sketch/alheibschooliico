// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePharmacy = () => {
  return useQuery({
    queryKey: ["pharmacy-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useHealthVisits = () => {
  return useQuery({
    queryKey: ["health-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_visits")
        .select(`
          *,
          learner:learners(full_name, admission_number),
          staff:profiles!health_visits_staff_id_fkey(full_name),
          recorder:profiles!health_visits_recorded_by_fkey(full_name)
        `)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateHealthVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visit: any) => {
      const { data, error } = await supabase
        .from("health_visits")
        .insert(visit)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-visits"] });
    },
  });
};

export const useUpdatePharmacy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("pharmacy_items")
        .upsert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacy-items"] });
    },
  });
};

export const useMedicationLogs = () => {
  return useQuery({
    queryKey: ["medication-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_logs")
        .select(`
          *,
          pharmacy_item:pharmacy_items(name, unit),
          visit:health_visits(
            learner:learners(full_name, admission_number)
          ),
          dispenser:profiles(full_name)
        `)
        .order("dispensed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useDispenseMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: any) => {
      // 1. Create log
      const { data, error: logError } = await supabase
        .from("medication_logs")
        .insert(log)
        .select()
        .single();
      if (logError) throw logError;

      // 2. Reduce stock
      const { error: stockError } = await supabase.rpc('decrement_pharmacy_stock', {
        item_id: log.item_id,
        amount: log.quantity
      });
      
      // If RPC fails (e.g. not defined), fallback to manual update
      if (stockError) {
        const { data: item } = await supabase.from("pharmacy_items").select("quantity").eq("id", log.item_id).single();
        if (item) {
          await supabase.from("pharmacy_items").update({ quantity: item.quantity - log.quantity }).eq("id", log.item_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication-logs"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-items"] });
    },
  });
};
