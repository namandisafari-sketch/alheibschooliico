// @ts-nocheck

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Infrastructure {
  id: string;
  school_id: string;
  asset_type: string;
  name: string | null;
  sitting_capacity: number;
  construction_year: number | null;
  status: 'usable' | 'under_construction' | 'needs_repair' | 'unusable';
}

export interface Sanitation {
  id: string;
  school_id: string;
  facility_type: string;
  target_user: string;
  units_count: number;
  status: 'usable' | 'unusable';
  is_accessible_to_pwd: boolean;
  primary_water_source: string | null;
  has_handwashing_with_soap: boolean;
  has_mhm_changing_room: boolean;
  garbage_disposal_method: string | null;
}

export const useInfrastructure = (schoolId?: string) => {
  return useQuery({
    queryKey: ["infrastructure", schoolId],
    queryFn: async () => {
      let query = supabase.from("school_infrastructure").select("*");
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Infrastructure[];
    },
    enabled: !!schoolId,
  });
};

export const useSanitation = (schoolId?: string) => {
  return useQuery({
    queryKey: ["sanitation", schoolId],
    queryFn: async () => {
      let query = supabase.from("school_sanitation").select("*");
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Sanitation[];
    },
    enabled: !!schoolId,
  });
};

export const useUpdateInfrastructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<Infrastructure> & { id?: string; school_id: string }) => {
      if (item.id) {
        const { data, error } = await supabase.from("school_infrastructure").update(item).eq("id", item.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("school_infrastructure").insert(item).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["infrastructure"] }),
  });
};

export const useUpdateSanitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<Sanitation> & { id?: string; school_id: string }) => {
      if (item.id) {
        const { data, error } = await supabase.from("school_sanitation").update(item).eq("id", item.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("school_sanitation").insert(item).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sanitation"] }),
  });
};

export const useDeleteInfrastructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_infrastructure").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["infrastructure"] }),
  });
};

export const useDeleteSanitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_sanitation").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sanitation"] }),
  });
};