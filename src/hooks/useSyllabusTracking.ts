// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCurriculumTopics = (planId?: string) => {
  return useQuery({
    queryKey: ["curriculum-topics", planId],
    queryFn: async () => {
      let query = supabase
        .from("curriculum_topics")
        .select(`*, curriculum_plan:curriculum_plans(topic_title, class:classes(name), subject:subjects(name))`)
        .order("sequence_order");
      if (planId) query = query.eq("curriculum_plan_id", planId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCurriculumTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (topic: any) => {
      const { data, error } = await supabase.from("curriculum_topics").insert(topic).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum-topics"] }),
  });
};

export const useUpdateCurriculumTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("curriculum_topics").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum-topics"] }),
  });
};

export const useDeleteCurriculumTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculum_topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum-topics"] }),
  });
};

export const useSchemeOfWork = (filters?: {
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  term?: string;
  academicYear?: number;
}) => {
  return useQuery({
    queryKey: ["scheme-of-work", filters],
    queryFn: async () => {
      let query = supabase
        .from("scheme_of_work")
        .select(`*, teacher:profiles(full_name, phone), class:classes(name), subject:subjects(name)`)
        .order("week_number");
      if (filters?.teacherId) query = query.eq("teacher_id", filters.teacherId);
      if (filters?.classId) query = query.eq("class_id", filters.classId);
      if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
      if (filters?.term) query = query.eq("term", filters.term);
      if (filters?.academicYear) query = query.eq("academic_year", filters.academicYear);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateSchemeOfWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: any) => {
      const { data, error } = await supabase.from("scheme_of_work").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheme-of-work"] }),
  });
};

export const useUpdateSchemeOfWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("scheme_of_work").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheme-of-work"] }),
  });
};

export const useDeleteSchemeOfWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheme_of_work").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheme-of-work"] }),
  });
};

export const useCopySchemeOfWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromTerm, toTerm, teacherId }: { fromTerm: string; toTerm: string; teacherId: string }) => {
      const { data: source } = await supabase
        .from("scheme_of_work")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("term", fromTerm);
      if (!source?.length) throw new Error("No schemes found for source term");
      const entries = source.map((s: any) => ({
        teacher_id: teacherId,
        class_id: s.class_id,
        subject_id: s.subject_id,
        week_number: s.week_number,
        term: toTerm,
        academic_year: s.academic_year || new Date().getFullYear(),
        topic: s.topic,
        sub_topic: s.sub_topic,
        planned_lessons: s.planned_lessons,
        day: s.day,
        theme: s.theme,
        subtheme: s.subtheme,
        content: s.content,
        competences: s.competences,
        methods: s.methods,
        activities: s.activities,
        life_skills: s.life_skills,
        learning_aids: s.learning_aids,
        references: s.references,
        remarks: s.remarks,
      }));
      const { data, error } = await supabase.from("scheme_of_work").insert(entries).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheme-of-work"] }),
  });
};

export const useLessonRegister = (filters?: {
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  dateFrom?: string;
  dateTo?: string;
  academicYear?: number;
  term?: string;
}) => {
  return useQuery({
    queryKey: ["lesson-register", filters],
    queryFn: async () => {
      let query = supabase
        .from("lesson_register")
        .select(`*, teacher:profiles(full_name, phone), class:classes(name), subject:subjects(name), lesson_plan:lesson_plans(title)`)
        .order("date", { ascending: false });
      if (filters?.teacherId) query = query.eq("teacher_id", filters.teacherId);
      if (filters?.classId) query = query.eq("class_id", filters.classId);
      if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
      if (filters?.dateFrom) query = query.gte("date", filters.dateFrom);
      if (filters?.dateTo) query = query.lte("date", filters.dateTo);
      if (filters?.academicYear) query = query.eq("academic_year", filters.academicYear);
      if (filters?.term) query = query.eq("term", filters.term);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLessonRegisterEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: any) => {
      const { data, error } = await supabase.from("lesson_register").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-register"] }),
  });
};

export const useUpdateLessonRegisterEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("lesson_register").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-register"] }),
  });
};
