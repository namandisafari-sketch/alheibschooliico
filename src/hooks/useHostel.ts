import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
        .update({ is_active: false, released_date: new Date().toISOString().slice(0, 10) })
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
      if (values.status === "returned") patch.returned_date = new Date().toISOString().slice(0, 10);
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
