// @ts-nocheck
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Printer, Save, Plus, Trash2, CheckCircle2, BookOpen } from "lucide-react";
import { useLessonPlans, useCreateLessonPlan, useUpdateLessonPlan } from "@/hooks/useLessonPlans";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

const LessonPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: plans = [], isLoading } = useLessonPlans({ teacherId: user?.id });
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: assignments = [] } = useTeacherAssignments({ teacherId: user?.id });
  const createPlan = useCreateLessonPlan();
  const updatePlan = useUpdateLessonPlan();

  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    week_number: "1",
    title: "",
    objectives: "",
    content: "",
    term: "Term 1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlan.mutateAsync({
        ...formData,
        teacher_id: user?.id,
        week_number: parseInt(formData.week_number),
      });
      toast({ title: "Success", description: "Lesson plan submitted" });
      setFormData({ ...formData, title: "", objectives: "", content: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("Lesson Planner")} subtitle={t("Prepare and manage your weekly instructional activities")}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">{t("New Lesson Plan")}</CardTitle>
            <CardDescription>{t("Draft your instructional goals")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Class")}</Label>
                  <Select onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("Class")} /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Week")}</Label>
                  <Input type="number" value={formData.week_number} onChange={(e) => setFormData(p => ({ ...p, week_number: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Subject")}</Label>
                <Select onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("Subject")} /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Lesson Title")}</Label>
                <Input value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder={t("e.g. Intro to Algebra")} />
              </div>
              <div className="space-y-2">
                <Label>{t("Objectives")}</Label>
                <Textarea value={formData.objectives} onChange={(e) => setFormData(p => ({ ...p, objectives: e.target.value }))} placeholder={t("Learners should be able to...")} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={createPlan.isPending}>
                <Plus className="h-4 w-4" /> {t("Submit Plan")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plan List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>{t("Your Active Teaching Assignments")}</span>
            </div>
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                {t("No active subject assignments found. Assign subjects in the DOS / Academic Assignments section to make lesson planning meaningful.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignments.slice(0, 4).map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Badge variant="outline">{assignment.subject?.name}</Badge>
                      <Badge variant="secondary">{assignment.class?.name}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">Term: {assignment.term}</p>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      This assignment defines the class and subject for your lesson planning entry.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 className="font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Your Lesson Plans
          </h3>
          
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">{t("Loading plans...")}</div>
          ) : plans.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">{t("You haven't created any lesson plans yet.")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{plan.class?.name}</Badge>
                          <Badge variant="outline">Week {plan.week_number}</Badge>
                          <Badge className={
                            plan.status === 'approved' ? 'bg-green-600' : 
                            plan.status === 'pending' ? 'bg-orange-500' : 'bg-slate-500'
                          }>
                            {plan.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">
                      {plan.objectives || t("No objectives defined")}
                    </p>
                    {plan.dos_feedback && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                        <strong>{t("Feedback:")}</strong> {plan.dos_feedback}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonPlanner;
