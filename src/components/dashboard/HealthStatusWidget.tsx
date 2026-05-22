// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HealthStatusWidget = () => {
  const navigate = useNavigate();
  const { data: healthStats, isLoading } = useQuery({
    queryKey: ["health-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_visits")
        .select(`
          status,
          priority,
          visit_type,
          learners (full_name)
        `)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 border-2 border-slate-100 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
        <div className="h-8 w-40 bg-slate-100 rounded mb-8" />
        <div className="space-y-4">
          <div className="h-16 bg-slate-50 rounded-2xl" />
          <div className="h-16 bg-slate-50 rounded-2xl" />
        </div>
      </Card>
    );
  }

  const activeCases = healthStats?.length ?? 0;
  const criticalCases = healthStats?.filter(h => h.priority === 'critical' || h.priority === 'high').length ?? 0;

  return (
    <Card className="p-4 md:p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-rose-50/50 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-transform group-hover:scale-110" />
      
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Sick Bay Ops</h4>
          <p className="text-xl md:text-2xl font-black text-slate-900">Medical Cluster</p>
        </div>
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <HeartPulse className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none">Active Admissions</p>
              <p className="text-xs md:text-sm font-black text-slate-900">{activeCases} Patients</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[8px] md:text-[10px] px-1 md:px-2 rounded-lg bg-white border-slate-200">Live</Badge>
        </div>

        <div className={cn(
          "flex items-center justify-between p-2.5 md:p-3 rounded-2xl transition-colors",
          criticalCases > 0 ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"
        )}>
           <div className="flex items-center gap-2 md:gap-3">
            <div className={cn(
              "p-1.5 md:p-2 rounded-lg shadow-sm",
              criticalCases > 0 ? "bg-rose-500" : "bg-emerald-500"
            )}>
              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            <div>
              <p className={cn(
                "text-[9px] md:text-[10px] font-black uppercase tracking-tight leading-none",
                criticalCases > 0 ? "text-rose-600" : "text-emerald-600"
              )}>Severity Alerts</p>
              <p className={cn(
                "text-xs md:text-sm font-black text-nowrap",
                criticalCases > 0 ? "text-rose-900" : "text-emerald-900"
              )}>{criticalCases} Critical</p>
            </div>
          </div>
        </div>
      </div>

      <Button 
        variant="ghost" 
        className="w-full mt-3 md:mt-4 h-8 md:h-10 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#008284] hover:bg-[#008284]/5 group/btn"
        onClick={() => navigate("/health")}
      >
        Access Health Registry
        <ChevronRight className="w-3 h-3 ml-1 md:ml-2 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </Card>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
