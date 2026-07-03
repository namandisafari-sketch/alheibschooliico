// @ts-nocheck
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { useTeachers } from "@/hooks/useTeachers";
import { useQuery } from "@tanstack/react-query";
import { useSchemeOfWork, useCreateSchemeOfWork, useUpdateSchemeOfWork, useDeleteSchemeOfWork, useCopySchemeOfWork } from "@/hooks/useSyllabusTracking";
import { toast } from "sonner";
import { BookOpen, Copy, Plus, Trash2, Save, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function SchemeOfWork() {
  const { user } = useAuth();
  const [teacherPhone, setTeacherPhone] = useState("");
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.phone) setTeacherPhone(data.phone);
    });
  }, [user?.id]);
  const { data: academicSettings } = useAcademicSettings();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: assignments = [] } = useTeacherAssignments({ teacherId: user?.id });

  const currentTerm = academicSettings?.current_term_id ?? "term_1";
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const totalWeeks = academicSettings?.total_weeks ?? 14;

  const [viewTeacherId, setViewTeacherId] = useState<string>(user?.id || "");
  const { data: allTeachers = [] } = useTeachers();

  const isAdminOrDos = ["admin", "dos", "head_teacher", "deputy_head_teacher"].includes(role || "");
  const effectiveTeacherId = isAdminOrDos && viewTeacherId ? viewTeacherId : user?.id;

  const { data: lessonPlansList = [] } = useQuery({
    queryKey: ["lesson-plans-link", effectiveTeacherId],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_plans").select("id, title, week_number, class_id, subject_id, teacher_id, status, date").eq("teacher_id", effectiveTeacherId);
      return data || [];
    },
    enabled: !!effectiveTeacherId,
  });

  const { data: registerList = [] } = useQuery({
    queryKey: ["register-link", effectiveTeacherId],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_register").select("id, lesson_plan_id, teacher_id, class_id, subject_id, date, taught_status, topic").eq("teacher_id", effectiveTeacherId);
      return data || [];
    },
    enabled: !!effectiveTeacherId,
  });

  const { data: schemes = [], refetch } = useSchemeOfWork({ teacherId: effectiveTeacherId, term: currentTerm, academicYear: currentYear });
  const createScheme = useCreateSchemeOfWork();
  const updateScheme = useUpdateSchemeOfWork();
  const deleteScheme = useDeleteSchemeOfWork();
  const copyScheme = useCopySchemeOfWork();
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [weekNumber, setWeekNumber] = useState("1");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [plannedLessons, setPlannedLessons] = useState("1");
  const [editId, setEditId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(currentTerm);
  const [academicYear, setAcademicYear] = useState(String(currentYear));
  const [copyFromTerm, setCopyFromTerm] = useState("");
  const [targetTerm, setTargetTerm] = useState("term_1");

  const [day, setDay] = useState("");
  const [theme, setTheme] = useState("");
  const [subtheme, setSubtheme] = useState("");
  const [content, setContent] = useState("");
  const [competences, setCompetences] = useState("");
  const [methods, setMethods] = useState("");
  const [activities, setActivities] = useState("");
  const [lifeSkills, setLifeSkills] = useState("");
  const [learningAids, setLearningAids] = useState("");
  const [references, setReferences] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const assignment = assignments.find(a => a.id === selectedAssignment);

  const filteredSchemes = selectedAssignment && assignment
    ? schemes.filter(s => s.class_id === assignment.class_id && s.subject_id === assignment.subject_id)
    : schemes;

  const enrichedSchemes = filteredSchemes.map((s: any) => {
    const linkedPlans = lessonPlansList.filter((lp: any) =>
      lp.teacher_id === s.teacher_id && lp.class_id === s.class_id && lp.subject_id === s.subject_id && lp.week_number === s.week_number
    );
    const linkedRegister = registerList.filter((r: any) =>
      r.teacher_id === s.teacher_id && r.class_id === s.class_id && r.subject_id === s.subject_id
    );
    const hasTaught = linkedRegister.some((r: any) => r.taught_status === "taught");
    const hasPartial = linkedRegister.some((r: any) => r.taught_status === "partially_taught");
    return { ...s, lessonPlans: linkedPlans, registerEntries: linkedRegister, hasTaught, hasPartial };
  });

  const handleAdd = async () => {
    if (!assignment || !topic.trim()) return;
    const week = parseInt(weekNumber);
    if (week < 1 || week > totalWeeks) {
      toast.error(`Week must be between 1 and ${totalWeeks}`);
      return;
    }
    await createScheme.mutateAsync({
      teacher_id: user?.id,
      class_id: assignment.class_id,
      subject_id: assignment.subject_id,
      week_number: week,
      term: selectedTerm,
      academic_year: parseInt(academicYear) || currentYear,
      topic: topic.trim(),
      sub_topic: subTopic.trim() || null,
      planned_lessons: parseInt(plannedLessons) || 1,
      day: day || null,
      theme: theme.trim() || null,
      subtheme: subtheme.trim() || null,
      content: content.trim() || null,
      competences: competences.trim() || null,
      methods: methods.trim() || null,
      activities: activities.trim() || null,
      life_skills: lifeSkills.trim() || null,
      learning_aids: learningAids.trim() || null,
      references: references.trim() || null,
      remarks: remarks.trim() || null,
    });
    setTopic("");
    setSubTopic("");
    setPlannedLessons("1");
    setDay("");
    setTheme("");
    setSubtheme("");
    setContent("");
    setCompetences("");
    setMethods("");
    setActivities("");
    setLifeSkills("");
    setLearningAids("");
    setReferences("");
    setRemarks("");
    setShowAdvanced(false);
    refetch();
    toast.success("Scheme entry added");
  };

  const handleCopy = async () => {
    if (!copyFromTerm) return;
    try {
      await copyScheme.mutateAsync({ fromTerm: copyFromTerm, toTerm: targetTerm, teacherId: user?.id });
      toast.success(`Copied schemes from ${copyFromTerm} to ${targetTerm}`);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout title="Scheme of Work" subtitle="Plan your weekly teaching topics and lessons">
      {isAdminOrDos && (
        <div className="mb-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Viewing Teacher:</p>
            <Select value={viewTeacherId} onValueChange={setViewTeacherId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {allTeachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> New Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Teaching Assignment</Label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger><SelectValue placeholder="Select assignment" /></SelectTrigger>
                <SelectContent>
                  {assignments.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.subject?.name} - {a.class?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignment && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Term</Label>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(academicSettings?.terms ?? []).map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Current: {currentTerm.replace("term_", "Term ")} {currentYear}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Year</Label>
                    <Input type="number" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Week (1-{totalWeeks})</Label>
                  <Select value={String(weekNumber)} onValueChange={setWeekNumber}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {weeks.map(w => <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Topic</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sub-Topic</Label>
                  <Input value={subTopic} onChange={e => setSubTopic(e.target.value)} placeholder="e.g. Addition of like fractions" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Planned Lessons</Label>
                  <Input type="number" min="1" value={plannedLessons} onChange={e => setPlannedLessons(e.target.value)} />
                </div>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="w-full gap-2 text-xs">
                      {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Advanced Fields
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Day</Label>
                      <Select value={day} onValueChange={setDay}>
                        <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                        <SelectContent>
                          {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Theme</Label>
                      <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. Number and Numeration" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Subtheme</Label>
                      <Input value={subtheme} onChange={e => setSubtheme(e.target.value)} placeholder="e.g. Whole Numbers" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Content</Label>
                      <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Main content to teach" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Competences</Label>
                      <Textarea value={competences} onChange={e => setCompetences(e.target.value)} placeholder="Competences to develop" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Methods</Label>
                      <Textarea value={methods} onChange={e => setMethods(e.target.value)} placeholder="Teaching methods" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Activities</Label>
                      <Textarea value={activities} onChange={e => setActivities(e.target.value)} placeholder="Learning activities" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Life Skills</Label>
                      <Textarea value={lifeSkills} onChange={e => setLifeSkills(e.target.value)} placeholder="Life skills integrated" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Learning Aids</Label>
                      <Input value={learningAids} onChange={e => setLearningAids(e.target.value)} placeholder="e.g. Charts, counters" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">References</Label>
                      <Textarea value={references} onChange={e => setReferences(e.target.value)} placeholder="Reference materials" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Remarks</Label>
                      <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Teacher remarks/notes" rows={3} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button size="sm" className="w-full gap-2" onClick={handleAdd} disabled={!topic.trim() || createScheme.isPending}>
                  <Plus className="h-4 w-4" /> Add Entry
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Your Schemes of Work</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={copyFromTerm} onValueChange={setCopyFromTerm}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Copy from term" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={targetTerm} onValueChange={setTargetTerm}>
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="To term" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={handleCopy} disabled={!copyFromTerm || copyScheme.isPending}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        {isAdminOrDos && <TableHead>Teacher</TableHead>}
                        <TableHead>Day</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead className="text-center">Planned</TableHead>
                        <TableHead className="text-center">Lesson Plans</TableHead>
                        <TableHead>Taught</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedSchemes.length === 0 ? (
                        <TableRow><TableCell colSpan={isAdminOrDos ? 11 : 10} className="text-center py-12 text-muted-foreground">No scheme entries yet. Add one using the form.</TableCell></TableRow>
                      ) : (
                        enrichedSchemes.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-bold">Week {s.week_number}</TableCell>
                            {isAdminOrDos && <TableCell className="text-xs">{s.teacher?.full_name || "—"}</TableCell>}
                            <TableCell className="text-xs">{s.day || "—"}</TableCell>
                            <TableCell>{s.subject?.name}</TableCell>
                            <TableCell>{s.class?.name}</TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate" title={s.topic}>{s.topic}{s.sub_topic ? <span className="text-xs text-muted-foreground ml-1">- {s.sub_topic}</span> : ""}</TableCell>
                            <TableCell className="text-center">{s.planned_lessons}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[10px]">{s.lessonPlans.length}</Badge>
                            </TableCell>
                            <TableCell>
                              {s.hasTaught ? (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Taught</Badge>
                              ) : s.hasPartial ? (
                                <Badge className="bg-amber-100 text-amber-700 text-[10px]">Partial</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={s.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                                {s.status === 'draft' ? 'Draft' : s.status === 'submitted' ? 'Submitted' : 'Approved'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                  setEditId(editId === s.id ? "" : s.id);
                                }}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" onClick={async () => {
                                  const next = s.status === 'draft' ? 'submitted' : s.status === 'submitted' ? 'approved' : 'draft';
                                  await updateScheme.mutateAsync({ id: s.id, status: next });
                                  refetch();
                                  toast.success(`Status → ${next}`);
                                  if (next === 'submitted') {
                                    fetch("/api/notify/scheme-submitted", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        teacherName: user?.user_metadata?.full_name || "A teacher",
                                        topic: s.topic,
                                        classSubject: `${s.class?.name || ""} ${s.subject?.name || ""}`,
                                        teacherPhone: teacherPhone || undefined,
                                      }),
                                    }).catch(() => {});
                                  }
                                }} title="Toggle Status">
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={async () => {
                                  await deleteScheme.mutateAsync(s.id);
                                  refetch();
                                  toast.success("Entry removed");
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
