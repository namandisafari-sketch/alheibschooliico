// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurriculumPlans } from "@/hooks/useAcademicPlanning";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, TrendingUp, BookMarked, AlertTriangle } from "lucide-react";

export default function SyllabusCoverageDashboard() {
  const { data: academicSettings } = useAcademicSettings();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const effectiveSubject = selectedSubject === "all" ? "" : selectedSubject;
  const currentTerm = academicSettings?.current_term_id ?? "term_1";
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const { data: plans = [], isLoading } = useCurriculumPlans(selectedClass, effectiveSubject, currentTerm, currentYear);
  const coverageBySubject = subjects.map(sub => {
    const subjectPlans = plans.filter(p => p.subject_id === sub.id);
    const completed = subjectPlans.filter(p => p.coverage?.[0]?.status === "completed").length;
    const total = subjectPlans.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { subject: sub.name, subjectId: sub.id, total, completed, percent };
  }).filter(s => s.total > 0);

  const totalCompleted = plans.filter(p => p.coverage?.[0]?.status === "completed").length;
  const totalPlans = plans.length;
  const overallPercent = totalPlans > 0 ? Math.round((totalCompleted / totalPlans) * 100) : 0;

  const getColor = (pct: number) => pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const getLabel = (pct: number) => pct >= 80 ? "On Track" : pct >= 50 ? "Behind Schedule" : "Needs Attention";

  return (
    <DashboardLayout title="Syllabus Coverage" subtitle="Track curriculum progress across classes and subjects">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground">Overall Coverage</p>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-black">{overallPercent}%</p>
            <Progress value={overallPercent} className={`mt-2 h-2 ${getColor(overallPercent)}`} />
            <Badge className={`mt-2 ${overallPercent >= 80 ? 'bg-emerald-100 text-emerald-700' : overallPercent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {getLabel(overallPercent)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground">Topics Completed</p>
            <p className="text-3xl font-black">{totalCompleted} / {totalPlans}</p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{totalPlans - totalCompleted} remaining</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground">Subjects Tracked</p>
            <p className="text-3xl font-black">{coverageBySubject.length}</p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <BookMarked className="h-4 w-4 text-primary" />
              <span>Select class to view</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card p-4 rounded-xl border shadow-sm mb-6">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">Class</p>
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSubject("all"); }}>
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
      </div>

      {!selectedClass ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Select a class above to view syllabus coverage details.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Loading...</div>
      ) : totalPlans === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No curriculum plans for this class. Set up topics in Curriculum Setup first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold">Coverage by Subject</h3>
          {coverageBySubject.map(s => (
            <Card key={s.subjectId}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.subject}</span>
                    <Badge variant="outline">{s.completed}/{s.total}</Badge>
                  </div>
                  <Badge className={s.percent >= 80 ? 'bg-emerald-100 text-emerald-700' : s.percent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                    {s.percent}% - {getLabel(s.percent)}
                  </Badge>
                </div>
                <Progress value={s.percent} className={`h-2.5 ${getColor(s.percent)}`} />
              </CardContent>
            </Card>
          ))}

          <h3 className="font-bold mt-6">Topic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map(plan => {
              const isCompleted = plan.coverage?.[0]?.status === "completed";
              return (
                <Card key={plan.id} className={isCompleted ? "border-emerald-200 bg-emerald-50/10" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-1 text-[10px]">{plan.subject?.name}</Badge>
                        <p className="font-semibold text-sm">{plan.topic_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Seq: {plan.sequence_order} | {plan.planned_weeks} week(s)</p>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
