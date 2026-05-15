// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SalaryRecord {
  id: string;
  staff_id: string;
  basic_salary: number;
  allowances: number | null;
  deductions: number | null;
  net_salary: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  staff?: {
    full_name: string;
    role: string;
    email: string | null;
  };
}

export interface SalaryPayment {
  id: string;
  salary_record_id: string;
  staff_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  status: string;
  notes: string | null;
  paid_by: string | null;
  created_at: string;
  staff?: {
    full_name: string;
  };
}

export const useSalaryRecords = () => {
  return useQuery({
    queryKey: ["salary-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_records")
        .select(`
          *,
          staff:profiles!salary_records_staff_id_fkey(full_name, role, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SalaryRecord[];
    },
  });
};

export const useSalaryPayments = (staffId?: string) => {
  return useQuery({
    queryKey: ["salary-payments", staffId],
    queryFn: async () => {
      let query = supabase
        .from("salary_payments")
        .select(`
          *,
          staff:profiles!salary_payments_staff_id_fkey(full_name)
        `)
        .order("payment_date", { ascending: false });

      if (staffId) {
        query = query.eq("staff_id", staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SalaryPayment[];
    },
  });
};

export const useCreateSalaryRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: {
      staff_id: string;
      basic_salary: number;
      allowances?: number;
      deductions?: number;
      currency?: string;
      effective_from: string;
      effective_to?: string | null;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("salary_records")
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
    },
  });
};

export const useUpdateSalaryRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...record }: Partial<SalaryRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("salary_records")
        .update(record)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
    },
  });
};

export const useCreateSalaryPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      salary_record_id: string;
      staff_id: string;
      amount: number;
      payment_date: string;
      payment_method?: string;
      reference_number?: string;
      status?: string;
      notes?: string;
      paid_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("salary_payments")
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-payments"] });
    },
  });
};