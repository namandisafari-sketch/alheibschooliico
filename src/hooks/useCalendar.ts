import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  event_type: 'term' | 'holiday' | 'exam' | 'activity' | 'event';
  color: string;
  is_public: boolean;
  recurrence?: 'none' | 'weekly' | 'monthly' | 'annually' | 'termly';
};

export const useCalendar = () => {
  return useQuery({
    queryKey: ["school-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_calendar")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
};

export const useUpsertCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Partial<CalendarEvent>) => {
      if (event.id) {
        const { error } = await supabase
          .from("school_calendar")
          .update(event)
          .eq("id", event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("school_calendar")
          .insert(event as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-calendar"] });
    }
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("school_calendar")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-calendar"] });
    }
  });
};
