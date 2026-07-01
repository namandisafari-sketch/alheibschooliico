// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiscountRule {
  id: string;
  name: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  value: number;
  priority: number;
  applies_to: string;
  filter_value: string | null;
  max_cap: number | null;
  requires_approval: boolean;
  approver_role: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountApplication {
  id: string;
  discount_rule_id: string | null;
  fee_discount_id: string | null;
  learner_id: string | null;
  class_id: string | null;
  fee_structure_id: string | null;
  applied_amount: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  discount_rule?: DiscountRule;
  learner?: any;
}

export const useDiscountRules = () =>
  useQuery({
    queryKey: ["discount-rules"],
    queryFn: async () => {
      const { data } = await supabase
        .from("discount_rules")
        .select("*")
        .order("priority", { ascending: true });
      return (data || []) as DiscountRule[];
    },
  });

export const useDiscountApplications = () =>
  useQuery({
    queryKey: ["discount-applications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("discount_applications")
        .select("*, discount_rule:discount_rules(*), learner:learners(full_name, admission_number, classes(name))")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data || []) as DiscountApplication[];
    },
  });

export const useFeeDiscounts = () =>
  useQuery({
    queryKey: ["fee-discounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fee_discounts")
        .select("*, learner:learners(full_name, admission_number), fee_structure:fee_structures(name, amount)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

export const useCreateDiscountRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("discount_rules").insert({
        ...input,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discount-rules"] });
      toast.success("Discount rule created");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdateDiscountRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const { error } = await supabase.from("discount_rules").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discount-rules"] });
      toast.success("Discount rule updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteDiscountRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discount_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discount-rules"] });
      toast.success("Discount rule removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useApproveDiscount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("discount_applications")
        .update({
          status,
          approved_by: user.user?.id,
          approved_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discount-applications"] });
      qc.invalidateQueries({ queryKey: ["fee-discounts"] });
      toast.success("Discount updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
