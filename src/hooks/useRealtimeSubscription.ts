import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableConfig = {
  table: string;
  queryKey: string;
  filter?: string;
};

export function useRealtimeInvalidate(tables: TableConfig[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = tables.map(({ table, queryKey, filter }) => {
      const channelName = `realtime-${table}-${Date.now()}`;
      const channelConfig: any = {
        event: "*",
        schema: "public",
        table,
      };
      if (filter) channelConfig.filter = filter;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          channelConfig,
          () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        )
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tables]);
}

export function useRealtimeChannel(
  channelName: string,
  table: string,
  queryKey: string,
  filter?: string
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelConfig: any = {
      event: "*",
      schema: "public",
      table,
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", channelConfig, () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, table, queryKey, filter]);
}
