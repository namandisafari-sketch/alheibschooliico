// Main component
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  FileCheck, 
  AlertTriangle, 
  Users, 
  Calendar, 
  BookOpen, 
  BookMarked,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  Shield,
  LayoutDashboard,
  Clock,
  UserCheck,
  TrendingDown
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Dos Dashboard
const DosHome = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "director" || role === "center_director" || role === "dos" || role === "head_teacher";

  // Real-time stats for the dashboard
  const { data: stats = {
    pendingPlans: 0,
    activeWarnings: 0,
    activeTeachers: 0,
    totalClasses: 0,
    lowPerformanceCount: 0,
    upcomingExams: 0
  }} = useQuery({
    queryKey: ["dos-dashboard-stats"],
    queryFn: async () => {
      const [plans, warnings, staff, classes, performance, exams] = await Promise.all([
        supabase.from("lesson_plans").select("*", { count: "exact" }).eq("status", "pending"),
        supabase.from("academic_warnings").select("*", { count: "exact" }).eq("status", "active"),
        supabase.from("profiles").select("*", { count: "exact" }).eq("role", "teacher"),
        supabase.from("classes").select("*", { count: "exact" }),
        supabase.from("term_results").select("*", { count: "exact" }).lt("score", 50),
        supabase.from("exam_series").select("*", { count: "exact" }).eq("status", "scheduled")
      ]);
      return {
        pendingPlans: plans.count || 0,
        activeWarnings: warnings.count || 0,
        activeTeachers: staff.count || 0,
        totalClasses: classes.count || 0,
        lowPerformanceCount: performance.count || 0,
        upcomingExams: exams.count || 0
      };
    }
  });

  return (
    <DashboardLayout title="DOS Command Center" subtitle="Directing Academic Affairs, Curriculum & Standards">
      <div className="space-y-8">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Syllabus Plans</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.pendingPlans}</p>
                  <Badge variant="outline" className="text-[9px] bg-blue-100 text-blue-700 border-blue-200">Pending</Badge>
                </div>
                <p className="text-[10px] text-blue-500 font-medium">Review Required</p>
              </div>
              <BookMarked className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50/50 border-orange-100 shadow-sm">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Academic Risk</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.activeWarnings}</p>
                  <Badge variant="outline" className="text-[9px] bg-red-100 text-red-700 border-red-200">Critical</Badge>
                </div>
                <p className="text-[10px] text-orange-500 font-medium">Underperforming Learners</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Upcoming Exams</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.upcomingExams}</p>
                  <Badge variant="outline" className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200">Series</Badge>
                </div>
                <p className="text-[10px] text-emerald-500 font-medium">Scheduled Papers</p>
              </div>
              <FileCheck className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>

          <Card className="bg-purple-50/50 border-purple-100 shadow-sm">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Teaching Force</p>
                <p className="text-2xl font-bold">{stats.activeTeachers}</p>
                <p className="text-[10px] text-purple-500 font-medium">Subject Specialized</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Academic Controls */}
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Academic Operations Console
                  </CardTitle>
                  <CardDescription>Curriculum oversight, assessment management & teacher quality</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="hidden sm:flex font-bold text-xs uppercase tracking-tighter">
                  Generate Academic Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y border-b">
                {[
                  { label: "Syllabus Coverage Tracking", icon: BookMarked, path: "/dos/syllabus", color: "text-emerald-500", desc: "Detailed completion analysis by teacher" },
                  { label: "Lesson Observation Log", icon: FileCheck, path: "/dos/lesson-tracking", color: "text-blue-500", desc: "Evaluate classroom teaching quality" },
                  { label: "Exam Scheduling & Series", icon: ClipboardList, path: "/dos/exams", color: "text-orange-500", desc: "Dates, papers, and invigilation" },
                  { label: "Teacher Load Assignments", icon: Users, path: "/dos/assignments", color: "text-purple-500", desc: "Manage class and subject distributions" },
                  { label: "Academic Timetable (Live)", icon: Calendar, path: "/dos/timetable", color: "text-indigo-500", desc: "Master school schedule adjustment" },
                  { label: "P7 PLE & Candidates", icon: GraduationCap, path: "/dos/p7-management", color: "text-red-500", desc: "UNEB registration & performance tracking" },
                  { label: "Results & Analysis", icon: TrendingUp, path: "/dos/analysis", color: "text-cyan-500", desc: "Deep dive into termly performance" },
                  { label: "Departmental Coordination", icon: Users, path: "/dos/departments", color: "text-pink-500", desc: "Manage subject departments" },
                ].map((action) => (
                  <Link to={action.path} key={action.label} className="p-6 hover:bg-muted/50 transition-all group relative overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className={`mb-3 p-2 w-fit rounded-lg bg-white shadow-sm border ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm tracking-tight mb-1 group-hover:text-primary transition-colors underline-offset-4 decoration-primary/30 group-hover:underline">
                        {action.label}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{action.desc}</p>
                    </div>
                    <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats & Alerts */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-2 bg-slate-50/50 border-b">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Live Academic Pulse</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Syllabus Completion</span>
                    <span className="text-emerald-600">68%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '68%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Target for this week: 75%</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Lesson Planning Compliance</span>
                    <span className="text-blue-600">92%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '92%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">3 Teachers yet to submit</p>
                </div>
                <div className="pt-2 border-t mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Class Performance</span>
                  </div>
                  <div className="space-y-2">
                    {['P7 North', 'P6 Blue', 'P5 Red'].map((cls, i) => (
                      <div key={cls} className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-600">{cls}</span>
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                          <span className="font-bold">{85 - i * 5}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="h-24 w-24" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  Academic Interventions
                </CardTitle>
                <CardDescription className="text-slate-400 text-[11px]">Critical items requiring DOS signature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs ring-1 ring-orange-500/30">
                      3
                    </div>
                    <div>
                      <p className="text-[11px] font-bold">Unvalidated Exam Results</p>
                      <p className="text-[9px] text-slate-400 tracking-tight">P6 Mid-Term Series II</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs ring-1 ring-blue-500/30">
                      12
                    </div>
                    <div>
                      <p className="text-[11px] font-bold">Missing Lesson Observations</p>
                      <p className="text-[9px] text-slate-400 tracking-tight">Week 8 Academic Review</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full h-9 text-xs font-black uppercase tracking-widest bg-white text-slate-900 hover:bg-slate-200 mt-4 shadow-lg hover:translate-y-[-1px] transition-all">
                  Launch Academic Audit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DosHome;
