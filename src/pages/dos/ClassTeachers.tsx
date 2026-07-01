import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClasses } from "@/hooks/useClasses";
import { useStaff } from "@/hooks/useStaff";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, UserCheck, Loader2, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ClassTeachers = () => {
  const { data: classes = [], isLoading } = useClasses();
  const { data: teachers = [] } = useStaff("teacher");
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  const selected = classes.find((c) => c.id === selectedClass);

  const assignMutation = useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string | null }) => {
      const { error } = await supabase
        .from("classes")
        .update({ teacher_id: teacherId })
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: t("Success"), description: t("Class teacher updated") });
      setSelectedClass(null);
      setSelectedTeacher("");
    },
    onError: (error: any) => {
      toast({ title: t("Error"), description: error.message, variant: "destructive" });
    },
  });

  const handleOpen = (classId: string, currentTeacherId: string | null) => {
    setSelectedClass(classId);
    setSelectedTeacher(currentTeacherId || "");
  };

  return (
    <DashboardLayout
      title={t("Class Teachers")}
      subtitle={t("Assign a homeroom/form teacher to each class")}
    >
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">{t("Class Teacher vs Subject Teachers")}</p>
              <p className="mt-1 text-blue-700">
                {t("Each class has one Class Teacher responsible for overall learner welfare. Subject-specific assignments are managed separately under Teacher Load Assignments.")}
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <GraduationCap className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <CardDescription>
                    {cls.student_count} {t("learners")} &middot; P{cls.level}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {cls.teacher_name ? (
                          <span className="font-medium">{cls.teacher_name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">{t("No class teacher")}</span>
                        )}
                      </span>
                    </div>
                    <Button
                      variant={cls.teacher_name ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleOpen(cls.id, cls.teacher_id)}
                    >
                      {cls.teacher_name ? t("Change") : t("Assign")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedClass} onOpenChange={(open) => { if (!open) setSelectedClass(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("Assign Class Teacher")} &mdash; {selected?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t("Select Teacher")}</Label>
              <Select value={selectedTeacher} onValueChange={(v) => setSelectedTeacher(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Choose a teacher")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("None — remove assignment")}</SelectItem>
                  {teachers.map((tchr) => (
                    <SelectItem key={tchr.id} value={tchr.id}>
                      {tchr.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedClass(null)}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (selectedClass) {
                    assignMutation.mutate({
                      classId: selectedClass,
                      teacherId: selectedTeacher || null,
                    });
                  }
                }}
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClassTeachers;
