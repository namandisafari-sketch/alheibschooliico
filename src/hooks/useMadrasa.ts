// @ts-nocheck

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useQuranProgress = () => {
  return useQuery({
    queryKey: ["quran-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quran_progress")
        .select(`
          *,
          learner:learners(full_name),
          teacher:profiles(full_name)
        `)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useSalahAttendance = (date?: string) => {
  return useQuery({
    queryKey: ["salah-attendance", date],
    queryFn: async () => {
      const q = supabase.from("salah_attendance").select(`
        *,
        learner:learners(full_name, class_id)
      `);
      if (date) q.eq("date", date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useSaveSalahAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      prayerName,
      records
    }: {
      date: string;
      prayerName: string;
      records: { learnerId: string; status: string; existingId?: string }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const toUpdate = records.filter(r => r.existingId);
      const toInsert = records.filter(r => !r.existingId);

      for (const r of toUpdate) {
        const { error } = await supabase
          .from("salah_attendance")
          .update({
            status: r.status,
            recorded_by: userId,
          })
          .eq("id", r.existingId);
        if (error) throw error;
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("salah_attendance").insert(
          toInsert.map(r => ({
            learner_id: r.learnerId,
            date,
            prayer_name: prayerName,
            status: r.status,
            recorded_by: userId
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salah-attendance"] });
    }
  });
};

export const useAddQuranProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      learner_id: string;
      surah_name: string;
      last_ayah: number;
      hifdh_type: string;
      tajweed_score: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const { data, error } = await supabase
        .from("quran_progress")
        .insert({
          learner_id: record.learner_id,
          surah_name: record.surah_name,
          last_ayah: record.last_ayah,
          hifdh_type: record.hifdh_type,
          tajweed_score: record.tajweed_score,
          notes: record.notes || null,
          teacher_id: userId,
          recorded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quran-progress"] });
    }
  });
};

export const useAkhlaaqReports = () => {
  return useQuery({
    queryKey: ["akhlaaq-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("akhlaaq_reports").select(`
        *,
        learner:learners(full_name),
        teacher:profiles(full_name)
      `).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
