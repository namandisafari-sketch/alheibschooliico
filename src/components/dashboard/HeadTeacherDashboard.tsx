// @ts-nocheck
import { useState } from "react";
import { useLearners } from "@/hooks/useLearners";
import { useTeachers } from "@/hooks/useTeachers";
import { useClasses } from "@/hooks/useClasses";
import { useStaff } from "@/hooks/useStaff";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import {
  Users, GraduationCap, BookOpen, ClipboardCheck,
  Shield, ArrowRight, Clock, UserCheck, FileText, Calendar,
  Building, Heart, Stethoscope, Wallet, Bed, Library,
  BarChart3, PenLine, Bell, Scale
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const useAttendanceStats = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ["headteacher-attendance-stats", dateFrom, dateTo],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

      let rangeQuery = supabase.from("attendance").select("status");
      if (dateFrom && dateTo) {
        rangeQuery = rangeQuery.gte("date", dateFrom).lte("date", dateTo);
      } else if (dateFrom) {
        rangeQuery = rangeQuery.gte("date", dateFrom);
      } else if (dateTo) {
        rangeQuery = rangeQuery.lte("date", dateTo);
      } else {
        rangeQuery = rangeQuery.eq("date", today);
      }

      const [rangeRes, weekRes] = await Promise.all([
        rangeQuery,
        supabase.from("attendance").select("status").gte("date", weekAgo).lt("date", today),
      ]);

      const calc = (rows) => {
        if (!rows?.length) return null;
        const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
        return Math.round((present / rows.length) * 100);
      };

      return {
        todayRate: calc(rangeRes.data),
        lastWeekRate: calc(weekRes.data),
      };
    },
    refetchInterval: 60000,
  });
};

