
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDisciplineFlags() {
  return useQuery({
    queryKey: ["discipline-flags"],
    queryFn: async () => {
      // Get all pending critical or major cases
      const { data, error } = await supabase
        .from("discipline_cases")
        .select("*")
        .in("severity", ["major", "critical"])
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by learner_id to only show the most recent active flag
      const flagMap: Record<string, any> = {};
      data?.forEach(c => {
        if (!flagMap[c.learner_id]) {
          flagMap[c.learner_id] = c;
        }
      });
      return flagMap;
    }
  });
}
