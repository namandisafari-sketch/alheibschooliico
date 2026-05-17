
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useQuranProgress = () => {
  return useQuery({
    queryKey: ["quran-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quran_progress")
        .select(`
          *,
          learner:learners(full_name),
          teacher:profiles(full_name)
        `)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useSalahAttendance = (date?: string) => {
  return useQuery({
    queryKey: ["salah-attendance", date],
    queryFn: async () => {
      const q = supabase.from("salah_attendance").select(`
        *,
        learner:learners(full_name)
      `);
      if (date) q.eq("date", date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useAkhlaaqReports = () => {
  return useQuery({
    queryKey: ["akhlaaq-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("akhlaaq_reports").select(`
        *,
        learner:learners(full_name),
        teacher:profiles(full_name)
      `).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
