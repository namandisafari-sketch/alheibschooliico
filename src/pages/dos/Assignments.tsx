// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTeacherAssignments, useCreateAssignment, useDeleteAssignment } from "@/hooks/useTeacherAssignments";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects, useCreateSubject } from "@/hooks/useSubjects";
import { useStaff } from "@/hooks/useStaff";
import { useBroadcastNotification } from "@/hooks/useInAppNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Layers, Plus, Trash2, User, BookOpen, GraduationCap, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Assignments = () => {
  const { data: assignments = [], isLoading } = useTeacherAssignments();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useStaff("teacher");
  const createAssignment = useCreateAssignment();
  const createSubject = useCreateSubject();
  const deleteAssignment = useDeleteAssignment();
  const broadcast = useBroadcastNotification();
  const { toast } = useToast();
  const { t, tr } = useLanguage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: "",
    class_id: "",
    subject_id: "",
    term: "Term 1",
  });
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.class_id || !formData.subject_id) {
      toast({ title: t("Error"), description: t("Please fill all fields"), variant: "destructive" });
      return;
    }
    const teacher = teachers.find((tchr) => tchr.id === formData.teacher_id);
    const classroom = classes.find((c) => c.id === formData.class_id);
    const subject = subjects.find((s) => s.id === formData.subject_id);

    try {
      const assignment = await createAssignment.mutateAsync(formData);
      toast({ title: t("Success"), description: t("Assignment created successfully") });
      setIsDialogOpen(false);

      if (teacher) {
        await broadcast.mutateAsync({
          title: t("New Teaching Assignment"),
          message: tr(`You have been assigned to teach ${subject?.name || "a subject"} in ${classroom?.name || "a class"} for ${formData.term}.`),
          audience: "user_ids",
          user_ids: [teacher.id],
          link: "/teacher/lesson-planner",
        });
      }
    } catch (error: any) {
      toast({ title: t("Error"), description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment.mutateAsync(id);
      toast({ title: t("Removed"), description: t("Assignment deleted") });
    } catch (error: any) {
      toast({ title: t("Error"), description: error.message, variant: "destructive" });
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) {
      toast({ title: t("Error"), description: t("Subject name is required"), variant: "destructive" });
      return;
    }
    try {
      await createSubject.mutateAsync({
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim() || null,
      });
      toast({ title: t("Success"), description: t("Subject added successfully") });
      setSubjectForm({ name: "", code: "" });
      setSubjectDialogOpen(false);
    } catch (error: any) {
      toast({ title: t("Error"), description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title={t("Class Assignments")} subtitle={t("Academic Resource Allocation & Teacher Load")}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-4">
             <Badge variant="outline" className="gap-1 px-3 py-1">
               <User className="h-3 w-3" /> {teachers.length} {t("Teachers")}
             </Badge>
             <Badge variant="outline" className="gap-1 px-3 py-1">
               <GraduationCap className="h-3 w-3" /> {classes.length} {t("Classes")}
             </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="gap-2" onClick={() => setSubjectDialogOpen(true)}>
              <BookOpen className="h-4 w-4" /> {t("Add Subject")}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> {t("New Assignment")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("Assign Teacher to Class")}</DialogTitle>
                  <DialogDescription>{t("Link a teacher to a specific subject in a class")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t("Teacher")}</Label>
                    <Select onValueChange={(v) => setFormData(p => ({ ...p, teacher_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Choose a teacher")} />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(tchr => (
                          <SelectItem key={tchr.id} value={tchr.id}>{tchr.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Class")}</Label>
                    <Select onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select class")} />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Subject")}</Label>
                    <Select onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Choose subject")} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createAssignment.isPending}>
                    {createAssignment.isPending ? t("Assigning...") : t("Confirm Assignment")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="hidden" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("Add New Subject")}</DialogTitle>
                  <DialogDescription>{t("Register a subject so it can be assigned to classes and lesson plans.")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubject} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t("Name")}</Label>
                    <Input
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder={t("Subject name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Code")}</Label>
                    <Input
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))}
                      placeholder={t("e.g. MATH")}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setSubjectDialogOpen(false)}>
                      {t("Cancel")}
                    </Button>
                    <Button type="submit" disabled={createSubject.isPending}>
                      {createSubject.isPending ? t("Saving...") : t("Save Subject")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{t("Subject & Syllabus Workflow")}</p>
              <p className="text-sm text-muted-foreground">{t("Add subjects, assign teachers and keep syllabus coverage updated so the lesson planner becomes fully meaningful for teaching staff.")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/dos/syllabus">
                <Button variant="outline" size="sm">{t("Manage Syllabus")}</Button>
              </Link>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>{t("Create Teaching Assignment")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("Master Assignment List")}</CardTitle>
            <CardDescription>{t("Academic year 2024 active deployments")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">{t("Loading assignments...")}</div>
            ) : assignments.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-lg space-y-2">
                <Layers className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">{t("No teacher assignments found.")}</p>
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>{t("Create first assignment")}</Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>{t("Teacher")}</TableHead>
                      <TableHead>{t("Class")}</TableHead>
                      <TableHead>{t("Subject")}</TableHead>
                      <TableHead>{t("Term")}</TableHead>
                      <TableHead className="text-right">{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((as) => (
                      <TableRow key={as.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                              {as.teacher?.full_name?.charAt(0)}
                            </div>
                            {as.teacher?.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{as.class?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <span>{as.subject?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{as.term}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(as.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
