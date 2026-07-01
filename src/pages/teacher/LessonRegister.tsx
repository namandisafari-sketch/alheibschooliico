// @ts-nocheck
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLessonRegister, useCreateLessonRegisterEntry, useUpdateLessonRegisterEntry } from "@/hooks/useSyllabusTracking";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { useLessonPlans } from "@/hooks/useLessonPlans";
import { CheckCircle2, AlertCircle, MinusCircle, BookOpen, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusIcons = { taught: CheckCircle2, partially_taught: AlertCircle, not_taught: MinusCircle };
const statusColors = { taught: "text-emerald-600 bg-emerald-50", partially_taught: "text-amber-600 bg-amber-50", not_taught: "text-red-600 bg-red-50" };

export default function LessonRegister() {
  const { user } = useAuth();
  const { data: academicSettings } = useAcademicSettings();
  const { data: assignments = [] } = useTeacherAssignments({ teacherId: user?.id });
  const { data: plans = [] } = useLessonPlans({ teacherId: user?.id });
  const { data: entries = [], refetch } = useLessonRegister({ teacherId: user?.id });
  const createEntry = useCreateLessonRegisterEntry();
  const updateEntry = useUpdateLessonRegisterEntry();

  const currentTerm = academicSettings?.current_term_id ?? "term_1";
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const termData = academicSettings?.terms?.find((t: any) => t.id === currentTerm);
  const termStartMonth = termData?.start_month;
  const termEndMonth = termData?.end_month;

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const termStartIdx = termStartMonth ? MONTH_NAMES.indexOf(termStartMonth) : -1;
  const termEndIdx = termEndMonth ? MONTH_NAMES.indexOf(termEndMonth) : -1;

  const [selectedAssign, setSelectedAssign] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [taughtStatus, setTaughtStatus] = useState("taught");
  const [challenges, setChallenges] = useState("");
  const [participation, setParticipation] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const assignment = assignments.find(a => a.id === selectedAssign);
  const filteredEntries = entries.filter(e => {
    if (filterStatus !== "all" && e.taught_status !== filterStatus) return false;
    if (selectedAssign && assignment) {
      return e.class_id === assignment.class_id && e.subject_id === assignment.subject_id;
    }
    return true;
  });

  const handleSubmit = async () => {
    if (!assignment) return;
    const entryDate = new Date(date);
    const entryMonth = entryDate.getMonth();
    if (termStartIdx >= 0 && termEndIdx >= 0) {
      if (termStartIdx <= termEndIdx) {
        if (entryMonth < termStartIdx || entryMonth > termEndIdx) {
          toast.error(`Date falls outside the current term (${termStartMonth}–${termEndMonth}). Adjust or change the term in Academic Settings.`);
          return;
        }
      } else {
        if (entryMonth < termStartIdx && entryMonth > termEndIdx) {
          toast.error(`Date falls outside the current term (${termStartMonth}–${termEndMonth}).`);
          return;
        }
      }
    }
    await createEntry.mutateAsync({
      lesson_plan_id: selectedPlan || null,
      teacher_id: user?.id,
      class_id: assignment.class_id,
      subject_id: assignment.subject_id,
      date,
      term: currentTerm,
      academic_year: currentYear,
      topic: plans.find(p => p.id === selectedPlan)?.title || null,
      taught_status: taughtStatus,
      challenges: challenges.trim() || null,
      learner_participation: participation.trim() || null,
      follow_up: followUp.trim() || null,
    });
    toast.success("Lesson marked");
    setChallenges(""); setParticipation(""); setFollowUp("");
    refetch();
  };

  const counts = {
    taught: entries.filter(e => e.taught_status === "taught").length,
    partial: entries.filter(e => e.taught_status === "partially_taught").length,
    not_taught: entries.filter(e => e.taught_status === "not_taught").length,
    total: entries.length,
  };

  return (
    <DashboardLayout title="Lesson Register" subtitle="Record which lessons were taught and add observations">
      <div id="lr-stat-cards" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Taught", count: counts.taught, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Partially Taught", count: counts.partial, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
          { label: "Not Taught", count: counts.not_taught, icon: MinusCircle, color: "text-red-600 bg-red-50" },
          { label: "Total", count: counts.total, icon: BookOpen, color: "text-slate-600 bg-slate-50" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card id="lesson-register-form" className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-base">Mark Lesson Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div id="lr-assignment-select" className="space-y-2">
              <Label className="text-xs">Assignment</Label>
              <Select value={selectedAssign} onValueChange={setSelectedAssign}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {assignments.map(a => <SelectItem key={a.id} value={a.id}>{a.subject?.name} - {a.class?.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {assignment && (
              <>
                <div id="lr-plan-select" className="space-y-2">
                  <Label className="text-xs">Lesson Plan (optional)</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.class_id === assignment.class_id && p.subject_id === assignment.subject_id).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div id="lr-status-select" className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={taughtStatus} onValueChange={setTaughtStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taught">Taught</SelectItem>
                      <SelectItem value="partially_taught">Partially Taught</SelectItem>
                      <SelectItem value="not_taught">Not Taught</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Challenges</Label>
                  <Textarea value={challenges} onChange={e => setChallenges(e.target.value)} className="text-xs min-h-[50px]" placeholder="What challenges did you face?" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Learner Participation</Label>
                  <Textarea value={participation} onChange={e => setParticipation(e.target.value)} className="text-xs min-h-[50px]" placeholder="How did learners respond?" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Follow-up Actions</Label>
                  <Textarea value={followUp} onChange={e => setFollowUp(e.target.value)} className="text-xs min-h-[50px]" placeholder="Remedial work, revision..." />
                </div>
                <Button size="sm" className="w-full" onClick={handleSubmit} disabled={createEntry.isPending}>Save Entry</Button>
              </>
            )}
          </CardContent>
        </Card>

        <div id="lr-entries-list" className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["all", "taught", "partially_taught", "not_taught"].map(f => (
              <Button key={f} variant={filterStatus === f ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilterStatus(f)}>
                {f === "all" ? "All" : f.replace("_", " ")}
              </Button>
            ))}
          </div>
          {filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No register entries yet.</p>
            </div>
          ) : (
            filteredEntries.map(e => {
              const Icon = statusIcons[e.taught_status];
              return (
                <Card key={e.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${statusColors[e.taught_status]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
          <div id="lr-filter-bar" className="flex items-center gap-2">
                            <Badge variant="secondary">{e.subject?.name}</Badge>
                            <Badge variant="outline">{e.class?.name}</Badge>
                            <span className="text-xs text-muted-foreground">{format(new Date(e.date), "PPP")}</span>
                          </div>
                          <p className="font-semibold text-sm mt-1">{e.topic || e.lesson_plan?.title || "General lesson"}</p>
                        </div>
                      </div>
                      <Badge className={e.taught_status === 'taught' ? 'bg-emerald-100 text-emerald-700' : e.taught_status === 'partially_taught' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                        {e.taught_status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                      {e.challenges && <div className="bg-red-50 p-2 rounded-lg"><span className="font-bold text-red-600">Challenges:</span> {e.challenges}</div>}
                      {e.learner_participation && <div className="bg-blue-50 p-2 rounded-lg"><span className="font-bold text-blue-600">Participation:</span> {e.learner_participation}</div>}
                      {e.follow_up && <div className="bg-amber-50 p-2 rounded-lg"><span className="font-bold text-amber-600">Follow-up:</span> {e.follow_up}</div>}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
