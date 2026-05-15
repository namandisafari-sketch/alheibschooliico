
import { TeacherHero } from "./teacher/TeacherHero";
import { TeacherStats } from "./teacher/TeacherStats";
import { IslamicProgress } from "./teacher/IslamicProgress";
import { AcademicPulse } from "./teacher/AcademicPulse";
import { TeacherQuickActions } from "./teacher/TeacherQuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TeacherDashboard = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <TeacherHero />
      
      <TeacherStats />

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
            
            <div className="grid gap-4">
              {[
                { time: '08:30 AM', subject: 'Mathematics', class: 'P.4 Blue', type: 'Academic' },
                { time: '10:00 AM', subject: 'Quran Recitation', class: 'P.4 Red', type: 'Madrasa' },
                { time: '11:30 AM', subject: 'Science', class: 'P.5 Green', type: 'Academic' },
              ].map((session, i) => (
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
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Quick Actions & Notices */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t("Resources & Tools")}</h3>
            <TeacherQuickActions />
          </section>

          <Card className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <CardHeader className="pb-2 bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-600">
                <Bell className="h-4 w-4" />
                {t("Staff Notices")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative pl-6 border-l-4 border-blue-500 py-1">
                <p className="text-sm font-black text-slate-900 mb-1">{t("Assembly Meeting")}</p>
                <p className="text-xs font-medium text-slate-500 mb-2">Morning briefing at 7:45 AM in the main hall.</p>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">10 mins ago</span>
              </div>
              <div className="relative pl-6 border-l-4 border-amber-500 py-1">
                <p className="text-sm font-black text-slate-900 mb-1">{t("Exam Schedules")}</p>
                <p className="text-xs font-medium text-slate-500 mb-2">Final Term 3 marks entry deadline is Friday.</p>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Yesterday</span>
              </div>
              <Button variant="outline" className="w-full rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">
                {t("View All Notices")}
              </Button>
            </CardContent>
          </Card>

          {/* Syllabus Progress Widget */}
          <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                   <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest">{t("Term Progress")}</h4>
                   <p className="text-[10px] font-bold text-white/60">{t("Syllabus Coverage")}</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-2xl font-black">
                   <span>78%</span>
                   <span className="text-white/40">100%</span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white w-[78%] rounded-full" />
                </div>
                <p className="text-[10px] font-bold text-white/70 italic text-center">
                   "Success is the sum of small efforts repeated day in and day out."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple TrendingUp replacement if not imported
const TrendingUp = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);
