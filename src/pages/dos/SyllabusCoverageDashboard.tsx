// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurriculumPlans } from "@/hooks/useAcademicPlanning";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useSchemeOfWork, useLessonRegister } from "@/hooks/useSyllabusTracking";
import { useTeachers } from "@/hooks/useTeachers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, TrendingUp, BookMarked, AlertTriangle, User,
  FileText, Calendar, Clock, Ban, ChevronDown, ChevronRight,
  BarChart3, GraduationCap, Users, ListChecks, Bell
} from "lucide-react";

export default function SyllabusCoverageDashboard() {
  const { user } = useAuth();
  const { data: academicSettings } = useAcademicSettings();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const effectiveSubject = selectedSubject === "all" ? "" : selectedSubject;
  const effectiveTeacher = selectedTeacher === "all" ? "" : selectedTeacher;
  const currentTerm = academicSettings?.current_term_id ?? "term_1";
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();

  const { data: curriculumPlans = [], isLoading: plansLoading } = useCurriculumPlans(
    selectedClass, effectiveSubject, currentTerm, currentYear
  );

  const { data: schemes = [], isLoading: schemesLoading } = useSchemeOfWork({
    classId: selectedClass,
    subjectId: effectiveSubject || undefined,
    teacherId: effectiveTeacher || undefined,
    term: currentTerm,
    academicYear: currentYear,
  });

  const { data: registerEntries = [], isLoading: registerLoading } = useLessonRegister({
    classId: selectedClass,
    subjectId: effectiveSubject || undefined,
    teacherId: effectiveTeacher || undefined,
    term: currentTerm,
    academicYear: currentYear,
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["active-leaves", currentTerm, currentYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("*, profile:profiles(full_name)")
        .eq("status", "approved");
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .gte("scheduled_for", `${today}T00:00:00`)
        .lte("scheduled_for", `${today}T23:59:59`);
      return data || [];
    },
  });

  const teachersOnLeave = useMemo(() => {
    const today = new Date();
    return leaveRequests.filter((lr: any) => {
      const start = new Date(lr.start_date);
      const end = new Date(lr.end_date);
      return start <= today && end >= today;
    }).map((lr: any) => lr.user_id);
  }, [leaveRequests]);

  const onLeaveSet = useMemo(() => new Set(teachersOnLeave), [teachersOnLeave]);

  const schemesByTeacher = useMemo(() => {
    const map: Record<string, any[]> = {};
    schemes.forEach((s: any) => {
      const tid = s.teacher_id;
      if (!map[tid]) map[tid] = [];
      map[tid].push(s);
    });
    return map;
  }, [schemes]);

  const registerByTeacher = useMemo(() => {
    const map: Record<string, any[]> = {};
    registerEntries.forEach((e: any) => {
      const tid = e.teacher_id;
      if (!map[tid]) map[tid] = [];
      map[tid].push(e);
    });
    return map;
  }, [registerEntries]);

  const teacherCoverage = useMemo(() => {
    return teachers.filter((t: any) => {
      if (effectiveTeacher && t.id !== effectiveTeacher) return false;
      return schemesByTeacher[t.id]?.length > 0;
    }).map((t: any) => {
      const tSchemes = schemesByTeacher[t.id] || [];
      const tRegister = registerByTeacher[t.id] || [];
      const taughtCount = tRegister.filter((e: any) => e.taught_status === "taught").length;
      const partialCount = tRegister.filter((e: any) => e.taught_status === "partially_taught").length;
      const notTaughtCount = tRegister.filter((e: any) => e.taught_status === "not_taught").length;
      const totalPlanned = tSchemes.reduce((sum: number, s: any) => sum + (s.planned_lessons || 1), 0);
      const isOnLeave = onLeaveSet.has(t.id);

      const weeklyPlan: Record<number, any[]> = {};
      tSchemes.forEach((s: any) => {
        const w = s.week_number;
        if (!weeklyPlan[w]) weeklyPlan[w] = [];
        weeklyPlan[w].push(s);
      });

      const weeklyDelivery: Record<number, any[]> = {};
      tRegister.forEach((e: any) => {
        const d = new Date(e.date);
        const iso = d.toISOString().split("T")[0];
        if (!weeklyDelivery[iso]) weeklyDelivery[iso] = [];
        weeklyDelivery[iso].push(e);
      });

      const weekNumbers = Object.keys(weeklyPlan).map(Number).sort((a, b) => a - b);
      const gaps = weekNumbers.filter(w => {
        const planned = weeklyPlan[w] || [];
        const plannedTopics = planned.map((p: any) => p.topic);
        const taughtTopics = tRegister.filter((r: any) => {
          if (!r.date) return false;
          const rWeek = getWeekNumber(new Date(r.date));
          return rWeek === w;
        }).map((r: any) => r.topic);
        return plannedTopics.some((t: string) => !taughtTopics.includes(t));
      });

      const missingLessonCount = gaps.length;
      const deliveryRate = totalPlanned > 0 ? Math.round(((taughtCount + partialCount * 0.5) / totalPlanned) * 100) : 0;

      return {
        teacher: t,
        schemes: tSchemes,
        register: tRegister,
        totalPlanned,
        taughtCount,
        partialCount,
        notTaughtCount,
        deliveryRate,
        isOnLeave,
        weeklyPlan,
        weeklyDelivery,
        gaps,
        missingLessonCount,
      };
    });
  }, [teachers, schemesByTeacher, registerByTeacher, effectiveTeacher, onLeaveSet]);

  const subjectStats = useMemo(() => {
    return subjects.map(sub => {
      const subSchemes = schemes.filter((s: any) => s.subject_id === sub.id);
      const subRegister = registerEntries.filter((e: any) => e.subject_id === sub.id);
      const plannedLessons = subSchemes.reduce((s: number, e: any) => s + (e.planned_lessons || 1), 0);
      const taught = subRegister.filter((e: any) => e.taught_status === "taught").length;
      const partial = subRegister.filter((e: any) => e.taught_status === "partially_taught").length;
      const notTaught = subRegister.filter((e: any) => e.taught_status === "not_taught").length;
      const coveragePct = plannedLessons > 0 ? Math.round(((taught + partial * 0.5) / plannedLessons) * 100) : 0;
      return { subject: sub, schemes: subSchemes, register: subRegister, plannedLessons, taught, partial, notTaught, coveragePct };
    }).filter(s => s.schemes.length > 0);
  }, [subjects, schemes, registerEntries]);

  const totalPlannedLessons = schemes.reduce((s: number, e: any) => s + (e.planned_lessons || 1), 0);
  const totalTaught = registerEntries.filter((e: any) => e.taught_status === "taught").length;
  const totalPartial = registerEntries.filter((e: any) => e.taught_status === "partially_taught").length;
  const totalNotTaught = registerEntries.filter((e: any) => e.taught_status === "not_taught").length;
  const overallDeliveryRate = totalPlannedLessons > 0 ? Math.round(((totalTaught + totalPartial * 0.5) / totalPlannedLessons) * 100) : 0;
  const totalMissingLessons = teacherCoverage.reduce((s: number, t: any) => s + t.missingLessonCount, 0);
  const teachersWithGaps = teacherCoverage.filter(t => t.missingLessonCount > 0).length;

  const getColor = (pct: number) => pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const getLabel = (pct: number) => pct >= 80 ? "On Track" : pct >= 50 ? "Behind Schedule" : "Needs Attention";

  const getStatusBadge = (pct: number) => {
    if (pct >= 80) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">On Track</Badge>;
    if (pct >= 50) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Behind Schedule</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Attention</Badge>;
  };

  const weekNumbers = useMemo(() => {
    const nums = new Set<number>();
    schemes.forEach((s: any) => nums.add(s.week_number));
    return Array.from(nums).sort((a, b) => a - b);
  }, [schemes]);

  return (
    <DashboardLayout title="Syllabus Coverage & Academic Audit" subtitle="Monitor teacher commitments, actual delivery, and topic performance">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Delivery Rate</p>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-black">{overallDeliveryRate}%</p>
              <Progress value={overallDeliveryRate} className={`mt-2 h-2 ${getColor(overallDeliveryRate)}`} />
              {getStatusBadge(overallDeliveryRate)}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Lesson Status</p>
              <p className="text-3xl font-black">{totalTaught + totalPartial + totalNotTaught}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{totalTaught} taught</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-amber-600">{totalPartial} partial</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-red-600">{totalNotTaught} missed</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Planned Lessons</p>
              <p className="text-3xl font-black">{totalPlannedLessons}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>{schemes.length} scheme entries</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Missing Lessons</p>
              <p className="text-3xl font-black text-orange-500">{totalMissingLessons}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                <span>{teachersWithGaps} teacher(s) behind</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Class</p>
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSubject("all"); setSelectedTeacher("all"); }}>
              <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Subject</p>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Teacher</p>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger><SelectValue placeholder="All teachers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name} {onLeaveSet.has(t.id) ? "(On Leave)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedClass ? (
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Select a class above to view syllabus coverage and teacher delivery tracking.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Delivery by Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No scheme entries found for this class. Teachers need to submit their schemes first.</p>
                ) : (
                  subjectStats.map(ss => (
                    <div key={ss.subject.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{ss.subject.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {ss.taught + ss.partial + ss.notTaught}/{ss.plannedLessons} lessons
                          </Badge>
                          {ss.coveragePct < 50 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{ss.coveragePct}%</span>
                          {getStatusBadge(ss.coveragePct)}
                        </div>
                      </div>
                      <Progress value={ss.coveragePct} className={`h-2.5 ${getColor(ss.coveragePct)}`} />
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="text-emerald-600">{ss.taught} taught</span>
                        <span className="text-amber-600">{ss.partial} partial</span>
                        <span className="text-red-600">{ss.notTaught} missed</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Teacher Delivery Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherCoverage.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No teachers with scheme entries for this class.</p>
                ) : (
                  teacherCoverage.map(tc => (
                    <div key={tc.teacher.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${tc.isOnLeave ? 'bg-orange-100 text-orange-700' : 'bg-primary/10 text-primary'}`}>
                            {tc.teacher.full_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{tc.teacher.full_name}</span>
                              {tc.isOnLeave && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
                                  <Ban className="h-3 w-3 mr-1" /> On Leave
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{tc.totalPlanned} planned</span>
                              <span className="text-emerald-600">{tc.taughtCount} taught</span>
                              {tc.missingLessonCount > 0 && (
                                <span className="text-red-600">{tc.missingLessonCount} gap(s)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{tc.deliveryRate}%</p>
                          <Progress value={tc.deliveryRate} className={`h-1.5 w-24 mt-1 ${getColor(tc.deliveryRate)}`} />
                        </div>
                      </div>

                      {tc.weeklyPlan && Object.keys(tc.weeklyPlan).length > 0 && (
                        <div className="ml-13">
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(tc.weeklyPlan).sort(([a]: any, [b]: any) => a - b).map(([week, plans]: [string, any]) => {
                              const topics = plans.map((p: any) => p.topic);
                              const taughtInWeek = tc.register.filter((r: any) => {
                                if (!r.date) return false;
                                const rw = getWeekNumber(new Date(r.date));
                                return rw === parseInt(week) && r.taught_status === "taught";
                              });
                              const isCovered = taughtInWeek.length > 0;
                              return (
                                <div key={week} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border ${isCovered ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                  <span className="font-bold">W{week}:</span>
                                  <span>{topics.join(", ").substring(0, 20)}</span>
                                  {isCovered ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {subjectStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-primary" />
                    Topic Detail View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectStats.map(ss => (
                    <div key={ss.subject.id} className="mb-4">
                      <button
                        onClick={() => setExpandedSubject(expandedSubject === ss.subject.id ? null : ss.subject.id)}
                        className="flex items-center gap-2 w-full text-left py-2 font-semibold text-sm hover:bg-slate-50 rounded-lg px-2"
                      >
                        {expandedSubject === ss.subject.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {ss.subject.name}
                        <Badge variant="outline" className="ml-auto">{ss.schemes.length} topics</Badge>
                      </button>
                      {expandedSubject === ss.subject.id && (
                        <div className="ml-6 mt-2 space-y-2">
                          {weekNumbers.map(week => {
                            const weekSchemes = ss.schemes.filter((s: any) => s.week_number === week);
                            if (weekSchemes.length === 0) return null;
                            const weekRegister = ss.register.filter((r: any) => {
                              if (!r.date) return false;
                              const rw = getWeekNumber(new Date(r.date));
                              return rw === week;
                            });
                            const isCovered = weekRegister.some((r: any) => r.taught_status === "taught");
                            return (
                              <div key={week} className={`border rounded-lg p-3 ${isCovered ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-200 bg-red-50/20'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs">Week {week}</span>
                                  {isCovered ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">Covered</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700">Not Covered</Badge>
                                  )}
                                </div>
                                {weekSchemes.map((s: any) => (
                                  <div key={s.id} className="text-xs text-muted-foreground">
                                    <span className="font-medium text-slate-700">{s.topic}</span>
                                    {s.sub_topic && <span className="ml-1">- {s.sub_topic}</span>}
                                    <span className="ml-2 text-[10px]">({s.planned_lessons} lesson{s.planned_lessons > 1 ? 's' : ''})</span>
                                  </div>
                                ))}
                                {weekRegister.length > 0 && (
                                  <div className="mt-1 text-[10px]">
                                    {weekRegister.map((r: any) => (
                                      <span key={r.id} className={`inline-flex items-center gap-1 mr-2 ${r.taught_status === 'taught' ? 'text-emerald-600' : r.taught_status === 'partially_taught' ? 'text-amber-600' : 'text-red-600'}`}>
                                        {r.taught_status === 'taught' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                        {r.taught_status.replace("_", " ")} - {r.date}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {totalMissingLessons > 0 && (
              <Card className="border-orange-200 bg-orange-50/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                    Missing Lessons Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {totalMissingLessons} lesson(s) planned in scheme of work but not yet marked as taught.
                    {teachersWithGaps > 0 && ` ${teachersWithGaps} teacher(s) have gaps.`}
                    Check the timetable for available free slots where catch-up lessons can be scheduled.
                  </p>
                  {teacherCoverage.filter(tc => tc.missingLessonCount > 0).map(tc => (
                    <div key={tc.teacher.id} className="bg-white rounded-lg border p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{tc.teacher.full_name}</span>
                        <Badge variant="destructive" className="text-[10px]">{tc.missingLessonCount} gap(s)</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Affected weeks: {tc.gaps.join(", ")}</p>
                        <p className="mt-1">Planned: {tc.totalPlanned} lessons | Taught: {tc.taughtCount} | Completion: {tc.deliveryRate}%</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={async () => {
                      const gaps = teacherCoverage.filter(tc => tc.missingLessonCount > 0);
                      for (const tc of gaps) {
                        await supabase.from("in_app_notifications").insert({
                          user_id: tc.teacher.id,
                          title: "Missing Lessons Detected",
                          message: `You have ${tc.missingLessonCount} lesson gap(s) in weeks ${tc.gaps.join(", ")}. Please catch up.`,
                          type: "warning",
                          link: "/teacher/lesson-register",
                          created_by: user?.id,
                        });
                      }
                      toast("Notifications sent to teachers with gaps.");
                    }}>
                      <Bell className="h-4 w-4" /> Notify Teachers
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={async () => {
                      const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "director", "head_teacher"]);
                      if (admins?.length) {
                        const rows = admins.map(a => ({
                          user_id: a.user_id,
                          title: "Missing Lessons Alert",
                          message: `${teachersWithGaps} teacher(s) have ${totalMissingLessons} missing lesson(s) in ${selectedClass ? classes.find(c => c.id === selectedClass)?.name : "selected class"}.`,
                          type: "warning",
                          link: "/dos/syllabus-coverage",
                          created_by: user?.id,
                        }));
                        await supabase.from("in_app_notifications").insert(rows);
                      }
                      toast("DOS and directors notified.");
                    }}>
                      <Bell className="h-4 w-4" /> Notify DOS & Directors
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {teachersOnLeave.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                    <Ban className="h-5 w-5" />
                    Teachers Currently on Leave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leaveRequests.filter((lr: any) => {
                      const today = new Date();
                      const start = new Date(lr.start_date);
                      const end = new Date(lr.end_date);
                      return start <= today && end >= today;
                    }).map((lr: any) => (
                      <div key={lr.id} className="bg-white rounded-lg border p-3">
                        <p className="font-semibold text-sm">{lr.profile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{lr.leave_type} leave</p>
                        <p className="text-[10px] text-muted-foreground">{lr.start_date} to {lr.end_date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek + startOfYear.getDay() + 1) / 7);
}
