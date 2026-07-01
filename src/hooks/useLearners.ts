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
  pupil_status?: string | null;
  class_name?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  guardian_relationship?: string | null;
  arabic_name?: string | null;
  sponsorship_number?: string | null;
  sponsorship_type?: string | null;
  sponsorship_agency?: string | null;
  dormitory?: string | null;
  area?: string | null;
  nira_document_type?: string | null;
  classes?: { name: string } | null;
  guardian?: { full_name: string; phone: string } | null;
}

export const useLearners = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["learners", profile?.scope, profile?.district_id],
    queryFn: async () => {
      console.log("Supabase: Fetching learners...");
      let query = supabase.from("learners").select("*");

      if (profile?.scope === "district" && profile.district_id) {
        query = query.eq("district", profile.district_id);
      } else if (profile?.scope === "school" && profile.school_id) {
        // Filter by school
      }

      const { data: learners, error: learnersError } = await query.order("full_name");

      if (learnersError) {
        console.error("Supabase: Error fetching learners:", learnersError);
        throw learnersError;
      }

      console.log(`Supabase: Found ${learners?.length || 0} learners`);

      // Fetch classes and guardians for joining
      const { data: classes } = await supabase.from("classes").select("id, name");
      const { data: guardians } = await supabase.from("guardians").select("id, full_name, phone");
      
      console.log(`Supabase: Found ${classes?.length || 0} classes and ${guardians?.length || 0} guardians`);

      const classMap = new Map(classes?.map((c) => [c.id, c.name]) || []);
      const guardianMap = new Map(
        guardians?.map((g) => [g.id, { name: g.full_name, phone: g.phone }]) || []
      );

      return learners.map((learner) => ({
        ...learner,
        class_name: learner.class_id ? classMap.get(learner.class_id) : null,
        guardian_name: learner.guardian_id ? guardianMap.get(learner.guardian_id)?.name : (learner.guardian_name || learner.parent_name),
        guardian_phone: learner.guardian_id ? guardianMap.get(learner.guardian_id)?.phone : learner.parent_phone,
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

export const usePromoteAll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceClassId,
      targetClassId,
      academicYear,
    }: {
      sourceClassId: string;
      targetClassId: string | null;
      academicYear: number;
    }) => {
      const { data: learners, error: lError } = await supabase
        .from("learners")
        .select("id, class_id")
        .eq("class_id", sourceClassId)
        .eq("status", "active");

      if (lError) throw lError;
      if (!learners?.length) return { promoted: 0 };

      if (targetClassId) {
        const { error: uError } = await supabase
          .from("learners")
          .update({ class_id: targetClassId })
          .eq("class_id", sourceClassId)
          .eq("status", "active");
        if (uError) throw uError;

        const records = learners.map((l) => ({
          learner_id: l.id,
          academic_year: academicYear,
          class_id: targetClassId,
          status: "promoted" as const,
        }));

        const { error: rError } = await supabase
          .from("learner_academic_records")
          .insert(records);
        if (rError) throw rError;
      } else {
        const { error: uError } = await supabase
          .from("learners")
          .update({ status: "graduated" })
          .eq("class_id", sourceClassId)
          .eq("status", "active");
        if (uError) throw uError;

        const records = learners.map((l) => ({
          learner_id: l.id,
          academic_year: academicYear,
          class_id: sourceClassId,
          status: "graduated" as const,
        }));

        const { error: rError } = await supabase
          .from("learner_academic_records")
          .insert(records);
        if (rError) throw rError;
      }

      return { promoted: learners.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

export const useDeleteAllLearners = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("learners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

export const useMarkAsLeft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      learnerId,
      classId,
      exitReason,
      exitDate,
      destinationText,
      notes,
    }: {
      learnerId: string;
      classId?: string | null;
      exitReason: string;
      exitDate: string;
      destinationText?: string;
      notes?: string;
    }) => {
      const status = exitReason === "transferred" ? "transferred" : "inactive";

      const { error: uError } = await supabase
        .from("learners")
        .update({ status })
        .eq("id", learnerId);
      if (uError) throw uError;

      const { error: rError } = await supabase
        .from("learner_academic_records")
        .insert({
          learner_id: learnerId,
          academic_year: new Date().getFullYear(),
          class_id: classId || null,
          status: "left",
          exit_reason: exitReason,
          exit_date: exitDate || new Date().toISOString().split("T")[0],
          destination_text: destinationText || null,
          notes: notes || null,
        });
      if (rError) throw rError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners"] });
    },
  });
};