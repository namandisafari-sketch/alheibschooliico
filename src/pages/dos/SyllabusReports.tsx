// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useCurriculumPlans } from "@/hooks/useAcademicPlanning";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, BookOpen, Users, AlertTriangle, CheckCircle2, TrendingUp, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function SyllabusReports() {
  const { user } = useAuth();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [selectedClass, setSelectedClass] = useState("");
  const [reportType, setReportType] = useState("weekly");

  const effectiveClass = selectedClass === "all_classes" ? "" : selectedClass;
  const { data: plans = [] } = useCurriculumPlans(effectiveClass);

  const { data: lessonPlans = [] } = useQuery({
    queryKey: ["all-lesson-plans", effectiveClass],
    queryFn: async () => {
      let q = supabase.from("lesson_plans").select("*, teacher:profiles(full_name), class:classes(name), subject:subjects(name)");
      if (effectiveClass) q = q.eq("class_id", effectiveClass);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: allTeachers = [] } = useQuery({
    queryKey: ["teachers-coverage"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, role").in("role", ["teacher", "head_teacher", "deputy_head_teacher", "dos"]);
      return data || [];
    },
  });

  const coverageByClass = classes.map(c => {
    const classPlans = plans.filter(p => p.class_id === c.id);
    const completed = classPlans.filter(p => p.coverage?.[0]?.status === "completed").length;
    return { class: c.name, total: classPlans.length, completed, percent: classPlans.length > 0 ? Math.round((completed / classPlans.length) * 100) : 0 };
  }).filter(c => c.total > 0);

  const coverageBySubject = subjects.map(s => {
    const subPlans = plans.filter(p => p.subject_id === s.id);
    const completed = subPlans.filter(p => p.coverage?.[0]?.status === "completed").length;
    return { subject: s.name, total: subPlans.length, completed, percent: subPlans.length > 0 ? Math.round((completed / subPlans.length) * 100) : 0 };
  }).filter(s => s.total > 0);

  const teacherCoverage = allTeachers.map(t => {
    const teacherPlans = lessonPlans.filter(p => p.teacher_id === t.id);
    const recentPlans = teacherPlans.filter(p => {
      const created = new Date(p.created_at);
      return created >= new Date(Date.now() - 7 * 86400000);
    });
    return {
      name: t.full_name,
      totalPlans: teacherPlans.length,
      recentPlans: recentPlans.length,
      behind: recentPlans.length === 0 && teacherPlans.length > 0,
    };
  });

  const totalClasses = coverageByClass.length;
  const classesOnTrack = coverageByClass.filter(c => c.percent >= 70).length;
  const classesBehind = coverageByClass.filter(c => c.percent < 50).length;

  const getColor = (pct: number) => pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const getStatus = (pct: number) => pct >= 70 ? "On Track" : pct >= 50 ? "Behind" : "Needs Attention";

  const generateHtmlReport = () => {
    const rows = coverageByClass.map(c =>
      `<tr><td>${c.class}</td><td>${c.completed}/${c.total}</td><td>${c.percent}%</td><td>${getStatus(c.percent)}</td></tr>`
    ).join("");
    return `
      <html><head><meta charset="utf-8"><title>Syllabus Coverage Report</title>
      <style>body{font-family:Arial;padding:40px}h1{color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f172a;color:#fff;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #e2e8f0}.footer{margin-top:30px;font-size:12px;color:#64748b}</style>
      </head><body>
      <h1>Syllabus Coverage Report</h1>
      <p>Generated: ${format(new Date(), "PPP")} | Type: ${reportType}</p>
      <table><thead><tr><th>Class</th><th>Coverage</th><th>%</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      <h2 style="margin-top:30px">Subject Breakdown</h2>
      <table><thead><tr><th>Subject</th><th>Coverage</th><th>%</th><th>Status</th></tr></thead><tbody>
      ${coverageBySubject.map(s => `<tr><td>${s.subject}</td><td>${s.completed}/${s.total}</td><td>${s.percent}%</td><td>${getStatus(s.percent)}</td></tr>`).join("")}
      </tbody></table>
      <h2 style="margin-top:30px">Teacher Activity</h2>
      <table><thead><tr><th>Teacher</th><th>Total Plans</th><th>Recent (7d)</th><th>Status</th></tr></thead><tbody>
      ${teacherCoverage.map(t => `<tr><td>${t.name}</td><td>${t.totalPlans}</td><td>${t.recentPlans}</td><td>${t.behind ? '⚠ Behind' : '✓ Active'}</td></tr>`).join("")}
      </tbody></table>
      <div class="footer">Alheib Mixed Day & Boarding School - Generated from live data</div>
      </body></html>
    `;
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(generateHtmlReport());
    w.document.close();
  };

  const handleExportCsv = () => {
    const headers = "Class,Coverage,Percentage,Status\n";
    const rows = coverageByClass.map(c => `${c.class},${c.completed}/${c.total},${c.percent}%,${getStatus(c.percent)}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `syllabus-coverage-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Syllabus Reports & Head Teacher Dashboard" subtitle="Monitor curriculum coverage across classes, subjects, and teachers">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><BarChart3 className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Classes</p><p className="text-xl font-bold">{totalClasses}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">On Track (≥70%)</p><p className="text-xl font-bold text-emerald-600">{classesOnTrack}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Behind (&lt;50%)</p><p className="text-xl font-bold text-red-600">{classesBehind}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Users className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Teachers</p><p className="text-xl font-bold">{teacherCoverage.length}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all_classes">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly Report</SelectItem>
            <SelectItem value="term">Term Report</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
          <FileText className="h-4 w-4" /> View Report
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}>
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Coverage by Class</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {coverageByClass.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet. Set up curriculum plans first.</p>
            ) : (
              coverageByClass.map(c => (
                <div key={c.class}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.class}</span>
                    <span className="text-muted-foreground">{c.completed}/{c.total} ({c.percent}%)</span>
                  </div>
                  <Progress value={c.percent} className={`h-2 ${getColor(c.percent)}`} />
                  <Badge className={`mt-1 text-[10px] ${c.percent >= 70 ? 'bg-emerald-100 text-emerald-700' : c.percent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {getStatus(c.percent)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5" /> Coverage by Subject</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {coverageBySubject.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
            ) : (
              coverageBySubject.map(s => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{s.completed}/{s.total} ({s.percent}%)</span>
                  </div>
                  <Progress value={s.percent} className={`h-2 ${getColor(s.percent)}`} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5" /> Teacher Activity Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teacherCoverage.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">No teacher data available.</p>
            ) : (
              teacherCoverage.map(t => (
                <div key={t.name} className={`p-4 rounded-xl border ${t.behind ? 'border-red-200 bg-red-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{t.name}</span>
                    {t.behind ? (
                      <Badge className="bg-red-100 text-red-700 text-[10px]">Incomplete Plans</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.totalPlans} total plans | {t.recentPlans} this week</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
