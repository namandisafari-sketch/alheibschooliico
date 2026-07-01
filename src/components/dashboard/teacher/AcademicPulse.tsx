import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, addDays, format } from "date-fns";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const AcademicPulse = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["teacher-weekly-pulse", user?.id],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("class_id")
        .eq("teacher_id", user?.id);

      const { data: leadClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user?.id);

      const classIds = [...new Set([
        ...(assignments || []).map((a: any) => a.class_id).filter(Boolean),
        ...(leadClasses || []).map((c: any) => c.id).filter(Boolean)
      ])];

      if (classIds.length === 0) return [];

      const dayData = await Promise.all(
        DAYS.map(async (_, i) => {
          const date = format(addDays(weekStart, i), "yyyy-MM-dd");
          const { data: attendance } = await supabase
            .from("attendance")
            .select("status")
            .eq("date", date)
            .in("class_id", classIds);
          const total = attendance?.length || 0;
          const present = attendance?.filter((a: any) => a.status === "present").length || 0;
          return {
            name: DAYS[i],
            score: total > 0 ? Math.round((present / total) * 100) : 0
          };
        })
      );

      return dayData;
    },
    enabled: !!user?.id
  });

  const scores = chartData.map((d: any) => d.score).filter((s: number) => s > 0);
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const average = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;
  const trendStr = trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : "—";

  return (
    <Card className="border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Activity className="h-32 w-32 text-blue-600" />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="font-black text-slate-900 leading-tight">{t("Class Performance Pulse")}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("This Week Attendance")}</p>
        </div>
        {trendStr !== "—" && (
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-black">{trendStr}</span>
          </div>
        )}
      </div>

      <div className="h-[200px] w-full mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{t("Loading...")}</div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{t("No data yet")}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center relative z-10">
         <div className="flex gap-4">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">{t("Highest")}</p>
               <p className="text-sm font-black text-slate-900">{highest > 0 ? `${highest}%` : "—"}</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">{t("Average")}</p>
               <p className="text-sm font-black text-slate-900">{average > 0 ? `${average}%` : "—"}</p>
            </div>
         </div>
         <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
            {t("Full Report")}
         </button>
      </div>
    </Card>
  );
};
