
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLearnerDossier(learnerId: string) {
  return useQuery({
    queryKey: ["learner-dossier", learnerId],
    queryFn: async () => {
      if (!learnerId) return null;

      const [
        { data: learner },
        { data: issuedItems },
        { data: academicHistory },
        { data: payments },
        { data: structures },
        { data: assignments },
        { data: discipline }
      ] = await Promise.all([
        supabase.from("learners").select("*, classes(name, level)").eq("id", learnerId).single(),
        supabase.from("inventory_transactions").select("*, item:inventory_items(name, unit)").eq("learner_id", learnerId).eq("type", "issuance"),
        supabase.from("term_results").select("academic_year, class:classes(name)").eq("learner_id", learnerId),
        supabase.from("fee_payments").select("*").eq("learner_id", learnerId),
        supabase.from("fee_structures").select("*").eq("is_active", true),
        supabase.from("fee_assignments").select("*").eq("learner_id", learnerId),
        supabase.from("discipline_cases").select("*").eq("learner_id", learnerId).order("incident_date", { ascending: false })
      ]);

      // Calculate Balance
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
      const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const balance = totalFees - totalPaid;

      // Process Academic History (unique years)
      const history = Array.from(new Set((academicHistory || []).map(h => `${h.academic_year} - ${h.class?.name}`)));

      return {
        learner,
        issuedItems: issuedItems || [],
        history,
        financials: {
          totalFees,
          totalPaid,
          balance,
          payments: payments || []
        },
        discipline: discipline || [],
        exitDate: learner?.status !== 'active' ? learner?.updated_at : null
      };
    },
    enabled: !!learnerId
  });
}
