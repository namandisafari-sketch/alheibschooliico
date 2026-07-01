
import { TeacherHero } from "./teacher/TeacherHero";
import { TeacherStats } from "./teacher/TeacherStats";
import { IslamicProgress } from "./teacher/IslamicProgress";
import { AcademicPulse } from "./teacher/AcademicPulse";
import { TeacherQuickActions } from "./teacher/TeacherQuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity as ActivityIcon, Calendar, ChevronRight, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, addMinutes, startOfWeek, addDays } from "date-fns";


export const TeacherDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const channel = supabase.channel('teacher-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_timetables', filter: `day_of_week=eq.${new Date().toLocaleDateString('en-US', { weekday: 'long' })}` }, () => {
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  // Fetch today's schedule from class_timetables
  const { data: scheduleData, isLoading: loadingSchedule } = useQuery({
    queryKey: ["teacher-schedule-today", user?.id],
    queryFn: async () => {
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const { data, error } = await supabase
        .from("class_timetables")
        .select(`start_time,end_time,day_of_week,subject_id(name),class_id(name),teacher_id`)
        .eq("day_of_week", dayOfWeek)
        .eq("teacher_id", user?.id)
        .order("start_time", { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      return data?.map((session: any) => {
        const startDate = new Date(`1970-01-01T${session.start_time}`);
        const endDate = new Date(`1970-01-01T${session.end_time}`);

        return {
          time: format(startDate, 'hh:mm a'),
          startTime: startDate,
          endTime: endDate,
          subject: session.subject_id?.name || 'Unknown Subject',
          class: session.class_id?.name || 'Unknown Class',
          type: 'Academic'
        };
      }) || [];
    },
    refetchInterval: 30000,
    enabled: !!user?.id
  });

  // Fetch syllabus coverage percentage
  const { data: syllabusPct = 0 } = useQuery({
    queryKey: ["teacher-syllabus-summary", user?.id],
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

  // Fetch staff notices/announcements
  const { data: noticesData, isLoading: loadingNotices } = useQuery({
    queryKey: ["staff-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("target_role", "teacher")
        .order("created_at", { ascending: false })
        .limit(2);
      
      if (error) throw error;
      
      return data?.map((notice: any) => {
        const now = new Date();
        const created = new Date(notice.created_at);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let timeDiff = 'just now';
        if (diffMins > 0 && diffMins < 60) timeDiff = `${diffMins} mins ago`;
        else if (diffHours > 0 && diffHours < 24) timeDiff = `${diffHours}h ago`;
        else if (diffDays === 1) timeDiff = 'Yesterday';
        else if (diffDays > 1) timeDiff = `${diffDays}d ago`;
        
        return {
          id: notice.id,
          title: notice.title || 'Notice',
          description: notice.message || '',
          color: notice.priority === 'high' ? 'amber' : 'blue',
          timestamp: timeDiff,
          timeDiff
        };
      }) || [];
    },
    refetchInterval: 10000,
  });

  const schedule = scheduleData || [];
  const notices = noticesData || [];

  const activeSession = useMemo(() => {
    return schedule.find((session: any) => {
      if (!session.startTime || !session.endTime) return false;
      const nowMs = currentTime.getTime();
      const startMs = new Date(session.startTime).getTime();
      const endMs = new Date(session.endTime).getTime();
      return nowMs >= startMs && nowMs < endMs;
    });
  }, [schedule, currentTime]);

  const upcomingSession = useMemo(() => {
    return schedule.find((session: any) => {
      if (!session.startTime) return false;
      const startMs = new Date(session.startTime).getTime();
      const diffMinutes = (startMs - currentTime.getTime()) / 60000;
      return diffMinutes > 0 && diffMinutes <= 15;
    });
  }, [schedule, currentTime]);

  // Browser notification alarm for class about to start
  const [notifiedSession, setNotifiedSession] = useState<string | null>(null);
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();
    if (Notification.permission !== "granted") return;

    const session = activeSession || upcomingSession;
    if (!session) { setNotifiedSession(null); return; }

    const key = `${session.subject}-${session.time}`;
    if (notifiedSession === key) return;

    setNotifiedSession(key);
    const tag = activeSession ? "class-started" : "class-upcoming";
    new Notification(
      activeSession ? "Class in Progress!" : "Upcoming Class!",
      {
        body: activeSession
          ? `${session.subject} for ${session.class} is ongoing until ${format(new Date(session.endTime), 'hh:mm a')}`
          : `${session.subject} for ${session.class} at ${session.time}`,
        icon: "/favicon.ico",
        tag,
        silent: false,
      }
    );
  }, [activeSession, upcomingSession, notifiedSession]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <TeacherHero />
      
      <TeacherStats />

      {(activeSession || upcomingSession) && (
        <div className="rounded-[2rem] border p-5 shadow-sm bg-white border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">{t(activeSession ? "Live Teaching Alert" : "Upcoming Lesson")}</p>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                {activeSession ? t("Time to Teach") : t("Get Ready to Teach")}
              </h3>
            </div>
            <div className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.25em] ${activeSession ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {activeSession ? t("Now") : t("Soon")}
            </div>
          </div>
          <div className="mt-4 text-slate-700 space-y-2">
            <p className="text-sm">
              {activeSession
                ? t(`Your ${activeSession.subject} lesson for ${activeSession.class} is in progress and ends at ${format(new Date(activeSession.endTime), 'hh:mm a')}.`)
                : `${t("Next up")}: ${t(upcomingSession.subject)} • ${upcomingSession.class} • ${upcomingSession.time}`}
            </p>
            {activeSession && (
              <p className="text-xs text-slate-500">{t("Please prepare your materials and join the classroom on time.")}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Progress & Pulse */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <IslamicProgress />
             <AcademicPulse />
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">{t("Today's Schedule")}</h3>
               <Button variant="link" className="text-blue-600 font-bold text-xs uppercase tracking-widest p-0 h-auto">
                  {t("View Full Calendar")} <ChevronRight className="h-4 w-4 ml-1" />
               </Button>
            </div>
            
            <div className="grid gap-4 relative">
              {loadingSchedule && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 rounded-2xl z-10">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              )}
              {!loadingSchedule && schedule.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
                  {t("No scheduled lessons found for today.")}
                </div>
              ) : (
                schedule.map((session: any, i: number) => (
                  <div key={i} className="group flex items-center p-5 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-blue-100 hover:shadow-md transition-all duration-300">
                    <div className="w-24 text-sm font-black text-blue-600">{session.time}</div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900">{t(session.subject)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(session.class)}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      session.type === 'Madrasa' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {t(session.type)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Side: Quick Actions & Notices */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t("Resources & Tools")}</h3>
            <TeacherQuickActions />
          </section>

          <Card className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm relative">
            <CardHeader className="pb-2 bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-600">
                <Bell className="h-4 w-4" />
                {t("Staff Notices")}
              </CardTitle>
            </CardHeader>
            {loadingNotices && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/30 rounded-[2.5rem] z-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              {!loadingNotices && notices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  {t("No notices have been published yet.")}
                </div>
              ) : (
                notices.map((notice: any) => (
                  <div key={notice.id} className={`relative pl-6 border-l-4 border-${notice.color}-500 py-1`}>
                    <p className="text-sm font-black text-slate-900 mb-1">{t(notice.title)}</p>
                    <p className="text-xs font-medium text-slate-500 mb-2">{t(notice.description)}</p>
                    <span className={`text-[10px] font-bold text-${notice.color}-500 uppercase tracking-tighter`}>{notice.timeDiff}</span>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">
                {t("View All Notices")}
              </Button>
            </CardContent>
          </Card>

          {/* Syllabus Progress Widget */}
          <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                   <ActivityIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest">{t("Term Progress")}</h4>
                   <p className="text-[10px] font-bold text-white/60">{t("Syllabus Coverage")}</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-2xl font-black">
                   <span>{syllabusPct}%</span>
                   <span className="text-white/40">100%</span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${syllabusPct}%` }} />
                </div>
                <p className="text-[10px] font-bold text-white/70 italic text-center">
                   {syllabusPct === 100 ? t("All topics covered!") : t(`${syllabusPct}% of syllabus completed`)}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

