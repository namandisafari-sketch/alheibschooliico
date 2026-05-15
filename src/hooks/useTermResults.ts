import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CompetencyLevel = Database["public"]["Enums"]["competency_level"];
type TermType = Database["public"]["Enums"]["term_type"];

export type SubjectCategory = "academic" | "islamic" | "behavior";
export type GradingType = "numeric" | "letter" | "descriptive";

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  is_core: boolean | null;
  category: SubjectCategory;
  grading_type: GradingType;
  display_order: number;
  min_class_level: number | null;
  max_class_level: number | null;
}

export interface TermResult {
  id: string;
  learner_id: string;
  subject_id: string;
  class_id: string;
  term: TermType;
  academic_year: number;
  score: number | null;
  letter_grade: string | null;
  juz_completed: number | null;
  competency_rating: CompetencyLevel;
  teacher_remarks: string | null;
  recorded_by: string | null;
  learner_name?: string;
  subject_name?: string;
}

export interface TermResultInput {
  learner_id: string;
  subject_id: string;
  class_id: string;
  term: TermType;
  academic_year: number;
  score?: number | null;
  letter_grade?: string | null;
  juz_completed?: number | null;
  competency_rating: CompetencyLevel;
  teacher_remarks?: string | null;
}

export const useTermResults = (
  classId?: string,
  term?: TermType,
  academicYear?: number,
) => {
  return useQuery({
    queryKey: ["term-results", classId, term, academicYear],
    queryFn: async () => {
      let query = supabase.from("term_results").select("*");
      if (classId) query = query.eq("class_id", classId);
      if (term) query = query.eq("term", term);
      if (academicYear) query = query.eq("academic_year", academicYear);

      const { data, error } = await query;
      if (error) throw error;

      const { data: learners } = await supabase
        .from("learners")
        .select("id, full_name");
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, name");

      const learnerMap = new Map(learners?.map((l) => [l.id, l.full_name]) || []);
      const subjectMap = new Map(subjects?.map((s) => [s.id, s.name]) || []);

      return (data || []).map((result) => ({
        ...result,
        learner_name: learnerMap.get(result.learner_id),
        subject_name: subjectMap.get(result.subject_id),
      })) as TermResult[];
    },
    enabled: !!classId,
  });
};

export const useSubjects = (classLevel?: number) => {
  return useQuery({
    queryKey: ["subjects", classLevel],
    queryFn: async () => {
      let query = supabase
        .from("subjects")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name");
      if (classLevel) {
        query = query
          .lte("min_class_level", classLevel)
          .gte("max_class_level", classLevel);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Subject[];
    },
  });
};

export const useSaveTermResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (results: TermResultInput[]) => {
      const { data: user } = await supabase.auth.getUser();
      const payload = results.map((r) => ({
        ...r,
        recorded_by: user.user?.id,
      }));
      const { data, error } = await supabase
        .from("term_results")
        .upsert(payload, {
          onConflict: "learner_id,subject_id,class_id,term,academic_year",
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["term-results"] });
    },
  });
};

// ─── Report cards ──────────────────────────────────────────────────────────

export type ReportStatus = "draft" | "published" | "locked";

export interface ReportCardRow {
  id: string;
  learner_id: string;
  class_id: string;
  term: TermType;
  academic_year: number;
  attendance_percentage: number | null;
  days_present: number | null;
  days_absent: number | null;
  class_teacher_remarks: string | null;
  head_teacher_remarks: string | null;
  islamic_teacher_remarks: string | null;
  overall_competency: CompetencyLevel | null;
  conduct_rating: CompetencyLevel | null;
  discipline_rating: string | null;
  participation_rating: string | null;
  cleanliness_rating: string | null;
  academic_position: number | null;
  islamic_position: number | null;
  class_size: number | null;
  academic_total: number | null;
  academic_average: number | null;
  status: ReportStatus;
  published_at: string | null;
  published_by: string | null;
}

export const useReportCards = (
  classId?: string,
  term?: TermType,
  academicYear?: number,
) => {
  return useQuery({
    queryKey: ["report-cards", classId, term, academicYear],
    queryFn: async () => {
      let query = supabase.from("report_cards").select("*");
      if (classId) query = query.eq("class_id", classId);
      if (term) query = query.eq("term", term);
      if (academicYear) query = query.eq("academic_year", academicYear);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ReportCardRow[];
    },
    enabled: !!classId,
  });
};

export interface ReportCardUpsert {
  learner_id: string;
  class_id: string;
  term: TermType;
  academic_year: number;
  attendance_percentage?: number | null;
  days_present?: number | null;
  days_absent?: number | null;
  class_teacher_remarks?: string | null;
  head_teacher_remarks?: string | null;
  islamic_teacher_remarks?: string | null;
  discipline_rating?: string | null;
  participation_rating?: string | null;
  cleanliness_rating?: string | null;
  academic_position?: number | null;
  islamic_position?: number | null;
  class_size?: number | null;
  academic_total?: number | null;
  academic_average?: number | null;
  overall_competency?: CompetencyLevel | null;
  status?: ReportStatus;
}

export const useUpsertReportCards = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: ReportCardUpsert[]) => {
      const { data, error } = await supabase
        .from("report_cards")
        .upsert(rows, {
          onConflict: "learner_id,class_id,term,academic_year",
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-cards"] }),
  });
};

export const useSetReportStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: ReportStatus;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("report_cards")
        .update({
          status,
          published_at: status === "draft" ? null : new Date().toISOString(),
          published_by: status === "draft" ? null : user.user?.id,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-cards"] }),
  });
};
