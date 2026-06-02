// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FeeStructure {
  id: string;
  name: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  class_level: number | null;
  applies_to: string;
  term: string | null;
  academic_year: number;
  is_active: boolean;
}

export interface FeePayment {
  id: string;
  receipt_number: string;
  learner_id: string;
  fee_structure_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  term: string | null;
  academic_year: number;
  payment_date: string;
  notes: string | null;
  collected_by: string | null;
  created_at: string;
}

export interface BursarRule {
  id: string;
  name: string;
  rule_type: string;
  balance_threshold: number;
  class_id: string | null;
  applies_to_all_classes: boolean;
  is_active: boolean;
}

export const generateReceiptNumber = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `RCP-${part(8)}-${part(4)}`;
};

export const useFeeStructures = () =>
  useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FeeStructure[];
    },
  });

export const useFeePayments = () =>
  useQuery({
    queryKey: ["fee-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*, learners(full_name, admission_number, classes(name))")
        .order("payment_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as any[];
    },
  });

export const useBursarRules = () =>
  useQuery({
    queryKey: ["bursar-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bursar_rules")
        .select("*, classes(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useOverrideRequests = () =>
  useQuery({
    queryKey: ["override-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bursar_override_requests")
        .select("*, learners(full_name, admission_number)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

// Compute per-learner balances by combining fee structures + payments
export const useStudentBalances = () =>
  useQuery({
    queryKey: ["student-balances"],
    queryFn: async () => {
      const [{ data: learners }, { data: structures }, { data: payments }, { data: assignments }] =
        await Promise.all([
          supabase.from("learners").select("id, full_name, admission_number, class_id, classes(name, level)").eq("status", "active"),
          supabase.from("fee_structures").select("*").eq("is_active", true),
          supabase.from("fee_payments").select("learner_id, amount"),
          supabase.from("fee_assignments").select("*"),
        ]);

      return (learners || []).map((l: any) => {
        const applicable = (structures || []).filter((s: any) => {
          if (s.applies_to === "all") return true;
          if (s.class_level && l.classes?.level === s.class_level) return true;
          return false;
        });
        const overrides = (assignments || []).filter((a: any) => a.learner_id === l.id);
        const total = applicable.reduce((sum: number, s: any) => {
          const ov = overrides.find((o: any) => o.fee_structure_id === s.id);
          if (ov?.is_exempted) return sum;
          return sum + Number(ov?.custom_amount ?? s.amount);
        }, 0);
        // Add learner-specific structures (those with applies_to !== 'all' but in assignments)
        const paid = (payments || [])
          .filter((p: any) => p.learner_id === l.id)
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const balance = total - paid;
        const status = balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending";
        return {
          id: l.id,
          full_name: l.full_name,
          admission_number: l.admission_number,
          class_name: l.classes?.name,
          total,
          paid,
          balance,
          status,
        };
      });
    },
  });

export const useCreateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<FeeStructure>) => {
      const { error } = await supabase.from("fee_structures").insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success("Fee structure added");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<FeeStructure> & { id: string }) => {
      const { error } = await supabase.from("fee_structures").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
      qc.invalidateQueries({ queryKey: ["student-balances"] });
      toast.success("Removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      learner_id: string;
      amount: number;
      payment_method: string;
      reference_number?: string;
      notes?: string;
      term?: string;
      fee_structure_id?: string;
    }) => {
      const receipt_number = generateReceiptNumber();
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("fee_payments")
        .insert({
          ...input,
          receipt_number,
          collected_by: userData.user?.id,
          academic_year: new Date().getFullYear(),
        })
        .select("*, learners(full_name, admission_number, classes(name))")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-payments"] });
      qc.invalidateQueries({ queryKey: ["student-balances"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useCreateBursarRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BursarRule>) => {
      const { error } = await supabase.from("bursar_rules").insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bursar-rules"] });
      toast.success("Rule created");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useToggleBursarRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("bursar_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bursar-rules"] }),
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteBursarRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bursar_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bursar-rules"] });
      toast.success("Rule removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useResolveOverrideRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, review_notes }: { id: string; status: "approved" | "denied"; review_notes?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("bursar_override_requests")
        .update({
          status,
          review_notes: review_notes || null,
          reviewed_by: userData.user?.id || null,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["override-requests"] });
      toast.success("Override request successfully resolved.");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const formatUGX = (amount: number) =>
  `USh ${new Intl.NumberFormat("en-US").format(Math.round(amount))}`;
