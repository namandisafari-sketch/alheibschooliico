import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Scale, FileText, ClipboardCheck, AlertTriangle, CheckCircle,
  Loader2, Clock, UserCheck, UserX, BookOpen, TrendingUp, Bell,
  MessageSquare, FileWarning, Luggage, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfMonth, subDays } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";

export const HeadOfInternalDashboard = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const last7 = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data: totalStaff = 0 } = useQuery({
    queryKey: ["hoi-staff-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "parent");
      return count || 0;
    },
  });

  const { data: staffPresent = 0 } = useQuery({
    queryKey: ["hoi-staff-attendance-today"],
    queryFn: async () => {
      const { count } = await supabase.from("staff_attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "present");
      return count || 0;
    },
  });

  const { data: staffAbsent = 0 } = useQuery({
    queryKey: ["hoi-staff-absent-today"],
    queryFn: async () => {
      const { count } = await supabase.from("staff_attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "absent");
      return count || 0;
    },
  });

  const { data: disciplineCases = 0 } = useQuery({
    queryKey: ["hoi-discipline-count"],
    queryFn: async () => {
      const { count } = await supabase.from("discipline_logs").select("id", { count: "exact", head: true }).gte("date", monthStart);
      return count || 0;
    },
  });

  const { data: openDiscipline = 0 } = useQuery({
    queryKey: ["hoi-discipline-open"],
    queryFn: async () => {
      const { count } = await supabase.from("discipline_logs").select("id", { count: "exact", head: true }).eq("status", "open");
      return count || 0;
    },
  });

  const { data: pendingApprovals = 0 } = useQuery({
    queryKey: ["hoi-pending-approvals"],
    queryFn: async () => {
      const { count } = await supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const { data: pendingLetters = 0 } = useQuery({
    queryKey: ["hoi-pending-letters"],
    queryFn: async () => {
      const { count } = await supabase.from("staff_letters").select("id", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const { data: lessonApprovals = 0 } = useQuery({
    queryKey: ["hoi-lesson-approvals"],
    queryFn: async () => {
      const { count } = await supabase.from("lesson_plans").select("id", { count: "exact", head: true }).eq("status", "submitted");
      return count || 0;
    },
  });

  const { data: staffOnLeave = 0 } = useQuery({
    queryKey: ["hoi-staff-leave"],
    queryFn: async () => {
      const { count } = await supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "approved").lte("start_date", today).gte("end_date", today);
      return count || 0;
    },
  });

  const { data: attendanceTrend = [] } = useQuery({
    queryKey: ["hoi-attendance-trend"],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const { count } = await supabase.from("staff_attendance").select("id", { count: "exact", head: true }).eq("date", d).eq("status", "present");
        days.push({ day: format(subDays(new Date(), i), "EEE"), present: count || 0 });
      }
      return days;
    },
  });

  const { data: recentDiscipline = [] } = useQuery({
    queryKey: ["hoi-recent-discipline"],
    queryFn: async () => {
      const { data } = await supabase.from("discipline_logs").select("id, title, status, severity, created_at, created_by(full_name)").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: recentLetters = [] } = useQuery({
    queryKey: ["hoi-recent-letters"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_letters").select("id, title, status, recipient_name, created_at").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Primary Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        <Link to="/staff">
          <Card className="border-2 border-slate-100 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div><p className="text-lg font-bold">{totalStaff}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Staff</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/staff-attendance">
          <Card className="border-2 border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-lg font-bold">{staffPresent}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Present Today</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/staff-attendance">
          <Card className="border-2 border-slate-100 hover:border-rose-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50"><UserX className="h-5 w-5 text-rose-600" /></div>
                <div><p className="text-lg font-bold">{staffAbsent}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Absent Today</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/teacher/requests">
          <Card className="border-2 border-slate-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50"><Luggage className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-lg font-bold">{staffOnLeave}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">On Leave</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/discipline">
          <Card className="border-2 border-slate-100 hover:border-red-200 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50"><Scale className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-lg font-bold">{openDiscipline}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Open Cases</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Stats + Pending Items */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50"><FileWarning className="h-5 w-5 text-violet-600" /></div>
            <div><p className="text-lg font-bold">{disciplineCases}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cases This Month</p></div>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50"><Clock className="h-5 w-5 text-orange-600" /></div>
            <div><p className="text-lg font-bold">{pendingApprovals}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leave Pending</p></div>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-lg font-bold">{pendingLetters}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Letters Pending</p></div>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50"><BookOpen className="h-5 w-5 text-indigo-600" /></div>
            <div><p className="text-lg font-bold">{lessonApprovals}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lesson Plans</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Attendance Trend + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 border-slate-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Staff Attendance (7 Days)</CardTitle></CardHeader>
          <CardContent>
            {attendanceTrend.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="present" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No attendance data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: "/staff-attendance", icon: ClipboardCheck, label: "Mark Staff Attendance", color: "text-emerald-600 bg-emerald-50" },
              { to: "/discipline", icon: Scale, label: "Record Discipline Case", color: "text-red-600 bg-red-50" },
              { to: "/teacher/letters", icon: FileText, label: "Official Letters", color: "text-blue-600 bg-blue-50" },
              { to: "/teacher/requests", icon: Clock, label: "Approve Leave", color: "text-orange-600 bg-orange-50" },
              { to: "/office", icon: MessageSquare, label: "Office Management", color: "text-violet-600 bg-violet-50" },
              { to: "/students", icon: Users, label: "View Learners", color: "text-primary bg-primary/10" },
            ].map(a => (
              <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors text-sm group">
                <div className={`h-8 w-8 rounded-lg ${a.color} flex items-center justify-center`}><a.icon className="h-4 w-4" /></div>
                <span className="flex-1 font-medium">{a.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-red-500" /> Recent Discipline</CardTitle>
            <Link to="/discipline" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentDiscipline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No discipline cases recorded</p>
            ) : (
              <div className="space-y-2">
                {recentDiscipline.map((d: any) => (
                  <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      d.severity === "high" ? "bg-red-100 text-red-600" :
                      d.severity === "medium" ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-600"
                    }`}><Scale className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{d.created_by?.full_name || "Unknown"}</span>
                        <Badge variant="outline" className={`text-[8px] ${
                          d.status === "open" ? "border-red-200 text-red-600" :
                          d.status === "resolved" ? "border-emerald-200 text-emerald-600" : ""
                        }`}>{d.status}</Badge>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(d.created_at), "dd MMM")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Recent Letters</CardTitle>
            <Link to="/teacher/letters" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentLetters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No letters issued</p>
            ) : (
              <div className="space-y-2">
                {recentLetters.map((l: any) => (
                  <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><FileText className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{l.title || l.subject}</p>
                      <p className="text-[10px] text-muted-foreground">To: {l.recipient_name}</p>
                    </div>
                    <Badge variant="outline" className={`text-[8px] shrink-0 ${
                      l.status === "approved" ? "border-emerald-200 text-emerald-600" :
                      l.status === "pending" ? "border-amber-200 text-amber-600" :
                      "border-slate-200 text-slate-600"
                    }`}>{l.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
