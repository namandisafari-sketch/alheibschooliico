
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimetableEntry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  room_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  academic_year: number;
  term: string;
  classes?: { name: string; level: string };
  subjects?: { name: string; code: string };
  profiles?: { full_name: string };
  school_infrastructure?: { name: string };
}

export const useTimetable = (filters?: { class_id?: string; teacher_id?: string; day_of_week?: number }) => {
  return useQuery({
    queryKey: ["class-timetables", filters],
    queryFn: async () => {
      let query = supabase
        .from("class_timetables")
        .select(`
          *,
          classes (name, level),
          subjects (name, code),
          profiles (full_name),
          school_infrastructure (name)
        `);

      if (filters?.class_id) query = query.eq("class_id", filters.class_id);
      if (filters?.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
      if (filters?.day_of_week) query = query.eq("day_of_week", filters.day_of_week);

      const { data, error } = await query.order("day_of_week").order("start_time");
      if (error) throw error;
      return data as TimetableEntry[];
    },
  });
};

export const useUpsertTimetableEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<TimetableEntry>) => {
      const { data, error } = await supabase
        .from("class_timetables")
        .upsert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-timetables"] });
    },
  });
};

export const useDeleteTimetableEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_timetables")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-timetables"] });
    },
  });
};
