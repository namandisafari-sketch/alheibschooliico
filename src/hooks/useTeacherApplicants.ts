// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const INTERVIEW_CRITERIA = [
  { key: "subject_knowledge", label: "Subject Knowledge & Expertise", maxScore: 10 },
  { key: "teaching_demo", label: "Teaching Demonstration", maxScore: 10 },
  { key: "communication", label: "Communication & Presentation", maxScore: 10 },
  { key: "classroom_mgmt", label: "Classroom Management", maxScore: 10 },
  { key: "attitude", label: "Attitude & Professionalism", maxScore: 10 },
];

export interface InterviewScore {
  criteria: string;
  score: number;
  max_score: number;
  notes: string;
}

export interface TeacherApplicant {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string;
  qualifications: string | null;
  experience_years: number;
  specialized_subjects: string | null;
  interview_scores: InterviewScore[];
  total_score: number | null;
  max_total_score: number | null;
  interviewer_remarks: string | null;
  status: "pending" | "interviewed" | "hired" | "rejected" | "withdrawn";
  decision: "hire" | "reject" | "hold" | null;
  decision_date: string | null;
  decided_by: string | null;
  created_at: string;
  created_by: string | null;
}

export function useTeacherApplicants() {
  return useQuery({
    queryKey: ["teacher-applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_applicants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TeacherApplicant[];
    },
  });
}

export function useCreateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TeacherApplicant>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("teacher_applicants")
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-applicants"] });
      toast({ title: "Applicant registered" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TeacherApplicant> & { id: string }) => {
      const { data, error } = await supabase
        .from("teacher_applicants")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-applicants"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_applicants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-applicants"] });
      toast({ title: "Applicant removed" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
