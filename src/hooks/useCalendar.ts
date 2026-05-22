// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      console.log("Fetching school calendar events...");
      const fetchPromise = supabase
        .from("school_calendar")
        .select("*")
        .order("start_date", { ascending: true });

      // Add a 15-second timeout to the fetch
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Calendar fetch timed out")), 15000)
      );

      try {
        const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

        if (error) {
          console.error("Supabase error fetching calendar:", error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} calendar events`);
        return (data || []) as CalendarEvent[];
      } catch (err) {
        console.error("Failed to fetch calendar events:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000,
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
