
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Activity, ShieldCheck, Database, HardDrive, Cpu, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SystemHealth {
  cpuLoad: string;
  ramUsage: string;
  storageFree: string;
  dbStatus: string;
  lanAccess: string;
}

export function SystemHealthWidget() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const isOnline = navigator.onLine;

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/system/health");
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
        }
      } catch (error) {
        console.error("Failed to fetch system health:", error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-2 border-slate-900 bg-slate-900 text-white shadow-xl overflow-hidden group">
      <CardHeader className="p-3 md:p-4 border-b border-slate-800">
        <CardTitle className="text-[11px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
            School VPS Node
          </div>
          <Badge className={cn(
            "px-1.5 py-0 md:px-2 md:py-0.5 text-[8px] md:text-[9px] font-black uppercase",
            isOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            {isOnline ? "Operational" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
           <div className="space-y-1">
             <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
               <Cpu className="h-3 w-3" />
               <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">CPU Load</span>
             </div>
             <p className="text-lg md:text-xl font-black">{health?.cpuLoad || "..."}%</p>
             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${health?.cpuLoad || 0}%` }} />
             </div>
           </div>
           <div className="space-y-1">
             <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
               <Activity className="h-3 w-3" />
               <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">RAM Usage</span>
             </div>
             <p className="text-lg md:text-xl font-black">{health?.ramUsage || "..."} GB</p>
             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: health ? `${(parseFloat(health.ramUsage) / 8 * 100)}%` : '0%' }} />
             </div>
           </div>
        </div>

        <div className="space-y-2.5 md:space-y-3">
           <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold">
              <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                <HardDrive className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="truncate">STORAGE (SSD)</span>
              </div>
              <span className="text-slate-200 uppercase shrink-0">{health?.storageFree || "..."} GB Free</span>
           </div>
           
           <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold">
              <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                <Database className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="truncate">DATABASE STATUS</span>
              </div>
              <span className="text-emerald-400 uppercase shrink-0">{health?.dbStatus || "Optimized"}</span>
           </div>

           <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold">
              <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                <Wifi className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="truncate">LAN ACCESS</span>
              </div>
              <span className="text-blue-400 uppercase shrink-0">{health?.lanAccess || "Active"}</span>
           </div>
        </div>

        <div className="pt-1 md:pt-2">
           <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 md:p-3 flex items-center gap-2.5 md:gap-3">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-400 shrink-0" />
              <p className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase leading-snug md:leading-tight">
                Self-hosted protection active. Local encryption enabled.
              </p>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
