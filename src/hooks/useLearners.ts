// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Learner {
  id: string;
  full_name: string;
  gender: "male" | "female";
  date_of_birth: string | null;
  district: string | null;
  status: string | null;
  admission_number: string | null;
  enrollment_date: string | null;
  class_id: string | null;
  guardian_id: string | null;
  photo_url: string | null;
  religion: string | null;
  uneb_index_number?: string | null;
  boarding_status?: string | null;
  pupil_status?: string | null;
  class_name?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  classes?: { name: string } | null;
  guardian?: { full_name: string; phone: string } | null;
}

export const useLearners = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["learners", profile?.scope, profile?.district_id],
    queryFn: async () => {
      let query = supabase.from("learners").select("*");

      if (profile?.scope === "district" && profile.district_id) {
        // Assuming learners.district stores the GeoNames ID or we match by it
        query = query.eq("district", profile.district_id);
      } else if (profile?.scope === "school" && profile.school_id) {
        // If we want to filter by school too
        // query = query.eq("school_id", profile.school_id);
      }

      const { data: learners, error: learnersError } = await query.order("full_name");

      if (learnersError) throw learnersError;

      // Fetch classes and guardians for joining
      const { data: classes } = await supabase.from("classes").select("id, name");
      const { data: guardians } = await supabase.from("guardians").select("id, full_name, phone");

      const classMap = new Map(classes?.map((c) => [c.id, c.name]) || []);
      const guardianMap = new Map(
        guardians?.map((g) => [g.id, { name: g.full_name, phone: g.phone }]) || []
      );

      return learners.map((learner) => ({
        ...learner,
        class_name: learner.class_id ? classMap.get(learner.class_id) : null,
        guardian_name: learner.guardian_id ? guardianMap.get(learner.guardian_id)?.name : null,
        guardian_phone: learner.guardian_id ? guardianMap.get(learner.guardian_id)?.phone : null,
      })) as Learner[];
    },
  });
};

export const useUpdateLearner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Learner> & { id: string }) => {
      const { data, error } = await supabase
        .from("learners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners"] });
    },
  });
};

export const useDeleteLearner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners"] });
    },
  });
};