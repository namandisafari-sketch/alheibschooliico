// @ts-nocheck
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CalendarDays, Save, Plus, Trash2, BookOpen, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useLessonPlans, useCreateLessonPlan, useUpdateLessonPlan } from "@/hooks/useLessonPlans";
import { useLessonRegister } from "@/hooks/useSyllabusTracking";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const LessonPlanner = () => {
  const { user } = useAuth();
  const { data: academicSettings } = useAcademicSettings();
  const { data: plans = [], isLoading, refetch } = useLessonPlans({ teacherId: user?.id });
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: assignments = [] } = useTeacherAssignments({ teacherId: user?.id });
  const { data: registerEntries = [] } = useLessonRegister({ teacherId: user?.id });
  const createPlan = useCreateLessonPlan();
  const updatePlan = useUpdateLessonPlan();

  const planTaughtMap = new Map<string, string>();
  registerEntries.forEach((re: any) => {
    if (re.lesson_plan_id && !planTaughtMap.has(re.lesson_plan_id)) {
      planTaughtMap.set(re.lesson_plan_id, re.taught_status);
    }
  });

  const [teacherPhone, setTeacherPhone] = useState("");
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.phone) setTeacherPhone(data.phone);
    });
  }, [user?.id]);

  const currentTerm = academicSettings?.current_term_id ?? "term_1";
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const totalWeeks = academicSettings?.total_weeks ?? 14;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const termStart = academicSettings?.terms?.find((t: any) => t.id === currentTerm)?.start_month;
  const termEnd = academicSettings?.terms?.find((t: any) => t.id === currentTerm)?.end_month;

  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [weekNumber, setWeekNumber] = useState("1");
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [activities, setActivities] = useState("");
  const [resources, setResources] = useState("");
  const [homework, setHomework] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editId, setEditId] = useState("");
  const [duplicateId, setDuplicateId] = useState("");

  const assignment = assignments.find(a => a.id === selectedAssignment);

  const handleSubmit = async () => {
    if (!assignment || !title.trim()) return;
    const week = parseInt(weekNumber);
    if (week < 1 || week > totalWeeks) {
      toast.error(`Week must be between 1 and ${totalWeeks}`);
      return;
    }
    await createPlan.mutateAsync({
      teacher_id: user?.id,
      class_id: assignment.class_id,
      subject_id: assignment.subject_id,
      week_number: week,
      term: currentTerm,
      academic_year: currentYear,
      title: title.trim(),
      objectives: objectives.trim() || null,
      activities: activities.trim() || null,
      resources: resources.trim() || null,
      homework: homework.trim() || null,
      date: date || null,
    });
    toast.success("Lesson plan created");
    setTitle(""); setObjectives(""); setActivities(""); setResources(""); setHomework("");
    refetch();
  };

  const handleDuplicate = async (plan: any) => {
    await createPlan.mutateAsync({
      teacher_id: user?.id,
      class_id: plan.class_id,
      subject_id: plan.subject_id,
      week_number: Math.min((plan.week_number || 0) + 1, totalWeeks),
      term: currentTerm,
      academic_year: currentYear,
      title: plan.title,
      objectives: plan.objectives,
      activities: plan.activities,
      resources: plan.resources,
      homework: plan.homework,
      date: format(new Date(), "yyyy-MM-dd"),
    });
    toast.success("Lesson plan duplicated");
    refetch();
  };

  const planCards = [
    { title: "Title", value: title, set: setTitle, placeholder: "e.g. Intro to Fractions" },
    { title: "Objectives", value: objectives, set: setObjectives, placeholder: "Learners should be able to...", multi: true },
    { title: "Activities", value: activities, set: setActivities, placeholder: "Group work, Q&A, Demonstration...", multi: true },
    { title: "Resources", value: resources, set: setResources, placeholder: "Chalkboard, textbook, flashcards..." },
    { title: "Homework", value: homework, set: setHomework, placeholder: "Exercise 2.1, page 15..." },
  ];

  return (
    <DashboardLayout title="Lesson Planner" subtitle="Create and manage detailed lesson plans with activities, resources, and homework">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card id="lesson-planner-form" className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base">New Lesson Plan</CardTitle>
            <CardDescription>Plan your daily instruction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div id="lp-assignment-select" className="space-y-2">
              <Label className="text-xs">Assignment</Label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger><SelectValue placeholder="Select assignment" /></SelectTrigger>
                <SelectContent>
                  {assignments.map(a => <SelectItem key={a.id} value={a.id}>{a.subject?.name} - {a.class?.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {assignment && (
              <>
                <div id="lp-week-date" className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Week (1-{totalWeeks})</Label>
                    <Input type="number" min="1" max={totalWeeks} value={weekNumber} onChange={e => setWeekNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
                {planCards.map(c => (
                  <div key={c.title} className="space-y-1">
                    <Label className="text-xs">{c.title}</Label>
                    {c.multi ? (
                      <Textarea value={c.value} onChange={e => c.set(e.target.value)} placeholder={c.placeholder} className="text-xs min-h-[60px]" />
                    ) : (
                      <Input value={c.value} onChange={e => c.set(e.target.value)} placeholder={c.placeholder} className="text-xs" />
                    )}
                  </div>
                ))}
                <Button id="lp-create-btn" size="sm" className="w-full gap-2 mt-2" onClick={handleSubmit} disabled={!title.trim() || createPlan.isPending}>
                  <Plus className="h-4 w-4" /> Create Plan
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div id="lp-plans-list" className="lg:col-span-2 space-y-4">
          <div id="lp-plans-header" className="flex items-center gap-2 font-bold text-slate-700">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Your Lesson Plans</span>
            <Badge variant="outline">{plans.length}</Badge>
          </div>
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No lesson plans yet. Select an assignment and create one.</p>
            </div>
          ) : (
            plans.map(plan => (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{plan.class?.name}</Badge>
                        <Badge variant="outline">Week {plan.week_number}</Badge>
                        <Badge variant="secondary">{plan.subject?.name}</Badge>
                        <Badge className={plan.status === 'approved' ? 'bg-emerald-600' : plan.status === 'submitted' ? 'bg-amber-500' : 'bg-slate-400'}>
                          {plan.status || 'draft'}
                        </Badge>
                        {(() => {
                          const taught = planTaughtMap.get(plan.id);
                          if (taught === "taught") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Taught</Badge>;
                          if (taught === "partially_taught") return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><AlertCircle className="h-3 w-3 mr-0.5" />Partial</Badge>;
                          if (taught === "not_taught") return <Badge className="bg-red-100 text-red-700 border-red-200">Not Taught</Badge>;
                          return null;
                        })()}
                      </div>
                      <CardTitle className="text-base">{plan.title}</CardTitle>
                      {plan.date && <p className="text-xs text-muted-foreground mt-1">{format(new Date(plan.date), "PPP")}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(plan)} title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" onClick={async () => {
                        const newStatus = plan.status === 'draft' ? 'submitted' : plan.status === 'submitted' ? 'approved' : 'draft';
                        await updatePlan.mutateAsync({ id: plan.id, status: newStatus });
                        refetch();
                        toast.success("Status updated");
                        if (newStatus === 'submitted') {
                          fetch("/api/notify/lesson-plan-submitted", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              teacherName: user?.user_metadata?.full_name || "A teacher",
                              planTitle: plan.title,
                              classSubject: `${plan.class?.name || ""} ${plan.subject?.name || ""}`,
                              planId: plan.id,
                              teacherPhone: teacherPhone || undefined,
                            }),
                          }).catch(() => {});
                        }
                      }} title="Toggle Status">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {plan.objectives && (
                      <div className="bg-blue-50/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">Objectives</p>
                        <p className="text-xs">{plan.objectives}</p>
                      </div>
                    )}
                    {plan.activities && (
                      <div className="bg-amber-50/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">Activities</p>
                        <p className="text-xs">{plan.activities}</p>
                      </div>
                    )}
                    {plan.resources && (
                      <div className="bg-purple-50/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-purple-600 mb-1">Resources</p>
                        <p className="text-xs">{plan.resources}</p>
                      </div>
                    )}
                    {plan.homework && (
                      <div className="bg-emerald-50/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1">Homework</p>
                        <p className="text-xs">{plan.homework}</p>
                      </div>
                    )}
                  </div>
                  {!plan.objectives && !plan.activities && !plan.resources && !plan.homework && (
                    <p className="text-xs text-muted-foreground italic">No details added yet.</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonPlanner;
