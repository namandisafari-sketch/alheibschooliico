import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCurriculumPlans = (classId?: string, subjectId?: string) => {
  return useQuery({
    queryKey: ["curriculum-plans", classId, subjectId],
    queryFn: async () => {
      let query = supabase
        .from("curriculum_plans")
        .select(`
          *,
          class:classes(name),
          subject:subjects(name),
          coverage:syllabus_coverage(*)
        `)
        .order("sequence_order");
      
      if (classId) query = query.eq("class_id", classId);
      if (subjectId) query = query.eq("subject_id", subjectId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateSyllabusCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coverage: any) => {
      const { data, error } = await supabase
        .from("syllabus_coverage")
        .upsert(coverage)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-plans"] });
    },
  });
};

export const useExamSeries = () => {
  return useQuery({
    queryKey: ["exam-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_series")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useExamTimetable = (seriesId?: string) => {
  return useQuery({
    queryKey: ["exam-timetable", seriesId],
    queryFn: async () => {
      let query = supabase
        .from("exam_timetable")
        .select(`
          *,
          class:classes(name),
          subject:subjects(name),
          invigilator:profiles(full_name)
        `)
        .order("exam_date")
        .order("start_time");
      
      if (seriesId) query = query.eq("series_id", seriesId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
