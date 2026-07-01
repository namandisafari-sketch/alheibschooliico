// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LearnerFamily {
  id: string;
  learner_id: string;
  related_learner_id: string;
  relationship_type: string;
  is_emergency_contact: boolean;
  notes: string | null;
  created_at: string;
  related_learner?: {
    full_name: string;
    admission_number: string;
    classes?: { name: string };
  };
}

export const useLearnerFamily = (learnerId?: string) =>
  useQuery({
    queryKey: ["learner-family", learnerId],
    queryFn: async () => {
      if (!learnerId) return [];
      const [{ data: direct }, { data: inverse }] = await Promise.all([
        supabase
          .from("learner_family")
          .select("*, related_learner:learners!related_learner_id(full_name, admission_number, classes(name))")
          .eq("learner_id", learnerId),
        supabase
          .from("learner_family")
          .select("*, related_learner:learners!learner_id(full_name, admission_number, classes(name))")
          .eq("related_learner_id", learnerId),
      ]);
      const mapped = (inverse || []).map((r: any) => ({
        ...r,
        related_learner: r.related_learner,
        relationship_type: r.relationship_type,
      }));
      return [...(direct || []), ...mapped];
    },
    enabled: !!learnerId,
  });

export const useAllLearners = () =>
  useQuery({
    queryKey: ["all-learners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("learners")
        .select("id, full_name, admission_number, class_id, classes(name)")
        .eq("status", "active")
        .order("full_name");
      return data || [];
    },
  });

export const useLinkFamily = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      learner_id: string;
      related_learner_id: string;
      relationship_type: string;
      is_emergency_contact?: boolean;
      notes?: string;
    }) => {
      if (input.learner_id === input.related_learner_id)
        throw new Error("A learner cannot be related to themselves");
      const { error } = await supabase.from("learner_family").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learner-family"] });
      toast.success("Family link added");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRemoveFamilyLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learner_family").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learner-family"] });
      toast.success("Family link removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
