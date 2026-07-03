// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCurriculumPlans = (classId?: string, subjectId?: string, term?: string, academicYear?: number) => {
  return useQuery({
    queryKey: ["curriculum-plans", classId, subjectId, term, academicYear],
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
      if (term) query = query.eq("term", term);
      if (academicYear) query = query.eq("academic_year", academicYear);
      
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

export const useExamVenues = (timetableId?: string) => {
  return useQuery({
    queryKey: ["exam-venues", timetableId],
    queryFn: async () => {
      if (!timetableId) return [];
      const { data, error } = await supabase
        .from("exam_venues")
        .select("*")
        .eq("exam_timetable_id", timetableId)
        .order("venue_name");
      if (error) throw error;
      return data;
    },
    enabled: !!timetableId,
  });
};

export const useSeatingPlan = (venueId?: string) => {
  return useQuery({
    queryKey: ["exam-seating-plan", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const { data, error } = await supabase
        .from("exam_seating_plans")
        .select("*")
        .eq("exam_venue_id", venueId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!venueId,
  });
};

export const useSeatAssignments = (seatingPlanId?: string) => {
  return useQuery({
    queryKey: ["exam-seat-assignments", seatingPlanId],
    queryFn: async () => {
      if (!seatingPlanId) return [];
      const { data, error } = await supabase
        .from("exam_seat_assignments")
        .select("*, learner:learners(id, full_name, admission_number)")
        .eq("seating_plan_id", seatingPlanId)
        .order("session_number")
        .order("desk_number");
      if (error) throw error;
      return data;
    },
    enabled: !!seatingPlanId,
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
