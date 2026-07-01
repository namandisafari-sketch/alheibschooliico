// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DossierFilter {
  academicYear?: number;
  termId?: string;
}

export function useLearnerDossier(learnerId: string, filter?: DossierFilter) {
  return useQuery({
    queryKey: ["learner-dossier", learnerId, filter],
    queryFn: async () => {
      if (!learnerId) return null;

      const [
        { data: learner },
        { data: issuedItems },
        { data: academicHistory },
        { data: payments },
        { data: structures },
        { data: assignments },
        { data: discipline },
        { data: attendanceRecords },
      ] = await Promise.all([
        supabase.from("learners").select("*, classes(name, level)").eq("id", learnerId).single(),
        supabase.from("inventory_transactions").select("*, item:inventory_items(name, unit)").eq("learner_id", learnerId).eq("type", "issuance"),
        supabase.from("term_results").select("academic_year, term_id, class:classes(name)").eq("learner_id", learnerId),
        supabase.from("fee_payments").select("*").eq("learner_id", learnerId),
        supabase.from("fee_structures").select("*").eq("is_active", true),
        supabase.from("fee_assignments").select("*").eq("learner_id", learnerId),
        supabase.from("discipline_cases").select("*").eq("learner_id", learnerId).order("incident_date", { ascending: false }),
        supabase.from("attendance").select("*").eq("learner_id", learnerId).order("date", { ascending: false }),
      ]);

      // Apply term/year filter
      const termMonthRanges: Record<string, [number, number]> = {
        term_1: [1, 4],
        term_2: [5, 7],
        term_3: [8, 11],
      };

      const isDateInTerm = (dateStr: string | null, year: number, termId: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (d.getFullYear() !== year) return false;
        const [startM, endM] = termMonthRanges[termId] || [0, 11];
        const m = d.getMonth();
        return m >= startM && m <= endM;
      };

      const year = filter?.academicYear;
      const termId = filter?.termId;

      const filteredDiscipline = year && termId
        ? (discipline || []).filter((d: any) => isDateInTerm(d.incident_date, year, termId))
        : (discipline || []);

      const filteredPayments = year && termId
        ? (payments || []).filter((p: any) => isDateInTerm(p.payment_date, year, termId))
        : (payments || []);

      const filteredAttendance = year && termId
        ? (attendanceRecords || []).filter((a: any) => isDateInTerm(a.date, year, termId))
        : (attendanceRecords || []);

      // Calculate balances from filtered payments
      const applicable = (structures || []).filter((s: any) => {
        if (s.applies_to === "all") return true;
        if (s.class_level && learner?.classes?.level === s.class_level) return true;
        return false;
      });
      const overrides = (assignments || []).filter((a: any) => a.learner_id === learnerId);
      const totalFees = applicable.reduce((sum: number, s: any) => {
        const ov = overrides.find((o: any) => o.fee_structure_id === s.id);
        if (ov?.is_exempted) return sum;
        return sum + Number(ov?.custom_amount ?? s.amount);
      }, 0);
      const totalPaid = filteredPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const balance = totalFees - totalPaid;

      // Process Academic History
      const history = Array.from(new Set((academicHistory || []).map((h: any) => `${h.academic_year} - ${h.class?.name}`)));

      // Attendance summary
      const present = filteredAttendance.filter((a: any) => a.status === "present").length;
      const absent = filteredAttendance.filter((a: any) => a.status === "absent").length;
      const late = filteredAttendance.filter((a: any) => a.status === "late").length;
      const excused = filteredAttendance.filter((a: any) => a.status === "excused").length;

      const attendanceSummary = { present, absent, late, excused, total: filteredAttendance.length };

      // Monthly breakdown for summarized display
      const monthlyMap: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
      filteredAttendance.forEach((a: any) => {
        if (!a.date) return;
        const key = a.date.substring(0, 7);
        if (!monthlyMap[key]) monthlyMap[key] = { present: 0, absent: 0, late: 0, excused: 0 };
        monthlyMap[key][a.status as keyof typeof monthlyMap[string]]++;
      });
      const monthlySummary = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => ({ month, ...counts }));

      return {
        learner,
        issuedItems: issuedItems || [],
        history,
        financials: {
          totalFees,
          totalPaid,
          balance,
          payments: filteredPayments,
        },
        discipline: filteredDiscipline,
        attendance: filteredAttendance,
        attendanceSummary,
        monthlySummary,
        exitDate: learner?.status !== 'active' ? learner?.updated_at : null,
      };
    },
    enabled: !!learnerId
  });
}
