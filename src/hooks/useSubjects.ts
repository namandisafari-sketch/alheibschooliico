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
    mutationFn: async (subject: { name: string; code?: string | null; category?: string | null }) => {
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
