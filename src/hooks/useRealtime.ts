import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtime = (table: string, queryKeys: any[][]) => {
  const queryClient = useQueryClient();
  const queryKeysRef = useRef(queryKeys);
  queryKeysRef.current = queryKeys;
  const warnedRef = useRef(false);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        () => {
          queryKeysRef.current.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
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
              `[Realtime] Subscription error for ${table}: ${status}. Live updates disabled.`
            );
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryClient]);
};