const usePendingApprovals = () => {
  return useQuery({
    queryKey: ["headteacher-pending-approvals"],
    queryFn: async () => {
      const [leave, advances, letters, lessonPlans, warnings, empAdvances] = await Promise.all([
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("advance_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("staff_letters").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("lesson_plans").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("discipline_cases").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("employee_advances").select("id", { count: "exact", head: true }).eq("stage", "accountant_verified"),
      ]);

      const advanceTotal = (advances.count ?? 0) + (empAdvances.count ?? 0);

      return {
        leave: leave.count ?? 0,
        advances: advanceTotal,
        letters: letters.count ?? 0,
        lessonPlans: lessonPlans.count ?? 0,
        discipline: warnings.count ?? 0,
        total: (leave.count ?? 0) + advanceTotal + (letters.count ?? 0) + (lessonPlans.count ?? 0) + (warnings.count ?? 0),
      };
    },
    refetchInterval: 30000,
  });
};

const protocolSections = [
  {
    title: "Academic Oversight",
    icon: BookOpen,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    links: [
      { label: "Manage Students", path: "/students", icon: Users },
      { label: "Staff & Teachers", path: "/teachers", icon: GraduationCap },
      { label: "Academic Classes", path: "/classes", icon: BookOpen },
      { label: "Enter Marks", path: "/marks", icon: PenLine },
      { label: "Academic Reports", path: "/reports", icon: FileText },
      { label: "Timetables", path: "/dos/timetable", icon: Calendar },
      { label: "Scheme of Work", path: "/dos/scheme-of-work", icon: BookOpen },
      { label: "Curriculum Coverage", path: "/dos/syllabus", icon: BarChart3 },
    ],
  },
  {
    title: "Student Welfare & Conduct",
    icon: Heart,
    color: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
    links: [
      { label: "Discipline & Conduct", path: "/discipline", icon: Scale },
      { label: "Attendance Records", path: "/attendance", icon: ClipboardCheck },
      { label: "Health & Medical", path: "/nurse", icon: Stethoscope },
      { label: "Hostel & Boarding", path: "/hostel", icon: Bed },
      { label: "Library", path: "/library", icon: Library },
    ],
  },
  {
    title: "Staff Administration",
    icon: Users,
    color: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    links: [
      { label: "HR Management", path: "/staff", icon: Users },
      { label: "Staff Attendance", path: "/staff-attendance", icon: ClipboardCheck },
      { label: "Staff Letters", path: "/teacher/letters", icon: FileText },
      { label: "Leave Requests", path: "/teacher/requests", icon: Calendar },
      { label: "Staff Assignments", path: "/staff-assignments", icon: UserCheck },
    ],
  },
  {
    title: "Finance & Administration",
    icon: Wallet,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    links: [
      { label: "Fees Management", path: "/fees", icon: Wallet },
      { label: "Budget Planning", path: "/budget", icon: BarChart3 },
      { label: "Payroll & Salaries", path: "/salary", icon: UserCheck },
      { label: "Office Documents", path: "/office/documents", icon: FileText },
      { label: "Comms & Circulars", path: "/office/comms", icon: Bell },
    ],
  },
  {
    title: "Approvals & Compliance",
    icon: Shield,
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    links: [
      { label: "Ministry & Compliance", path: "/ministry", icon: Shield },
      { label: "Governance Board", path: "/governance", icon: Building },
      { label: "Staff Performance", path: "/manager/performance", icon: BarChart3 },
    ],
  },
];

export const HeadTeacherDashboard = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: learners } = useLearners();
  const { data: teachers } = useTeachers();
  const { data: classes } = useClasses();
  const { data: staff } = useStaff("all");
  const { data: attStats } = useAttendanceStats(dateFrom || undefined, dateTo || undefined);
  const { data: pending } = usePendingApprovals();

  const totalLearners = learners?.length ?? 0;
  const totalTeachers = teachers?.length ?? 0;
  const totalClasses = classes?.length ?? 0;
  const totalStaff = (staff?.length ?? 0);
  const attendanceRate = attStats?.todayRate;
  const attDelta =
    attStats?.todayRate != null && attStats?.lastWeekRate != null
      ? attStats.todayRate - attStats.lastWeekRate
      : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Head Teacher · Command Center</p>
              <h2 className="text-2xl font-black text-blue-950 tracking-tight">Academic & administrative oversight</h2>
              <p className="text-sm text-blue-800/80 mt-0.5">
                Protocol-based access to all school functions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs rounded-md border border-blue-300 bg-white/80 px-2" />
              <span className="text-xs text-blue-700">–</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs rounded-md border border-blue-300 bg-white/80 px-2" />
            </div>
            {pending && pending.total > 0 && (
              <Button asChild variant="outline" className="border-blue-300">
                <Link to="/director/approvals">
                  Pending Approvals <Badge className="ml-2 bg-rose-500">{pending.total}</Badge>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Students</p>
              <p className="text-xl font-black">{totalLearners}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Staff</p>
              <p className="text-xl font-black">{totalTeachers + totalStaff}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Classes</p>
              <p className="text-xl font-black">{totalClasses}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              attendanceRate != null && attendanceRate >= 80
                ? "bg-emerald-100 text-emerald-600"
                : attendanceRate != null
                ? "bg-amber-100 text-amber-600"
                : "bg-slate-100 text-slate-400"
            }`}>
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attendance</p>
              <p className="text-xl font-black">{attendanceRate != null ? `${attendanceRate}%` : "—"}</p>
              {attDelta != null && (
                <p className={`text-[10px] font-medium ${attDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {attDelta >= 0 ? "+" : ""}{attDelta}% vs last week
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {pending && pending.total > 0 && (
        <Card className="bg-amber-50/50 border-amber-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-bold text-amber-800">Pending Approvals</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {pending.leave > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-100/50">{pending.leave} Leave</Badge>}
                {pending.advances > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-100/50">{pending.advances} Advances</Badge>}
                {pending.letters > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-100/50">{pending.letters} Letters</Badge>}
                {pending.lessonPlans > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-100/50">{pending.lessonPlans} Lesson Plans</Badge>}
                {pending.discipline > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-100/50">{pending.discipline} Discipline</Badge>}
              </div>
              <Button asChild size="sm" variant="outline" className="border-amber-300 ml-auto">
                <Link to="/director/approvals">Review All <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {protocolSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.title} className={cn("border", section.color)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <SectionIcon className={cn("h-4 w-4", section.iconColor)} />
                  {section.title}
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {section.links.length} modules available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const LinkIcon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors group"
                      >
                        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                          {link.label}
                        </span>
                        <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground/30 group-hover:text-foreground/50" />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
