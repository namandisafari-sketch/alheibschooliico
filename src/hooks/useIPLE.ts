// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IPLEBoard {
  value: "umsc" | "uqsa";
  label: string;
}

export const IPLE_BOARDS: IPLEBoard[] = [
  { value: "umsc", label: "Uganda Muslim Supreme Council (UMSC)" },
  { value: "uqsa", label: "Uganda Quran Schools Association (UQSA)" },
];

export const IPLE_SUBJECTS = [
  { value: "quran", label: "Holy Quran", icon: "book" },
  { value: "fiqh", label: "Al Fiqh (Jurisprudence)", icon: "scale" },
  { value: "arabic", label: "Lughatul Arabiyyah (Arabic)", icon: "pen" },
  { value: "tarbia", label: "Tarbia (Islamic Ethics & History)", icon: "heart" },
];

export const CURRICULUM_TRACKS = [
  { value: "standard", label: "Standard (National Curriculum)" },
  { value: "islamic", label: "Islamic (IPLE Track)" },
  { value: "dual", label: "Dual (Both Curricula)" },
];

export const LETTER_GRADES = ["A", "B+", "B", "C+", "C", "D", "E"];
export const GRADE_POINTS: Record<string, number> = {
  A: 5, "B+": 4, B: 3, "C+": 2, C: 1, D: 0, E: 0,
};

export const useIPLECenterRegistration = () => {
  return useQuery({
    queryKey: ["iple-center-registration"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iple_center_registration")
        .select("*")
        .order("registered_year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpsertIPLECenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (center: any) => {
      const { data, error } = await supabase
        .from("iple_center_registration")
        .upsert(center, { onConflict: "board,registered_year" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iple-center-registration"] });
    },
  });
};

export const useIPLECandidates = (filters?: { academicYear?: number; board?: string }) => {
  return useQuery({
    queryKey: ["iple-candidates", filters],
    queryFn: async () => {
      let query = supabase
        .from("iple_candidates")
        .select(`
          *,
          learner:learners(id, full_name, class_id, curriculum_track, classes:class_id(name))
        `)
        .order("academic_year", { ascending: false });

      if (filters?.academicYear) query = query.eq("academic_year", filters.academicYear);
      if (filters?.board) query = query.eq("board", filters.board);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useRegisterIPLECandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (candidate: {
      learner_id: string;
      registration_number: string;
      academic_year: number;
      board: string;
      center_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("iple_candidates")
        .insert(candidate)
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("learners")
        .update({ curriculum_track: "islamic" })
        .eq("id", candidate.learner_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iple-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["learners"] });
    },
  });
};

export const useRemoveIPLECandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("iple_candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iple-candidates"] });
    },
  });
};

export const useIPLESubjectScores = (candidateId?: string) => {
  return useQuery({
    queryKey: ["iple-subject-scores", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iple_subject_scores")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("subject");
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });
};

export const useUpsertIPLEScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (score: {
      candidate_id: string;
      subject: string;
      written_score?: number;
      oral_score?: number;
      letter_grade?: string;
      remarks?: string;
      assessed_by?: string;
    }) => {
      const { data, error } = await supabase
        .from("iple_subject_scores")
        .upsert(score, { onConflict: "candidate_id,subject" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["iple-subject-scores", variables.candidate_id] });
      queryClient.invalidateQueries({ queryKey: ["iple-aggregated-results"] });
    },
  });
};

export const useIPLEOralExams = (filters?: { candidateId?: string; status?: string }) => {
  return useQuery({
    queryKey: ["iple-oral-exams", filters],
    queryFn: async () => {
      let query = supabase
        .from("iple_oral_examinations")
        .select(`
          *,
          examiner:examiner_id(full_name)
        `)
        .order("exam_date", { ascending: false });

      if (filters?.candidateId) query = query.eq("candidate_id", filters.candidateId);
      if (filters?.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useUpsertIPLEOralExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exam: {
      candidate_id: string;
      subject: string;
      examiner_id?: string;
      exam_date: string;
      status?: string;
      fluency_score?: number;
      accuracy_score?: number;
      comprehension_score?: number;
      examiner_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("iple_oral_examinations")
        .upsert(exam, { onConflict: "candidate_id,subject,exam_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["iple-oral-exams"] });
    },
  });
};

export const useIPLEAggregatedResults = (academicYear?: number) => {
  return useQuery({
    queryKey: ["iple-aggregated-results", academicYear],
    queryFn: async () => {
      let query = supabase
        .from("iple_aggregated_results")
        .select("*")
        .order("aggregate_score", { ascending: false });

      if (academicYear) query = query.eq("academic_year", academicYear);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useLearnersWithoutIPLE = (classId?: string) => {
  return useQuery({
    queryKey: ["learners-without-iple", classId],
    queryFn: async () => {
      const { data: registeredIds } = await supabase
        .from("iple_candidates")
        .select("learner_id")
        .eq("academic_year", new Date().getFullYear());

      const excludedIds = registeredIds?.map((r) => r.learner_id) || [];

      let query = supabase
        .from("learners")
        .select("id, full_name, admission_number, class_id, classes:class_id(name)")
        .in("status", ["active"])
        .order("full_name");

      if (excludedIds.length > 0) query = query.not("id", "in", `(${excludedIds.join(",")})`);
      if (classId) query = query.eq("class_id", classId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
