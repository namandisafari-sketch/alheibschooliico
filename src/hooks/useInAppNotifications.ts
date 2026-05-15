import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useInAppNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["in-app-notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("in_app_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as InAppNotification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`in-app-notifs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "in_app_notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["in-app-notifications", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc]);

  return query;
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["in-app-notifications", user?.id] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["in-app-notifications", user?.id] }),
  });
};

export const useBroadcastNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      message: string;
      type?: InAppNotification["type"];
      link?: string;
      audience: "all" | "admins" | "teachers" | "staff" | "user_ids";
      user_ids?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      let userIds: string[] = [];
      if (input.audience === "user_ids") {
        userIds = input.user_ids || [];
      } else if (input.audience === "all") {
        const { data } = await supabase.from("user_roles").select("user_id");
        userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      } else {
        const role =
          input.audience === "admins" ? "admin" : input.audience === "teachers" ? "teacher" : "staff";
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", role);
        userIds = (data || []).map((r: any) => r.user_id);
      }

      if (userIds.length === 0) throw new Error("No recipients found");

      const rows = userIds.map((uid) => ({
        user_id: uid,
        title: input.title,
        message: input.message,
        type: input.type || "info",
        link: input.link || null,
        created_by: user?.id,
      }));
      const { error } = await supabase.from("in_app_notifications").insert(rows);
      if (error) throw error;
      return userIds.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["in-app-notifications"] }),
  });
};
