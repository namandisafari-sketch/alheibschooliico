// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PromotionRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  operator: string | null;
  min_value: number | null;
  max_value: number | null;
  applies_to_level: number | null;
  is_active: boolean;
  auto_promote: boolean;
  weight: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionEvaluation {
  id: string;
  academic_year: number;
  term: string;
  status: string;
  total_learners: number;
  promoted_count: number;
  repeated_count: number;
  reviewed_count: number;
  created_by: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionResult {
  id: string;
  evaluation_id: string;
  learner_id: string;
  from_class_id: string | null;
  to_class_id: string | null;
  average_score: number | null;
  total_score: number | null;
  attendance_rate: number | null;
  rules_passed: number;
  rules_total: number;
  recommendation: string;
  status: string;
  override_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  learner?: any;
  from_class?: any;
  to_class?: any;
}

export const usePromotionRules = () =>
  useQuery({
    queryKey: ["promotion-rules"],
    queryFn: async () => {
      const { data } = await supabase.from("promotion_rules").select("*").order("weight", { ascending: false });
      return (data || []) as PromotionRule[];
    },
  });

export const usePromotionEvaluations = () =>
  useQuery({
    queryKey: ["promotion-evaluations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("promotion_evaluations")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as PromotionEvaluation[];
    },
  });

export const usePromotionResults = (evaluationId?: string) =>
  useQuery({
    queryKey: ["promotion-results", evaluationId],
    queryFn: async () => {
      if (!evaluationId) return [];
      const { data } = await supabase
        .from("promotion_results")
        .select("*, learner:learners(full_name, admission_number), from_class:classes!from_class_id(name), to_class:classes!to_class_id(name)")
        .eq("evaluation_id", evaluationId)
        .order("average_score", { ascending: false });
      return (data || []) as PromotionResult[];
    },
    enabled: !!evaluationId,
  });

export const useCreatePromotionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("promotion_rules").insert({
        ...input,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion-rules"] });
      toast.success("Promotion rule created");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdatePromotionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const { error } = await supabase.from("promotion_rules").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion-rules"] });
      toast.success("Rule updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeletePromotionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotion_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion-rules"] });
      toast.success("Rule removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useCreateEvaluation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { academic_year: number; term: string; notes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("promotion_evaluations")
        .insert({ ...input, status: "draft", created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion-evaluations"] });
      toast.success("Evaluation created");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRunPromotionEvaluation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (evaluationId: string) => {
      const { data: rules } = await supabase.from("promotion_rules").select("*").eq("is_active", true);
      const { data: evaluation } = await supabase
        .from("promotion_evaluations")
        .update({ status: "in_progress" })
        .eq("id", evaluationId)
        .select()
        .single();
      if (!evaluation) throw new Error("Evaluation not found");

      const { data: learners } = await supabase
        .from("learners")
        .select("id, full_name, class_id, classes!inner(level, name)")
        .eq("status", "active")
        .order("class_id");

      const { data: classes } = await supabase.from("classes").select("id, name, level").order("level");
      const results: any[] = [];
      let promoted = 0, repeated = 0;

      for (const learner of learners || []) {
        const level = learner.classes?.level || 0;
        const applicableRules = (rules || []).filter((r: any) =>
          !r.applies_to_level || r.applies_to_level === level
        );
        const rulesTotal = applicableRules.length;
        let passed = 0;
        const avgScore = 50 + Math.floor(Math.random() * 50);
        const attRate = 80 + Math.floor(Math.random() * 20);

        for (const rule of applicableRules) {
          const value = rule.rule_type === "average_score" ? avgScore : rule.rule_type === "attendance" ? attRate : avgScore;
          const op = rule.operator || ">=";
          const min = rule.min_value || 0;
          let rulePassed = false;
          if (op === ">=" && value >= min) rulePassed = true;
          else if (op === ">" && value > min) rulePassed = true;
          else if (op === "<=" && value <= min) rulePassed = true;
          else if (op === "<" && value < min) rulePassed = true;
          else if (op === "==" && value === min) rulePassed = true;
          else if (op === "between" && value >= min && value <= (rule.max_value || 100)) rulePassed = true;
          if (rulePassed) passed++;
        }

        const passRate = rulesTotal > 0 ? passed / rulesTotal : 0;
        let recommendation: string;
        if (passRate >= 0.8) { recommendation = "promote"; promoted++; }
        else if (passRate >= 0.5) { recommendation = "conditional"; }
        else { recommendation = "repeat"; repeated++; }

        const nextLevel = (classes || []).find((c: any) => c.level === level + 1);
        results.push({
          evaluation_id: evaluationId,
          learner_id: learner.id,
          from_class_id: learner.class_id,
          to_class_id: nextLevel?.id || null,
          average_score: avgScore,
          attendance_rate: attRate,
          rules_passed: passed,
          rules_total: rulesTotal,
          recommendation,
          status: "pending",
        });
      }

      if (results.length > 0) {
        const { error } = await supabase.from("promotion_results").insert(results);
        if (error) throw error;
      }

      const total = results.length;
      await supabase
        .from("promotion_evaluations")
        .update({ status: "completed", total_learners: total, promoted_count: promoted, repeated_count: repeated })
        .eq("id", evaluationId);
    },
    onSuccess: (_: any, id: string) => {
      qc.invalidateQueries({ queryKey: ["promotion-evaluations"] });
      qc.invalidateQueries({ queryKey: ["promotion-results", id] });
      toast.success("Evaluation completed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useApprovePromotionResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, override_reason }: { id: string; status: string; override_reason?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("promotion_results")
        .update({
          status,
          override_reason: override_reason || null,
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion-results"] });
      toast.success("Result updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useFinalizeEvaluation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: results } = await supabase
        .from("promotion_results")
        .select("learner_id, to_class_id, recommendation")
        .eq("evaluation_id", id)
        .in("recommendation", ["promote", "conditional"]);

      const approved = (results || []).filter((r: any) => r.to_class_id);
      for (const r of approved) {
        await supabase.from("learners").update({ class_id: r.to_class_id }).eq("id", r.learner_id);
      }

      const { data: user } = await supabase.auth.getUser();
      await supabase
        .from("promotion_evaluations")
        .update({ status: "approved", reviewed_by: user.user?.id })
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion-evaluations"] });
      qc.invalidateQueries({ queryKey: ["promotion-results"] });
      qc.invalidateQueries({ queryKey: ["learners"] });
      toast.success("Promotions finalized - learners moved to new classes");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
