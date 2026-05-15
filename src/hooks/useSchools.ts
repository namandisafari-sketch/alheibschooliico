
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface School {
  id: string;
  name: string;
  district_id: string | null;
  address: string | null;
  region: string | null;
  county: string | null;
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  center_number: string | null;
  license_number: string | null;
  registration_status: 'registered' | 'license valid' | 'license expired' | 'not registered' | null;
  ownership_type: 'government' | 'private' | 'ngo' | 'religious' | 'community' | null;
  academic_level: 'pre-primary' | 'primary' | 'secondary' | 'post-primary' | 'vocational' | null;
  boarding_status: 'day' | 'boarding' | 'mixed' | null;
  gender_status: 'single_boys' | 'single_girls' | 'mixed' | null;
  year_founded: number | null;
  urban_rural: 'urban' | 'rural' | null;
  distance_to_district_hq: number | null;
  distance_to_health_facility: number | null;
  distance_to_bank: number | null;
}

export const useSchools = () => {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as School[];
    },
  });
};

export const useCreateSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (school: Partial<School>) => {
      const { data, error } = await supabase.from("schools").insert(school as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schools"] }),
  });
};

export const useUpdateSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (school: School) => {
      const { data, error } = await supabase
        .from("schools")
        .update(school)
        .eq("id", school.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schools"] }),
  });
};
