// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

// ─── Prescriptions ────────────────────────────────────────────────
export const usePrescriptions = (filters?: { status?: string; learnerId?: string }) => {
  return useQuery({
    queryKey: ["prescriptions", filters],
    queryFn: async () => {
      let q = supabase
        .from("prescriptions")
        .select("*, learner:learners(full_name, admission_number, class_id), prescriber:profiles!prescriptions_prescribed_by_fkey(full_name)")
        .order("prescribed_date", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.learnerId) q = q.eq("learner_id", filters.learnerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rx: any) => {
      const { data, error } = await supabase.from("prescriptions").insert(rx).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
};

export const useDispensePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("prescriptions").update({ status: "dispensed", ...updates }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
};

// ─── Pharmacy Inventory Batches ───────────────────────────────────
export const useInventoryBatches = (itemId?: string) => {
  return useQuery({
    queryKey: ["pharmacy-inventory-batches", itemId],
    queryFn: async () => {
      let q = supabase.from("pharmacy_inventory_batches").select("*, item:pharmacy_items(name, unit)").order("expiry_date");
      if (itemId) q = q.eq("pharmacy_item_id", itemId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useAddInventoryBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batch: any) => {
      const { data, error } = await supabase.from("pharmacy_inventory_batches").insert(batch).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-inventory-batches"] });
      qc.invalidateQueries({ queryKey: ["pharmacy-items"] });
    },
  });
};

// ─── Pharmacy Emergencies ─────────────────────────────────────────
export const usePharmacyEmergencies = (status?: string) => {
  return useQuery({
    queryKey: ["pharmacy-emergencies", status],
    queryFn: async () => {
      let q = supabase
        .from("pharmacy_emergencies")
        .select("*, learner:learners(full_name, admission_number, class_id), reporter:profiles!pharmacy_emergencies_reported_by_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });
};

export const useCreatePharmacyEmergency = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emergency: any) => {
      const { data, error } = await supabase.from("pharmacy_emergencies").insert(emergency).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-emergencies"] });
    },
  });
};

export const useUpdatePharmacyEmergency = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("pharmacy_emergencies").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-emergencies"] });
    },
  });
};

// ─── Reorder Requests ─────────────────────────────────────────────
export const useReorderRequests = (status?: string) => {
  return useQuery({
    queryKey: ["pharmacy-reorder-requests", status],
    queryFn: async () => {
      let q = supabase
        .from("pharmacy_reorder_requests")
        .select("*, item:pharmacy_items(name, unit), requester:profiles!pharmacy_reorder_requests_requested_by_fkey(full_name), approver:profiles!pharmacy_reorder_requests_approved_by_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateReorderRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: any) => {
      const { data, error } = await supabase.from("pharmacy_reorder_requests").insert(req).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-reorder-requests"] });
    },
  });
};

export const useUpdateReorderRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("pharmacy_reorder_requests").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-reorder-requests"] });
    },
  });
};

// ─── Pharmacy Notifications ───────────────────────────────────────
export const usePharmacyNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel("pharmacy-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pharmacy_notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    // Fetch existing
    supabase
      .from("pharmacy_notifications")
      .select("*")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return notifications;
};

export const useCreateNotification = () => {
  return useMutation({
    mutationFn: async (notification: any) => {
      const { data, error } = await supabase.from("pharmacy_notifications").insert(notification).select().single();
      if (error) throw error;
      return data;
    },
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pharmacy_notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-notifications"] });
    },
  });
};
