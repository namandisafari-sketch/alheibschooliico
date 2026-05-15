import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Phone, Loader2 } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { AddTeacherDialog } from "@/components/teachers/AddTeacherDialog";
import { format } from "date-fns";

const Teachers = () => {
  const { data: teachers = [], isLoading, error } = useTeachers();

  return (
    <DashboardLayout title="Teachers" subtitle="Manage teaching staff - Uganda New Curriculum">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{teachers.length} teachers</p>
          <p className="text-xs text-muted-foreground">NCDC Certified Educators</p>
        </div>
        <AddTeacherDialog>
          <Button size="sm" className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </AddTeacherDialog>
      </div>

      {/* Teachers Grid */}
      <div className="mt-4 sm:mt-6">
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
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                    {teacher.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-card-foreground truncate">
                      {teacher.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {teacher.assigned_class ? `${teacher.assigned_class} Class Teacher` : "No class assigned"}
                    </p>
                    <Badge variant="default" className="mt-2">
                      active
                    </Badge>
                  </div>
                </div>

                {/* Qualification */}
                {teacher.qualification && (
                  <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{teacher.qualification}</p>
                  </div>
                )}

                {/* Contact Info */}
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

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {teacher.created_at
                      ? `Since ${format(new Date(teacher.created_at), "yyyy")}`
                      : "—"}
                  </span>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
