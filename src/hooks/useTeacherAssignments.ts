// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTeacherAssignments = (filters?: { classId?: string; teacherId?: string }) => {
  return useQuery({
    queryKey: ["teacher-assignments", filters],
    queryFn: async () => {
      let query = supabase
        .from("teacher_assignments")
        .select(`
          *,
          teacher:profiles(id, full_name),
          class:classes(id, name),
          subject:subjects(id, name)
        `);
      
      if (filters?.classId) query = query.eq("class_id", filters.classId);
      if (filters?.teacherId) query = query.eq("teacher_id", filters.teacherId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: any) => {
      const { data, error } = await supabase
        .from("teacher_assignments")
        .insert(assignment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("teacher_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
  });
};
