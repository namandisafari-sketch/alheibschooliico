// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus, Mail, Phone, Loader2, ClipboardList, Users, FileText, UserCheck, X, Plus
} from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { AddTeacherDialog } from "@/components/teachers/AddTeacherDialog";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ExtendedProfessionalProfileForm } from "@/components/teachers/ExtendedProfessionalProfileForm";
import {
  useTeacherApplicants, useCreateApplicant, useUpdateApplicant, useDeleteApplicant,
  INTERVIEW_CRITERIA, type TeacherApplicant,
} from "@/hooks/useTeacherApplicants";
import { InterviewScoringForm } from "@/components/teachers/InterviewScoringForm";
import { InterviewReport } from "@/components/teachers/InterviewReport";

const Teachers = () => {
  const { data: teachers = [], isLoading, error } = useTeachers();
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const editMutation = useMutation({
    mutationFn: async (values: any) => {
      const scopeData = {
        date_of_birth: values.date_of_birth || null,
        specialized_subjects: values.specialized_subjects || null,
        years_of_experience: values.years_of_experience || null,
        certifications: [],
      };
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || null,
          qualification: values.qualification || null,
          registration_number: values.registration_number || null,
          scope: JSON.stringify(scopeData),
        })
        .eq("id", selectedTeacher.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profile Updated" });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setSelectedTeacher(null);
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout title="Teachers" subtitle="Manage teaching staff - Uganda New Curriculum">
      <Tabs defaultValue="teachers" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white border p-1 h-12 shadow-sm">
            <TabsTrigger value="teachers" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="applicants" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <ClipboardList className="h-4 w-4 mr-2" />
              Applicants & Interviews
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <AddTeacherDialog>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </AddTeacherDialog>
          </div>
        </div>

        <TabsContent value="teachers" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive">
              Failed to load teachers. Please try again.
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>No teachers found</p>
              <p className="text-sm">Add your first teacher to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {teachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className="card-hover rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                      {teacher.full_name ? teacher.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() : "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-card-foreground truncate">
                        {teacher.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {teacher.assigned_class ? `${teacher.assigned_class} Class Teacher` : "No class assigned"}
                      </p>
                      <Badge variant="default" className="mt-2">active</Badge>
                    </div>
                  </div>

                  {teacher.qualification && (
                    <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground font-semibold">{teacher.qualification}</p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {teacher.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">
                      {teacher.created_at ? `Since ${format(new Date(teacher.created_at), "yyyy")}` : "—"}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTeacher(teacher)}>
                      View / Edit Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applicants" className="mt-0">
          <ApplicantsSection />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>View & Edit Extended Professional Profile</DialogTitle>
            <DialogDescription>
              Modify the teacher's credentials, specialization profile, academic records, and certification uploads.
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <ExtendedProfessionalProfileForm
              initialData={selectedTeacher}
              onSubmit={async (values) => { await editMutation.mutateAsync(values); }}
              isSubmitting={editMutation.isPending}
              mode="edit"
              onCancel={() => setSelectedTeacher(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function ApplicantsSection() {
  const { data: applicants = [], isLoading } = useTeacherApplicants();
  const createApplicant = useCreateApplicant();
  const updateApplicant = useUpdateApplicant();
  const deleteApplicant = useDeleteApplicant();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [scoringApplicant, setScoringApplicant] = useState<TeacherApplicant | null>(null);
  const [reportApplicant, setReportApplicant] = useState<TeacherApplicant | null>(null);
  const [newApplicant, setNewApplicant] = useState({
    full_name: "", email: "", phone: "", position: "", qualifications: "", experience_years: 0, specialized_subjects: "",
  });

  const handleCreate = async () => {
    if (!newApplicant.full_name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    await createApplicant.mutateAsync(newApplicant);
    setNewApplicant({ full_name: "", email: "", phone: "", position: "", qualifications: "", experience_years: 0, specialized_subjects: "" });
    setShowAddForm(false);
  };

  const handleSaveScores = async (applicantId: string, scores: any[], remarks: string) => {
    const total = scores.reduce((s: number, sc: any) => s + Math.min(sc.score, sc.max_score), 0);
    const maxTotal = scores.reduce((s: number, sc: any) => s + sc.max_score, 0);
    await updateApplicant.mutateAsync({
      id: applicantId,
      interview_scores: scores,
      total_score: total,
      max_total_score: maxTotal,
      interviewer_remarks: remarks,
      status: "interviewed",
    });
    setScoringApplicant(null);
  };

  const handleDecision = async (id: string, decision: "hire" | "reject" | "hold") => {
    const { data: { user } } = await supabase.auth.getUser();
    const patch: any = {
      decision,
      decision_date: new Date().toISOString(),
      decided_by: user?.id,
    };
    if (decision === "hire") patch.status = "hired";
    else if (decision === "reject") patch.status = "rejected";
    else patch.status = "interviewed";

    await updateApplicant.mutateAsync({ id, ...patch });
    toast({
      title: decision === "hire" ? "Applicant hired!" : `Applicant ${decision === "reject" ? "rejected" : "placed on hold"}`,
      description: decision === "hire" ? "You can now add them as a teacher from the Teachers tab." : "",
    });
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    interviewed: "bg-blue-100 text-blue-800",
    hired: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    withdrawn: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{applicants.length} applicant{applicants.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showAddForm ? "Cancel" : "Register Applicant"}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-slate-50 border rounded-xl p-4 space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Applicant</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input className="h-9 rounded-lg border px-3 text-sm" placeholder="Full Name *" value={newApplicant.full_name}
              onChange={(e) => setNewApplicant({ ...newApplicant, full_name: e.target.value })} />
            <input className="h-9 rounded-lg border px-3 text-sm" placeholder="Email" value={newApplicant.email}
              onChange={(e) => setNewApplicant({ ...newApplicant, email: e.target.value })} />
            <input className="h-9 rounded-lg border px-3 text-sm" placeholder="Phone" value={newApplicant.phone}
              onChange={(e) => setNewApplicant({ ...newApplicant, phone: e.target.value })} />
            <input className="h-9 rounded-lg border px-3 text-sm" placeholder="Position Applied For *" value={newApplicant.position}
              onChange={(e) => setNewApplicant({ ...newApplicant, position: e.target.value })} />
            <input className="h-9 rounded-lg border px-3 text-sm" placeholder="Qualifications" value={newApplicant.qualifications}
              onChange={(e) => setNewApplicant({ ...newApplicant, qualifications: e.target.value })} />
            <input className="h-9 rounded-lg border px-3 text-sm" type="number" placeholder="Years of Experience" value={newApplicant.experience_years || ""}
              onChange={(e) => setNewApplicant({ ...newApplicant, experience_years: parseInt(e.target.value) || 0 })} />
            <input className="h-9 rounded-lg border px-3 text-sm" placeholder="Specialized Subjects" value={newApplicant.specialized_subjects}
              onChange={(e) => setNewApplicant({ ...newApplicant, specialized_subjects: e.target.value })} />
          </div>
          <Button size="sm" onClick={handleCreate} disabled={createApplicant.isPending}>
            Register Applicant
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mb-2" />
          <p>No applicants registered</p>
          <p className="text-sm">Register a new applicant to begin the interview process</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((app) => {
            const scores = app.interview_scores || [];
            const total = scores.reduce((s, sc) => s + sc.score, 0);
            const maxTotal = scores.reduce((s, sc) => s + sc.max_score, 0);
            return (
              <div key={app.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 truncate">{app.full_name}</h4>
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${statusColor[app.status] || ""}`}>
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{app.position}</span>
                    {app.email && <span>{app.email}</span>}
                    {app.phone && <span>{app.phone}</span>}
                    {app.experience_years > 0 && <span>{app.experience_years} yrs exp</span>}
                  </div>
                  {scores.length > 0 && (
                    <p className="text-xs font-bold text-primary mt-1">
                      Score: {total}/{maxTotal}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setScoringApplicant(app)}>
                    <ClipboardList className="h-4 w-4 mr-1" /> Score
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setReportApplicant(app)}>
                    <FileText className="h-4 w-4 mr-1" /> Report
                  </Button>
                  {app.status === "interviewed" && (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleDecision(app.id, "hire")}>
                        <UserCheck className="h-4 w-4 mr-1" /> Hire
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDecision(app.id, "reject")}>
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDecision(app.id, "hold")}>
                        Hold
                      </Button>
                    </div>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                    if (confirm("Remove this applicant?")) deleteApplicant.mutate(app.id);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!scoringApplicant} onOpenChange={(o) => !o && setScoringApplicant(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Scoring</DialogTitle>
            <DialogDescription>Rate the applicant on each criterion</DialogDescription>
          </DialogHeader>
          {scoringApplicant && (
            <InterviewScoringForm
              applicant={scoringApplicant}
              onSave={(scores, remarks) => handleSaveScores(scoringApplicant.id, scores, remarks)}
              isSaving={updateApplicant.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportApplicant} onOpenChange={(o) => !o && setReportApplicant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Report</DialogTitle>
            <DialogDescription>Full assessment report for {reportApplicant?.full_name}</DialogDescription>
          </DialogHeader>
          {reportApplicant && <InterviewReport applicant={reportApplicant} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Teachers;
