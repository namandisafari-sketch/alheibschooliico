// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── QURAN PROGRESS ────────────────────────────────────────────────

export const useQuranProgress = (filters?: { learnerId?: string }) => {
  return useQuery({
    queryKey: ["quran-progress", filters],
    queryFn: async () => {
      let q = supabase
        .from("quran_progress")
        .select(`*, learner:learners(full_name, admission_number, class_id), teacher:profiles!quran_progress_teacher_id_fkey(full_name)`)
        .order("recorded_at", { ascending: false });
      if (filters?.learnerId) q = q.eq("learner_id", filters.learnerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useAddQuranProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      learner_id: string;
      surah_name: string;
      surah_number?: number;
      last_ayah: number;
      ayat_covered?: number;
      juz_number?: number;
      juz_from?: number;
      juz_to?: number;
      hifdh_type: string;
      tajweed_score: number;
      makhraj_score?: number;
      hifdh_strength?: number;
      next_review_date?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("quran_progress")
        .insert({
          learner_id: record.learner_id,
          surah_name: record.surah_name,
          surah_number: record.surah_number || null,
          last_ayah: record.last_ayah,
          ayat_covered: record.ayat_covered || null,
          juz_number: record.juz_number || null,
          juz_from: record.juz_from || null,
          juz_to: record.juz_to || null,
          hifdh_type: record.hifdh_type,
          tajweed_score: record.tajweed_score,
          makhraj_score: record.makhraj_score || null,
          hifdh_strength: record.hifdh_strength || null,
          next_review_date: record.next_review_date || null,
          notes: record.notes || null,
          teacher_id: user?.id || null,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quran-progress"] });
    },
  });
};

export const useUpdateQuranProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("quran_progress").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quran-progress"] });
    },
  });
};

// ─── SALAH ATTENDANCE ──────────────────────────────────────────────

export const useSalahAttendance = (date?: string) => {
  return useQuery({
    queryKey: ["salah-attendance", date],
    queryFn: async () => {
      const q = supabase.from("salah_attendance").select(`*, learner:learners(full_name, class_id, admission_number)`);
      if (date) q.eq("date", date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useSalahAttendanceByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["salah-attendance-range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salah_attendance")
        .select(`*, learner:learners(full_name, class_id, admission_number)`)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useSaveSalahAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date, prayerName, records
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
        const { error } = await supabase.from("salah_attendance").update({ status: r.status, recorded_by: userId }).eq("id", r.existingId);
        if (error) throw error;
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("salah_attendance").insert(
          toInsert.map(r => ({
            learner_id: r.learnerId,
            date,
            prayer_name: prayerName,
            status: r.status,
            recorded_by: userId,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salah-attendance"] });
    },
  });
};

// ─── AKHLAAQ REPORTS ───────────────────────────────────────────────

export const useAkhlaaqReports = (filters?: { learnerId?: string; term?: string }) => {
  return useQuery({
    queryKey: ["akhlaaq-reports", filters],
    queryFn: async () => {
      let q = supabase
        .from("akhlaaq_reports")
        .select(`*, learner:learners(full_name, admission_number, class_id), teacher:profiles!akhlaaq_reports_teacher_id_fkey(full_name)`)
        .order("created_at", { ascending: false });
      if (filters?.learnerId) q = q.eq("learner_id", filters.learnerId);
      if (filters?.term) q = q.eq("term", filters.term);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useAddAkhlaaqReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: {
      learner_id: string;
      trait_category: string;
      rating: number;
      comments?: string;
      term?: string;
      academic_year?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("akhlaaq_reports")
        .insert({
          learner_id: report.learner_id,
          trait_category: report.trait_category,
          rating: report.rating,
          comments: report.comments || null,
          term: report.term || null,
          academic_year: report.academic_year || new Date().getFullYear(),
          teacher_id: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["akhlaaq-reports"] });
    },
  });
};

// ─── LEARNER MILESTONES ────────────────────────────────────────────

export const useLearnerMilestones = (learnerId?: string) => {
  return useQuery({
    queryKey: ["learner-milestones", learnerId],
    queryFn: async () => {
      let q = supabase.from("learner_milestones").select("*").order("achieved_date", { ascending: false });
      if (learnerId) q = q.eq("learner_id", learnerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useAddLearnerMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (milestone: {
      learner_id: string;
      milestone_type: string;
      title: string;
      description?: string;
      achieved_date?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("learner_milestones")
        .insert({
          learner_id: milestone.learner_id,
          milestone_type: milestone.milestone_type,
          title: milestone.title,
          description: milestone.description || null,
          achieved_date: milestone.achieved_date || new Date().toISOString().split("T")[0],
          notes: milestone.notes || null,
          recorded_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learner-milestones"] });
    },
  });
};

// ─── MADRASA STATS ─────────────────────────────────────────────────

export const useMadrasaStats = () => {
  return useQuery({
    queryKey: ["madrasa-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [
        quranCountRes,
        uniqueLearnersQuranRes,
        todaySalahRes,
        akhlaaqAvgRes,
        activeMilestonesRes,
      ] = await Promise.all([
        supabase.from("quran_progress").select("*", { count: "exact", head: true }),
        supabase.from("quran_progress").select("learner_id"),
        supabase.from("salah_attendance").select("*", { count: "exact", head: true }).eq("date", today),
        supabase.from("akhlaaq_reports").select("rating"),
        supabase.from("learner_milestones").select("*", { count: "exact", head: true }),
      ]);

      const uniqueLearners = new Set((quranCountRes.data || []).map((r: any) => r.learner_id));
      const avgAkhlaaq = (akhlaaqAvgRes.data || []).reduce((s: number, r: any) => s + (r.rating || 0), 0) / Math.max((akhlaaqAvgRes.data || []).length, 1);

      return {
        totalQuranRecords: quranCountRes.count || 0,
        activeQuranLearners: uniqueLearners.size,
        todaySalahEntries: todaySalahRes.count || 0,
        averageAkhlaaq: parseFloat(avgAkhlaaq.toFixed(1)) || 0,
        totalMilestones: activeMilestonesRes.count || 0,
      };
    },
  });
};
