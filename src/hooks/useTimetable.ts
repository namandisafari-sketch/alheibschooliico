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

export const useTimetable = (filter?: { class_id?: string }) => {
  return useQuery({
    queryKey: ["timetable", filter],
    queryFn: async () => {
      let query = supabase
        .from("class_timetables")
        .select(`
          *,
          subjects:subjects(name, code),
          profiles:profiles(full_name),
          classes:classes(name)
        `);
      
      if (filter?.class_id && filter.class_id !== 'all') {
        query = query.eq("class_id", filter.class_id);
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
      const { error } = await supabase
        .from("class_timetables")
        .upsert(payload);
      if (error) throw error;
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
export const useClassTimetable = (classId: string, term: string) => useTimetable({ class_id: classId });
export const useCreateTimetableSlot = useUpsertTimetableEntry;
