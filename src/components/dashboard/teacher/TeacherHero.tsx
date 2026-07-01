import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { Sparkles, Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TeacherHero = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: academicSettings } = useAcademicSettings();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Teacher';
  const hour = new Date().getHours();

  let greeting = "Good Morning";
  if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
  if (hour >= 17) greeting = "Good Evening";

  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const currentTermId = academicSettings?.current_term_id ?? "term_1";
  const terms = academicSettings?.terms ?? [];
  const activeTermName = terms.find(t => t.id === currentTermId)?.name || "Term I";

  const { data: syllabusPct = 0 } = useQuery({
    queryKey: ["teacher-syllabus-pct", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("syllabus_coverage")
        .select("status")
        .eq("teacher_id", user?.id);
      if (error) throw error;
      if (!data || data.length === 0) return 0;
      const completed = data.filter((r: any) => r.status === "completed").length;
      return Math.round((completed / data.length) * 100);
    },
    enabled: !!user?.id
  });

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{t("Teacher Workspace")}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {t(greeting)}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{firstName}</span>!
          </h1>
          <p className="text-slate-400 text-sm max-w-md font-medium">
            {t("Manage your classes and learner progress")} &mdash; {activeTermName}, {currentYear}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 px-4 py-3 backdrop-blur-md border border-white/10">
            <Calendar className="h-5 w-5 text-blue-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(), 'EEEE')}</span>
            <span className="text-sm font-black">{format(new Date(), 'MMM do')}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 px-4 py-3 backdrop-blur-md border border-white/10">
            <BookOpen className="h-5 w-5 text-indigo-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Syllabus</span>
            <span className="text-sm font-black">{syllabusPct}% Done</span>
          </div>
        </div>
      </div>
    </div>
  );
};
