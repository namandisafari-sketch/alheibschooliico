// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TimetableEntry = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  room_id?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes?: string | null;
  term?: string;
  subjects?: { name: string; code: string };
  profiles?: { full_name: string };
  classes?: { name: string };
};

export const useTimetable = (filter?: { class_id?: string; term?: string }) => {
  return useQuery({
    queryKey: ["timetable", filter],
    enabled: Boolean(filter?.class_id),
    queryFn: async () => {
      let query = supabase
        .from("class_timetables")
        .select(`
          *,
          subjects:subjects(name, code),
          profiles:profiles(full_name),
          classes:classes(name),
          room:school_infrastructure(name)
        `);
      
      if (filter?.class_id && filter.class_id !== 'all') {
        query = query.eq("class_id", filter.class_id);
      }
      if (filter?.term && filter.term !== 'all') {
        query = query.eq("term", filter.term);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TimetableEntry[];
    },
  });
};

export const useUpsertTimetableEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { class_id, day_of_week, start_time, term, ...rest } = payload;
      const { data: existing } = await supabase
        .from("class_timetables")
        .select("id")
        .eq("class_id", class_id)
        .eq("day_of_week", day_of_week)
        .eq("start_time", start_time)
        .eq("term", term || "term_1")
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("class_timetables")
          .update({ ...rest, term: term || "term_1", id: existing.id })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("class_timetables")
          .insert({ class_id, day_of_week, start_time, term: term || "term_1", ...rest });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
};

export const useDeleteTimetableEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_timetables")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
};

// Aliases for compatibility
export const useClassTimetable = (classId: string, term: string) => useTimetable({ class_id: classId, term });
export const useCreateTimetableSlot = useUpsertTimetableEntry;
