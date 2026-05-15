import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TermDetail {
  id: string;
  name: string;
  start_month: string;
  end_month: string;
}

export interface AcademicSettings {
  current_year: number;
  number_of_terms: number;
  current_term_id: string;
  terms: TermDetail[];
  is_automatic: boolean;
}

const DEFAULTS: AcademicSettings = {
  current_year: new Date().getFullYear(),
  number_of_terms: 3,
  current_term_id: "term_1",
  is_automatic: true,
  terms: [
    { id: "term_1", name: "Term I", start_month: "February", end_month: "May" },
    { id: "term_2", name: "Term II", start_month: "June", end_month: "August" },
    { id: "term_3", name: "Term III", start_month: "September", end_month: "December" },
  ],
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const useAcademicSettings = () => {
  return useQuery({
    queryKey: ["academic-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "academic_settings")
        .maybeSingle();
      
      if (error) throw error;
      
      const saved = data?.value as Partial<AcademicSettings>;
      const settings = { ...DEFAULTS, ...(saved || {}) } as AcademicSettings;

      if (settings.is_automatic) {
        const now = new Date();
        settings.current_year = now.getFullYear();
        
        const currentMonthIndex = now.getMonth(); // 0-11
        
        // Find matching term based on month ranges
        for (const term of settings.terms) {
          const startIdx = MONTHS.indexOf(term.start_month);
          const endIdx = MONTHS.indexOf(term.end_month);
          
          if (startIdx !== -1 && endIdx !== -1) {
            // Handle cross-year terms (unlikely for school terms but good to have)
            if (startIdx <= endIdx) {
              if (currentMonthIndex >= startIdx && currentMonthIndex <= endIdx) {
                settings.current_term_id = term.id;
                break;
              }
            } else {
              if (currentMonthIndex >= startIdx || currentMonthIndex <= endIdx) {
                settings.current_term_id = term.id;
                break;
              }
            }
          }
        }
      }

      return settings;
    },
  });
};

export const useUpdateAcademicSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: AcademicSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert([{ key: "academic_settings", value: value as any }], { onConflict: "key" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-settings"] });
    },
  });
};
