import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, Plus, MapPin, Loader2 } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { AddClassDialog } from "@/components/classes/AddClassDialog";
import { useNavigate } from "react-router-dom";

const Classes = () => {
  const navigate = useNavigate();
  const { data: classes = [], isLoading, error } = useClasses();

  return (
    <DashboardLayout title="Classes" subtitle="Uganda New Curriculum - P1 to P7 Structure">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{classes.length} active classes</p>
          <p className="text-xs text-muted-foreground">Term 3, 2024 Academic Year</p>
        </div>
        <AddClassDialog>
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </AddClassDialog>
      </div>

      {/* Classes Grid */}
      <div className="mt-4 sm:mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            Failed to load classes. Please try again.
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No classes found</p>
            <p className="text-sm">Create your first class to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls, index) => {
              const capacity = cls.capacity || 40;
              const occupancy = (cls.student_count / capacity) * 100;

              return (
                <div
                  key={cls.id}
                  className="card-hover rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-card-foreground">
                        {cls.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cls.teacher_name || "No teacher assigned"}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Student Capacity */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Learners</span>
                      </div>
                      <span className="font-medium">
                        {cls.student_count}/{capacity}
                      </span>
                    </div>
                    <Progress value={occupancy} className="h-2" />
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 text-sm">
                    {cls.room && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{cls.room}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">Level: P{cls.level}</span>
                      {cls.academic_year && (
                        <span className="text-xs">• {cls.academic_year}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/students?class=${encodeURIComponent(cls.name)}`)}
                    >
                      View Details
                    </Button>
                    <AddClassDialog initialData={cls}>
                      <Button variant="outline" size="sm" className="flex-1">
                        Manage
                      </Button>
                    </AddClassDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Classes;
