// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTeacherAssignments, useCreateAssignment, useDeleteAssignment } from "@/hooks/useTeacherAssignments";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useStaff } from "@/hooks/useStaff";
import { Layers, Plus, Trash2, User, BookOpen, GraduationCap, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Assignments = () => {
  const { data: assignments = [], isLoading } = useTeacherAssignments();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useStaff("teacher");
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: "",
    class_id: "",
    subject_id: "",
    term: "Term 1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.class_id || !formData.subject_id) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    try {
      await createAssignment.mutateAsync(formData);
      toast({ title: "Success", description: "Assignment created successfully" });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment.mutateAsync(id);
      toast({ title: "Removed", description: "Assignment deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Class Assignments" subtitle="Academic Resource Allocation & Teacher Load">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
             <Badge variant="outline" className="gap-1 px-3 py-1">
               <User className="h-3 w-3" /> {teachers.length} Teachers
             </Badge>
             <Badge variant="outline" className="gap-1 px-3 py-1">
               <GraduationCap className="h-3 w-3" /> {classes.length} Classes
             </Badge>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Teacher to Class</DialogTitle>
                <DialogDescription>Link a teacher to a specific subject in a class</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select onValueChange={(v) => setFormData(p => ({ ...p, teacher_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createAssignment.isPending}>
                  {createAssignment.isPending ? "Assigning..." : "Confirm Assignment"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Master Assignment List</CardTitle>
            <CardDescription>Academic year 2024 active deployments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-lg space-y-2">
                <Layers className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">No teacher assignments found.</p>
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>Create first assignment</Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
