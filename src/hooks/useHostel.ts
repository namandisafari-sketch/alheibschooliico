// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUgandaDateString } from "@/lib/ugandaTime";
import { toast } from "@/hooks/use-toast";

export interface Dormitory {
  id: string;
  name: string;
  gender: "boys" | "girls" | "mixed";
  capacity: number;
  matron_staff_id: string | null;
  location: string | null;
  notes: string | null;
}

export interface DormitoryResident {
  id: string;
  dormitory_id: string;
  learner_id: string;
  bed_number: string | null;
  assigned_date: string;
  released_date: string | null;
  is_active: boolean;
  notes: string | null;
  learner?: { full_name: string; admission_number: string | null; gender: string; photo_url: string | null; class_id: string | null };
  dormitory?: { name: string; gender: string };
}

export interface LearnerEssential {
  id: string;
  learner_id: string;
  item_id: string;
  quantity: number;
  issued_date: string;
  condition: string;
  status: string;
  returned_date: string | null;
  notes: string | null;
  item?: { name: string; unit: string };
  learner?: { full_name: string; admission_number: string | null };
}

export const useDormitories = () => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["dormitories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dormitories").select("*").order("name");
      if (error) throw error;
      return data as Dormitory[];
    },
  });
  const upsert = useMutation({
    mutationFn: async (values: Partial<Dormitory> & { name: string; gender: string }) => {
      if (values.id) {
        const { error } = await supabase.from("dormitories").update(values).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dormitories").insert(values as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dormitories"] });
      toast({ title: "Saved", description: "Dormitory saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dormitories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dormitories"] });
      toast({ title: "Deleted", description: "Dormitory removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return { list, upsert, remove };
};

export const useDormitoryResidents = (dormitoryId?: string) => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["dormitory-residents", dormitoryId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("dormitory_residents")
        .select("*, learner:learners(full_name, admission_number, gender, photo_url, class_id), dormitory:dormitories(name, gender)")
        .eq("is_active", true)
        .order("bed_number");
      if (dormitoryId) q = q.eq("dormitory_id", dormitoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as DormitoryResident[];
    },
  });
  const assign = useMutation({
    mutationFn: async (values: { dormitory_id: string; learner_id: string; bed_number?: string; notes?: string }) => {
      const { error } = await supabase.from("dormitory_residents").insert(values as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dormitory-residents"] });
      toast({ title: "Assigned", description: "Resident assigned to dormitory" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const release = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dormitory_residents")
        .update({ is_active: false, released_date: getUgandaDateString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dormitory-residents"] });
      toast({ title: "Released", description: "Resident released" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return { list, assign, release };
};

export const useLearnerEssentials = (learnerId?: string) => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["learner-essentials", learnerId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("learner_essentials")
        .select("*, item:inventory_items(name, unit), learner:learners(full_name, admission_number)")
        .order("issued_date", { ascending: false });
      if (learnerId) q = q.eq("learner_id", learnerId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as LearnerEssential[];
    },
  });
  const issue = useMutation({
    mutationFn: async (values: { learner_id: string; item_id: string; quantity: number; condition?: string; notes?: string }) => {
      const { error } = await supabase.from("learner_essentials").insert({
        learner_id: values.learner_id,
        item_id: values.item_id,
        quantity: values.quantity,
        condition: values.condition || "good",
        status: "present",
        notes: values.notes,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learner-essentials"] });
      toast({ title: "Issued", description: "Item issued to learner" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateStatus = useMutation({
    mutationFn: async (values: { id: string; status: string; condition?: string; notes?: string }) => {
      const patch: any = { status: values.status };
      if (values.condition) patch.condition = values.condition;
      if (values.notes !== undefined) patch.notes = values.notes;
      if (values.status === "returned") patch.returned_date = getUgandaDateString();
      const { error } = await supabase.from("learner_essentials").update(patch).eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learner-essentials"] });
      toast({ title: "Updated", description: "Item status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return { list, issue, updateStatus };
};

export interface HolidayArrivalClearance {
  id: string;
  learner_id: string;
  arrival_date: string;
  holiday_type: string | null;
  guardian_name: string | null;
  relative_relationship: string | null;
  phone_number: string | null;
  dormitory_number: string | null;
  proposed_dormitory: string | null;
  weight: string | null;
  height: string | null;
  chronic_disease_history: string | null;
  health_status: string | null;
  health_signature: string | null;
  school_uniforms: number;
  sports_wear: number;
  sweater: number;
  track_suits: number;
  shoes: number;
  kanzu_hijab: number;
  vests: number;
  casual_wears: number;
  cap_veils: number;
  stockings: number;
  underwear_pants: number;
  matron_status: string;
  head_teacher_status: string;
  internal_supervisor_status: string;
  centre_director_status: string;
  matron_notes: string | null;
  head_teacher_notes: string | null;
  internal_supervisor_notes: string | null;
  centre_director_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  learner?: { full_name: string; admission_number: string | null; class_id: string | null; gender: string | null };
}

export const useHolidayArrivalClearances = () => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["holiday-arrival-clearances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holiday_arrival_clearances")
        .select("*, learner:learners(full_name, admission_number, class_id, gender)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as HolidayArrivalClearance[];
    },
  });

  const create = useMutation({
    mutationFn: async (values: {
      learner_id: string;
      arrival_date: string;
      holiday_type?: string;
      guardian_name?: string;
      relative_relationship?: string;
      phone_number?: string;
      dormitory_number?: string;
      proposed_dormitory?: string;
      weight?: string;
      height?: string;
      chronic_disease_history?: string;
      health_status?: string;
      health_signature?: string;
      school_uniforms?: number;
      sports_wear?: number;
      sweater?: number;
      track_suits?: number;
      shoes?: number;
      kanzu_hijab?: number;
      vests?: number;
      casual_wears?: number;
      cap_veils?: number;
      stockings?: number;
      underwear_pants?: number;
      matron_notes?: string;
    }) => {
      const { error } = await supabase.from("holiday_arrival_clearances").insert({
        learner_id: values.learner_id,
        arrival_date: values.arrival_date,
        holiday_type: values.holiday_type || null,
        guardian_name: values.guardian_name || null,
        relative_relationship: values.relative_relationship || null,
        phone_number: values.phone_number || null,
        dormitory_number: values.dormitory_number || null,
        proposed_dormitory: values.proposed_dormitory || null,
        weight: values.weight || null,
        height: values.height || null,
        chronic_disease_history: values.chronic_disease_history || null,
        health_status: values.health_status || null,
        health_signature: values.health_signature || null,
        school_uniforms: values.school_uniforms ?? 0,
        sports_wear: values.sports_wear ?? 0,
        sweater: values.sweater ?? 0,
        track_suits: values.track_suits ?? 0,
        shoes: values.shoes ?? 0,
        kanzu_hijab: values.kanzu_hijab ?? 0,
        vests: values.vests ?? 0,
        casual_wears: values.casual_wears ?? 0,
        cap_veils: values.cap_veils ?? 0,
        stockings: values.stockings ?? 0,
        underwear_pants: values.underwear_pants ?? 0,
        matron_notes: values.matron_notes || null,
        status: "in_progress",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holiday-arrival-clearances"] });
      toast({ title: "Created", description: "Holiday arrival clearance created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStage = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { id, ...patch } = values;
      const { error } = await supabase.from("holiday_arrival_clearances").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holiday-arrival-clearances"] });
      toast({ title: "Updated", description: "Clearance stage updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { list, create, updateStage };
};
