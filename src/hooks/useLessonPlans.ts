// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLessonPlans = (filters?: { teacherId?: string; weekNumber?: number; academicYear?: number }) => {
  return useQuery({
    queryKey: ["lesson-plans", filters],
    queryFn: async () => {
      let query = supabase
        .from("lesson_plans")
        .select(`
          *,
          teacher:profiles(full_name),
          class:classes(name),
          subject:subjects(name)
        `);
      
      if (filters?.teacherId) query = query.eq("teacher_id", filters.teacherId);
      if (filters?.weekNumber) query = query.eq("week_number", filters.weekNumber);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLessonPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: any) => {
      const { data, error } = await supabase
        .from("lesson_plans")
        .insert(plan)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-plans"] });
    },
  });
};

export const useUpdateLessonPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from("lesson_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-plans"] });
    },
  });
};
