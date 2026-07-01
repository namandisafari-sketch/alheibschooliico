// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  description?: string | null;
}

export const useSubjects = () => {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Subject[];
    },
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subject: {
      name: string;
      code?: string | null;
      category?: string | null;
      is_core?: boolean | null;
      grading_type?: string | null;
      display_order?: number | null;
      min_class_level?: number | null;
      max_class_level?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("subjects")
        .insert(subject)
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      code?: string | null;
      category?: string | null;
      is_core?: boolean | null;
      grading_type?: string | null;
      display_order?: number | null;
      min_class_level?: number | null;
      max_class_level?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("subjects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};
