import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Moon, Home, ChevronRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const BoardingIslamicWidget = () => {
  const navigate = useNavigate();
  
  // Salah Attendance Summary (placeholder for now as it's complex to aggregate)
  const { data: occupancy } = useQuery({
    queryKey: ["hostel-occupancy"],
    queryFn: async () => {
      // Logic for occupancy: total beds vs used
      // For now we'll estimate from student data where boarding_status='boarding'
      const { count, error } = await supabase
        .from("learners")
        .select('*', { count: 'exact', head: true })
        .eq("boarding_status", "boarding");
      
      if (error) throw error;
      return count ?? 0;
    }
  });

  return (
    <Card className="p-4 md:p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden group bg-indigo-50/10">
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-indigo-50/50 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-transform group-hover:scale-110" />
      
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Living & Faith</h4>
          <p className="text-xl md:text-2xl font-black text-slate-900">Boarding Ops</p>
        </div>
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Moon className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm relative group/item overflow-hidden">
           <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover/item:opacity-[0.03] transition-opacity" />
           <Home className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 mb-2 md:mb-3" />
           <p className="text-lg md:text-2xl font-black text-slate-900 truncate">{occupancy}</p>
           <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight">Boarders</p>
        </div>
        
        <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm relative group/item overflow-hidden">
           <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover/item:opacity-[0.03] transition-opacity" />
           <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 mb-2 md:mb-3" />
           <p className="text-lg md:text-2xl font-black text-slate-900 truncate">92%</p>
           <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight">Daily Salah</p>
        </div>
      </div>

      <Button 
        variant="ghost" 
        className="w-full mt-3 md:mt-4 h-8 md:h-10 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 group/btn"
        onClick={() => navigate("/madrasa")}
      >
        Dormitory & Madrasa Registry
        <ChevronRight className="w-3 h-3 ml-1 md:ml-2 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </Card>
  );
};
