// @ts-nocheck

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useHomework = (filters?: { classId?: string; subjectId?: string }) => {
  return useQuery({
    queryKey: ["homework", filters],
    queryFn: async () => {
      let query = supabase
        .from("homework")
        .select(`
          *,
          class:classes(name),
          subject:subjects(name),
          teacher:profiles(full_name)
        `)
        .order("deadline", { ascending: true });

      if (filters?.classId && filters.classId !== "all") {
        query = query.eq("class_id", filters.classId);
      }
      if (filters?.subjectId && filters.subjectId !== "all") {
        query = query.eq("subject_id", filters.subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateHomework = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newHomework: any) => {
      const { data, error } = await supabase
        .from("homework")
        .insert(newHomework)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      toast({
        title: "Homework Created",
        description: "The assignment has been successfully posted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useHomeworkSubmissions = (homeworkId?: string) => {
  return useQuery({
    queryKey: ["homework-submissions", homeworkId],
    queryFn: async () => {
      if (!homeworkId) return [];
      const { data, error } = await supabase
        .from("homework_submissions")
        .select(`
          *,
          learner:learners(full_name)
        `)
        .eq("homework_id", homeworkId);

      if (error) throw error;
      return data;
    },
    enabled: !!homeworkId,
  });
};

export const useHomeworkResources = (subjectId?: string) => {
  return useQuery({
    queryKey: ["homework-resources", subjectId],
    queryFn: async () => {
      let query = supabase.from("homework_resources").select(`
        *,
        subject:subjects(name)
      `);
      
      if (subjectId && subjectId !== "all") {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
