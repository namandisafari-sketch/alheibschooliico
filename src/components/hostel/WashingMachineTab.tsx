import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, User, Droplets, Zap, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUgandaDateString } from "@/lib/ugandaTime";

export const WashingMachineTab = () => {
  const machines = useQuery({
    queryKey: ["washing-machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .ilike("name", "%wash%")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const todayStr = getUgandaDateString();

  const activeLoad = useQuery({
    queryKey: ["washing-active-load"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("washing_machine_usage")
        .select("*, operator:profiles(full_name), machine:assets(name)")
        .eq("status", "running")
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const todayStats = useQuery({
    queryKey: ["washing-today-stats", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("washing_machine_usage")
        .select("soap_quantity_used, loads_count")
        .gte("start_time", todayStr)
        .lt("start_time", todayStr + " 23:59:59");
      if (error) throw error;
      const rows = data || [];
      const totalLoads = rows.reduce((sum, r) => sum + (r.loads_count ?? 1), 0);
      const soapUsed = rows.reduce((sum, r) => sum + (r.soap_quantity_used ?? 0), 0);
      return { totalLoads, soapUsed };
    },
  });

  const remainingMinutes = useMemo(() => {
    if (!activeLoad.data?.start_time) return null;
    const start = new Date(activeLoad.data.start_time);
    const elapsed = (Date.now() - start.getTime()) / 60000;
    const typicalDuration = 45;
    return Math.max(0, Math.round(typicalDuration - elapsed));
  }, [activeLoad.data]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-lg bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Wind className="h-5 w-5 text-primary" /> Active Load</span>
            {activeLoad.data ? (
              <Badge className="bg-success text-white animate-pulse">Running</Badge>
            ) : (
              <Badge variant="secondary">Idle</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeLoad.isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading...</div>
          ) : activeLoad.data ? (
            <>
              <div className="flex items-center justify-center py-10">
                <div className="relative">
                  <div className="h-40 w-40 rounded-full border-8 border-primary/20 flex items-center justify-center">
                    <div className="h-32 w-32 rounded-full border-8 border-primary border-t-transparent animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-primary">{remainingMinutes ?? "--"}m</p>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-background border shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Operator</p>
                  <p className="font-bold flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {activeLoad.data.operator?.full_name || "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background border shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Machine</p>
                  <p className="font-bold flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5" /> {activeLoad.data.machine?.name || "—"}
                  </p>
                </div>
                {activeLoad.data.soap_quantity_used && (
                  <div className="p-3 rounded-xl bg-background border shadow-sm col-span-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Detergent</p>
                    <p className="font-bold flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5" /> {activeLoad.data.soap_quantity_used}ml
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <Wind className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No active load</p>
              <p className="text-sm">Start a new washing load below.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stats Today</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            {todayStats.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div>
                  <p className="text-3xl font-black text-primary">{todayStats.data?.totalLoads ?? 0}</p>
                  <p className="text-xs font-medium">Total Loads</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-amber-500">{(todayStats.data?.soapUsed ?? 0).toFixed(1)}kg</p>
                  <p className="text-xs font-medium">Soap Used</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-sm font-bold">Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {machines.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : machines.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No washing machines registered.</p>
            ) : (
              machines.data?.map((machine: any) => (
                <div key={machine.id}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{machine.name}</p>
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      machine.last_maintenance_date ? "bg-success/5 border-success/20" : "bg-muted/30 border-muted"
                    }`}>
                      <div className="flex items-center gap-3">
                        <Zap className={`h-4 w-4 ${machine.last_maintenance_date ? "text-success" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">Last Service</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{machine.last_maintenance_date || "N/A"}</Badge>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      machine.next_maintenance_date ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-muted"
                    }`}>
                      <div className="flex items-center gap-3">
                        <Zap className={`h-4 w-4 ${machine.next_maintenance_date ? "text-amber-500" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">Next Service</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">{machine.next_maintenance_date || "N/A"}</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button className="w-full gap-2 shadow-lg shadow-primary/20 py-6 text-lg font-bold" disabled>
          <Plus className="h-5 w-5" /> Start New Load
        </Button>
      </div>
    </div>
  );
};
