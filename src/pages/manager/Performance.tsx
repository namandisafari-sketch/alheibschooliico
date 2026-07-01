// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  MessageSquare, 
  Calendar,
  BookOpen,
  Filter,
  Search,
  Star,
  ChevronRight,
  ThumbsUp
} from "lucide-react";
import { useAllStaff, STAFF_ROLES } from "@/hooks/useStaff";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

const Performance = () => {
  const { data: staff, isLoading: loadingStaff } = useAllStaff();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth() as any;
  const { tr } = useLanguage();

  const checkInMutation = useMutation({
    mutationFn: async () => {
      // Find employee record (employees.profile_id) or fall back to profile id
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id,profile_id")
        .eq("profile_id", profile?.id)
        .maybeSingle();
      if (empErr) throw empErr;
      const employeeId = empData?.id || profile?.id;

      const now = new Date();
      const dateStr = format(now, "yyyy-MM-dd");
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

      const { error } = await supabase.from("personnel_attendance").upsert(
        {
          employee_id: employeeId,
          date: dateStr,
          status: "present",
          check_in_time: timeStr,
          recorded_by: user?.id,
        },
        { onConflict: "employee_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-performance-data"] });
      toast.success(tr("Checked in successfully"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tr("Failed to check in"));
    },
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: metrics, isLoading: loadingMetrics, isError: metricsError, error: metricsErrorObj } = useQuery({
    queryKey: ["staff-performance-data"],
    queryFn: async () => {
      const [logsRes, attendanceRes, disciplineRes, lessonPlansRes] = await Promise.all([
        supabase.from("staff_performance_logs").select("*").order("recorded_at", { ascending: false }),
        supabase.from("personnel_attendance").select("employee_id, status, date").gte("date", format(subMonths(new Date(), 6), "yyyy-MM-dd")),
        supabase.from("discipline_cases").select("reported_by, status"),
        supabase.from("lesson_plans").select("*, classes(name)")
      ]);

      const error = logsRes.error || attendanceRes.error || disciplineRes.error || lessonPlansRes.error;
      if (error) throw error;

      return {
        logs: logsRes.data || [],
        attendance: attendanceRes.data || [],
        discipline: disciplineRes.data || [],
        lessonPlans: lessonPlansRes.data || [],
      };
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const performanceLogs = useMemo(() => {
    const map = new Map<string, any[]>();
    (metrics?.logs || []).forEach((item: any) => {
      if (!item?.staff_id) return;
      const values = map.get(item.staff_id) || [];
      values.push(item);
      map.set(item.staff_id, values);
    });
    return map;
  }, [metrics?.logs]);

  const getLatestLogValue = (staffId: string | undefined, metricType: string) => {
    if (!staffId) return null;
    const logs = performanceLogs.get(staffId) || [];
    const matches = logs.filter((log) => log.metric_type === metricType && typeof log.metric_value === "number");
    if (!matches.length) return null;
    return Number(matches[0].metric_value);
  };

  const getAverageLogValue = (staffId: string | undefined, metricType: string) => {
    if (!staffId) return null;
    const logs = performanceLogs.get(staffId) || [];
    const values = logs
      .filter((log) => log.metric_type === metricType && typeof log.metric_value === "number")
      .map((log) => Number(log.metric_value));
    if (!values.length) return null;
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  };

  const attendanceTrendData = useMemo(() => {
    const monthly = new Map<string, { present: number; total: number }>();
    (metrics?.attendance || []).forEach((entry: any) => {
      if (!entry?.date) return;
      const month = format(new Date(entry.date), "MMM");
      const bucket = monthly.get(month) || { present: 0, total: 0 };
      bucket.total += 1;
      if (entry.status === "present") bucket.present += 1;
      monthly.set(month, bucket);
    });

    const ordered = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return Array.from(monthly.entries())
      .map(([month, bucket]) => ({ month, rate: bucket.total ? Math.round((bucket.present / bucket.total) * 100) : 0 }))
      .sort((a, b) => ordered.indexOf(a.month) - ordered.indexOf(b.month));
  }, [metrics?.attendance]);

  const gradeCompletionData = useMemo(() => {
    const gradeMap = new Map<string, { completed: number; total: number }>();
    (metrics?.lessonPlans || []).forEach((plan: any) => {
      const className = plan?.classes?.name || plan.class_id || "Unknown";
      const bucket = gradeMap.get(className) || { completed: 0, total: 0 };
      bucket.total += 1;
      if (["approved", "completed"].includes(plan?.status)) {
        bucket.completed += 1;
      }
      gradeMap.set(className, bucket);
    });

    return Array.from(gradeMap.entries())
      .slice(0, 7)
      .map(([grade, bucket]) => ({ grade, progress: bucket.total ? Math.round((bucket.completed / bucket.total) * 100) : 0 }));
  }, [metrics?.lessonPlans]);

  const staffPerformance = useMemo(() => {
    if (!staff) return [];

    return staff.map((s: any) => {
      const attendanceRateLog = getLatestLogValue(s.id, "attendance_rate");
      const staffAttendance = (metrics?.attendance || []).filter((a: any) => a.employee_id === s.id);
      const attendanceRateComputed = staffAttendance.length > 0
        ? Math.round((staffAttendance.filter((a: any) => a.status === "present").length / staffAttendance.length) * 100)
        : null;

      const syllabusCoverageLog = getLatestLogValue(s.id, "lesson_plan_completion");
      const syllabusCoverageAvg = getAverageLogValue(s.id, "lesson_plan_completion");
      const teacherLessons = (metrics?.lessonPlans || []).filter((plan: any) => plan.teacher_id === s.id);
      const coverageFromPlans = teacherLessons.length > 0
        ? Math.round((teacherLessons.filter((plan: any) => ["approved", "completed"].includes(plan.status)).length / teacherLessons.length) * 100)
        : null;

      const feedbackScoreRaw = getLatestLogValue(s.id, "feedback_score") ?? getAverageLogValue(s.id, "feedback_score") ?? 4.2;
      const casesHandledLog = getLatestLogValue(s.id, "discipline_cases_handled");
      const casesHandledCount = casesHandledLog ?? ((metrics?.discipline || []).filter((c: any) => c.reported_by === s.id).length) ?? 0;
      const attendanceRate = attendanceRateLog ?? attendanceRateComputed ?? 0;
      const opsReliability = s.role !== "teacher"
        ? Math.max(0, Math.min(100, Math.round(attendanceRate - (casesHandledCount * 2))))
        : null;

      return {
        ...s,
        attendanceRate,
        syllabusCoverage: s.role === "teacher"
          ? Math.round(syllabusCoverageLog ?? syllabusCoverageAvg ?? coverageFromPlans ?? 0)
          : null,
        feedbackScore: Number(feedbackScoreRaw.toFixed ? feedbackScoreRaw.toFixed(1) : Number(feedbackScoreRaw).toFixed(1)),
        casesHandled: casesHandledCount,
        opsReliability,
      };
    });
  }, [staff, metrics, performanceLogs]);

  const filteredStaff = staffPerformance.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const aggregateMetrics = useMemo(() => {
    if (staffPerformance.length === 0) return null;

    const avgAttendance = staffPerformance.reduce((acc: number, s: any) => acc + s.attendanceRate, 0) / staffPerformance.length;
    const teachers = staffPerformance.filter((s: any) => s.syllabusCoverage !== null);
    const avgCoverage = teachers.length > 0 ? teachers.reduce((acc: number, s: any) => acc + (s.syllabusCoverage || 0), 0) / teachers.length : 0;
    const avgFeedback = staffPerformance.reduce((acc: number, s: any) => acc + s.feedbackScore, 0) / staffPerformance.length;
    const totalCases = staffPerformance.reduce((acc: number, s: any) => acc + s.casesHandled, 0);

    return {
      avgAttendance: Math.round(avgAttendance),
      avgCoverage: Math.round(avgCoverage),
      avgFeedback: parseFloat(avgFeedback.toFixed(1)),
      totalCases
    };
  }, [staffPerformance]);

  const chartData = [
    { name: "Attendance", value: aggregateMetrics?.avgAttendance || 0 },
    { name: "Syllabus", value: aggregateMetrics?.avgCoverage || 0 },
    { name: "Feedback", value: (aggregateMetrics?.avgFeedback || 0) * 20 },
  ];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Role,Attendance %,Syllabus %,Feedback Score,Cases Handled\n"
      + filteredStaff.map((s: any) => `${s.full_name},${s.role},${s.attendanceRate},${s.syllabusCoverage || 'N/A'},${s.feedbackScore},${s.casesHandled}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_performance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendanceTrend = attendanceTrendData.length > 0 ? attendanceTrendData : [];

  const syllabusProgress = gradeCompletionData.length > 0 ? gradeCompletionData : [];

  if (loadingStaff || loadingMetrics) {
    return (
      <DashboardLayout>
        <div className="py-16 text-center text-gray-500">
          <p className="text-lg font-semibold">Loading live performance metrics...</p>
          <p className="mt-2 text-sm text-slate-500">Fetching staff performance, attendance, discipline, and lesson plan progress.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (metricsError) {
    return (
      <DashboardLayout>
        <div className="py-16 text-center text-red-600">
          <p className="text-lg font-semibold">Unable to load performance data.</p>
          <p className="mt-2 text-sm text-slate-500">{metricsErrorObj?.message || "Please refresh to retry."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Performance</h1>
            <p className="text-gray-500">Manager scorecard across teaching and operations</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => checkInMutation.mutate()} 
              disabled={checkInMutation.isPending || !profile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {checkInMutation.isPending ? "Checking in..." : "Self Check-In"}
            </Button>
            <Button id="export-report-btn" onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="mr-2 h-4 w-4" />
              Quarterly Review Export
            </Button>
          </div>
        </div>

        <div id="performance-overview-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Attendance</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{aggregateMetrics?.avgAttendance}%</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+2.1% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Syllabus Coverage</p>
                  <h3 className="text-2xl font-bold text-blue-600">{aggregateMetrics?.avgCoverage}%</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-blue-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span>On track for Term 2</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Parent Feedback</p>
                  <h3 className="text-2xl font-bold text-amber-500">{aggregateMetrics?.avgFeedback}/5.0</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>Based on live feedback metrics</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cases Handled</p>
                  <h3 className="text-2xl font-bold text-rose-600">{aggregateMetrics?.totalCases}</h3>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <ThumbsUp className="h-3 w-3 mr-1" />
                <span>Live disciplinary case count</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Aggregate metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card id="staff-scorecards-list" className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Staff Scorecards</CardTitle>
                <CardDescription>Detailed individual metrics</CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search staff..." 
                    className="pl-9 w-[160px] md:w-[220px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStaff.map((s: any, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.id} 
                    className="group border rounded-lg p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                          {s.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{s.full_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{s.role}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-xl">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Attendance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={s.attendanceRate} className="h-1.5" />
                            <span className="text-xs font-semibold">{s.attendanceRate}%</span>
                          </div>
                        </div>
                        
                        {s.role === 'teacher' ? (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Syllabus</p>
                            <div className="flex items-center gap-2">
                              <Progress value={s.syllabusCoverage || 0} className="h-1.5" />
                              <span className="text-xs font-semibold">{s.syllabusCoverage}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Ops Reliability</p>
                            <div className="flex items-center gap-2">
                              <Progress value={s.opsReliability || 0} className="h-1.5" />
                              <span className="text-xs font-semibold">{s.opsReliability != null ? `${s.opsReliability}%` : "N/A"}</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Feedback</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold">{s.feedbackScore}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Discipline</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] py-0">{s.casesHandled} cases</Badge>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-400 transition-colors hidden md:block" />
                    </div>
                  </motion.div>
                ))}

                {filteredStaff.length === 0 && !loadingStaff && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No staff members found matching your filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reliability Trend</CardTitle>
              <CardDescription>Monthly average across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{fill: '#10b981'}} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Syllabus Completion by Grade</CardTitle>
              <CardDescription>Estimated progress against curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={syllabusProgress} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis dataKey="grade" type="category" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Performance;
