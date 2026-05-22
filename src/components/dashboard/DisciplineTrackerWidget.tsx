// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Info, ChevronRight, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const DisciplineTrackerWidget = () => {
  const navigate = useNavigate();
  const { data: cases } = useQuery({
    queryKey: ["recent-discipline-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipline_cases")
        .select(`
          id,
          incident_type,
          severity,
          incident_date,
          status,
          learners (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  return (
    <Card className="p-4 md:p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden group bg-slate-50/20">
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-orange-50/50 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-transform group-hover:scale-110" />
      
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Conduct Control</h4>
          <p className="text-xl md:text-2xl font-black text-slate-900">Discipline Hub</p>
        </div>
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <ShieldAlert className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
        </div>
      </div>

      <div className="space-y-2.5 md:space-y-3">
        {cases && cases.length > 0 ? (
          cases.map((c: any) => (
            <div key={c.id} className="flex items-center gap-2.5 md:gap-4 p-2 md:p-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-orange-100">
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0",
                c.severity === 'critical' ? 'bg-red-100 text-red-600' : 
                c.severity === 'major' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
              )}>
                <UserX className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight truncate">{(c.learners as any)?.full_name}</p>
                <p className="text-[11px] md:text-xs font-bold text-slate-900 truncate leading-none">{c.incident_type}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">{format(new Date(c.incident_date), "MMM d")}</p>
                <div className={cn(
                  "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ml-auto mt-0.5 md:mt-1",
                  c.severity === 'critical' ? 'bg-red-500' : 
                  c.severity === 'major' ? 'bg-orange-500' : 'bg-slate-300'
                )} />
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 md:p-8 text-center bg-white rounded-xl md:rounded-2xl border border-dashed border-slate-200">
             <Info className="w-6 h-6 md:w-8 md:h-8 text-slate-200 mx-auto mb-2" />
             <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Clean Conduct Record</p>
          </div>
        )}
      </div>

      <Button 
        variant="ghost" 
        className="w-full mt-3 md:mt-4 h-8 md:h-10 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 group/btn"
        onClick={() => navigate("/discipline")}
      >
        Conduct Registry
        <ChevronRight className="w-3 h-3 ml-1 md:ml-2 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </Card>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
