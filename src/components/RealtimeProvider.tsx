import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const TABLES = [
  { table: "learners" },
  { table: "classes" },
  { table: "fee_payments" },
  { table: "fee_structures" },
  { table: "fee_assignments" },
  { table: "guardians" },
  { table: "attendance" },
  { table: "inventory_items" },
  { table: "inventory_transactions" },
  { table: "term_results" },
  { table: "exam_series" },
  { table: "exam_timetable" },
  { table: "notification_templates" },
  { table: "subjects" },
  { table: "lesson_plans" },
  { table: "homework" },
  { table: "profiles" },
  { table: "visitors" },
  { table: "visitor_visits" },
  { table: "discipline_cases" },
  { table: "in_app_notifications" },
  { table: "report_cards" },
  { table: "site_settings" },
  { table: "appointments" },
  { table: "parent_learner_links" },
  { table: "inventory_stock" },
  { table: "assets" },
];

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const warnedRef = useRef(false);

  useEffect(() => {
    const channels = TABLES.map(({ table }) => {
      const channel = supabase
        .channel(`rt-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            queryClient.invalidateQueries({ queryKey: [table] });
          }
        )
        .subscribe((status) => {
          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            if (!warnedRef.current) {
              warnedRef.current = true;
              console.warn(
                `[Realtime] WebSocket unavailable — live updates disabled. Data refreshes via polling.`
              );
            }
          }
        });

      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [queryClient]);

  return <>{children}</>;
}
