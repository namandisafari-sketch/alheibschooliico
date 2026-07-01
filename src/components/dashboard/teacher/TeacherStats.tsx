import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Users, ClipboardCheck, GraduationCap, Star, Loader2, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TeacherStats = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ["teacher-assigned-students", user?.id],
    queryFn: async () => {
      const teacherId = user?.id;
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("class_id")
        .eq("teacher_id", teacherId);
      const { data: leadClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", teacherId);
      const classIds = new Set<string>();
      (assignments || []).forEach((a: any) => { if (a.class_id) classIds.add(a.class_id); });
      (leadClasses || []).forEach((c: any) => classIds.add(c.id));
      if (classIds.size === 0) return 0;
      const { count } = await supabase
        .from("learners")
        .select("id", { count: "exact", head: true })
        .in("class_id", [...classIds]);
      return count || 0;
    },
    refetchInterval: 30000,
    enabled: !!user?.id
  });

  const { data: attendanceData } = useQuery({
    queryKey: ["teacher-today-attendance", user?.id, dateFrom, dateTo],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
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
      if (classIds.length === 0) return { percentage: 100, absent: 0, total: 0 };
      let query = supabase
        .from("attendance")
        .select("id, status")
        .in("class_id", classIds)
        .in("status", ["present", "absent"]);
      if (dateFrom && dateTo) {
        query = query.gte("date", dateFrom).lte("date", dateTo);
      } else if (dateFrom) {
        query = query.gte("date", dateFrom);
      } else if (dateTo) {
        query = query.lte("date", dateTo);
      } else {
        query = query.eq("date", today);
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = data?.length || 0;
      const present = data?.filter((a: any) => a.status === "present").length || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
      const absent = total - present;
      return { percentage, absent, total };
    },
    refetchInterval: 30000,
    enabled: !!user?.id
  });

  const { data: marksData } = useQuery({
    queryKey: ["teacher-marks-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("term_results")
        .select("id, score")
        .eq("recorded_by", user?.id);
      if (error) throw error;
      const total = data?.length || 0;
      const completed = data?.filter((m: any) => m.score !== null && m.score !== undefined).length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const pending = total - completed;
      return { percentage, pending, completed, total };
    },
    refetchInterval: 30000,
    enabled: !!user?.id
  });

  const { data: akhlaaqData } = useQuery({
    queryKey: ["teacher-akhlaaq-score", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("akhlaaq_reports")
        .select("rating")
        .eq("teacher_id", user?.id)
        .not("rating", "is", null);
      if (error) throw error;
      if (!data?.length) return null;
      const sum = data.reduce((acc: number, r: any) => acc + (parseFloat(r.rating) || 0), 0);
      return (sum / data.length).toFixed(1);
    },
    refetchInterval: 30000,
    enabled: !!user?.id
  });

  const liveStats = [
    {
      label: "Assigned Students",
      value: studentsData != null ? studentsData.toString() : "0",
      icon: Users, color: "blue",
      trend: studentsData != null ? `${studentsData} student${studentsData === 1 ? "" : "s"} assigned` : "Loading..."
    },
    {
      label: "Today's Attendance",
      value: `${attendanceData?.percentage ?? 0}%`,
      icon: ClipboardCheck, color: "emerald",
      trend: `${attendanceData?.absent ?? 0} student${(attendanceData?.absent ?? 0) === 1 ? '' : 's'} absent`
    },
    {
      label: "Grading Status",
      value: `${marksData?.percentage ?? 0}%`,
      icon: GraduationCap, color: "indigo",
      trend: `${marksData?.pending ?? 0} pending mark${(marksData?.pending ?? 0) === 1 ? '' : 's'}`
    },
    {
      label: "Avg. Akhlaaq Score",
      value: akhlaaqData != null ? akhlaaqData.toString() : "—",
      icon: Star, color: "amber",
      trend: akhlaaqData != null ? "Based on character reports" : "Awaiting scores"
    }
  ];

  const isLoading = loadingStudents;

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-slate-500" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 text-xs rounded-md border border-input bg-background px-2" />
        <span className="text-xs text-muted-foreground">–</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="h-8 text-xs rounded-md border border-input bg-background px-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {liveStats.map((stat, i) => (
          <Card
            key={i}
            className="group overflow-hidden border-2 border-slate-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-3xl p-5 relative"
          >
            {isLoading && i === 0 && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-3xl">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t(stat.label)}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-1 text-${stat.color}-600`}>{t(stat.trend)}</p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};
