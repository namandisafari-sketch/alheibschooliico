import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, BookOpen } from "lucide-react";

export const DynamicAcademicProgress = () => {
  const { data: progress } = useQuery({
    queryKey: ["academic-progress-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_performance_logs")
        .select("metric_value")
        .eq("metric_type", "lesson_plan_completion")
        .order("recorded_at", { ascending: false });

      if (error) return 78; // Fallback to default
      if (!data || data.length === 0) return 78;
      
      // Calculate average of latest metrics
      const sum = data.reduce((acc, curr) => acc + Number(curr.metric_value), 0);
      return Math.round(sum / data.length);
    }
  });

  const value = progress ?? 78;

  return (
    <div className="p-6 bg-white border-2 border-slate-100 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Academic Milestone</h4>
        <BookOpen className="h-4 w-4 text-[#008284]" />
      </div>
      <div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-black text-slate-900">{value}%</p>
          <div className="flex items-center text-emerald-500 text-[10px] font-black mb-1">
             <TrendingUp className="w-3 h-3 mr-0.5" />
             +2.4%
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Master Syllabus Completion</p>
      </div>
      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-900 transition-all duration-1000 ease-out" 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
};
