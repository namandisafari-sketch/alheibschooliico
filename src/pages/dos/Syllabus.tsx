// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurriculumPlans, useUpdateSyllabusCoverage } from "@/hooks/useAcademicPlanning";
import { useClasses } from "@/hooks/useClasses";
import { BookMarked, CheckCircle2, Circle, Clock, Filter, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const SyllabusCoverage = () => {
  const { data: classes = [] } = useClasses();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const { data: plans = [], isLoading } = useCurriculumPlans(selectedClass);
  const updateCoverage = useUpdateSyllabusCoverage();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleToggleCoverage = async (planId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateCoverage.mutateAsync({
        plan_id: planId,
        teacher_id: user?.id,
        status: nextStatus,
        completion_date: nextStatus === "completed" ? new Date().toISOString().split("T")[0] : null,
      });
      toast({ title: "Status Updated", description: `Topic marked as ${nextStatus}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const completedCount = plans.filter(p => p.coverage?.[0]?.status === "completed").length;
  const coveragePercent = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;

  return (
    <DashboardLayout title="Syllabus Coverage" subtitle="Curriculum Tracking & Academic Audit">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
          <div className="space-y-2 flex-1">
            <p className="text-xs font-bold uppercase text-muted-foreground ml-1">Select Class</p>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class to track" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedClass && (
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground px-1">
                <span>Overall Coverage</span>
                <span>{coveragePercent}%</span>
              </div>
              <Progress value={coveragePercent} className="h-2" />
            </div>
          )}
        </div>

        {!selectedClass ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center space-y-3">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Filter className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold">No Class Selected</h3>
                <p className="text-sm text-muted-foreground">Select a class above to view and track syllabus coverage.</p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading curriculum plan...</div>
        ) : plans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center space-y-3">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <BookMarked className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold">No Plan Found</h3>
                <p className="text-sm text-muted-foreground">Curriculum plans haven't been uploaded for this class yet.</p>
                <Button variant="outline" className="mt-4" size="sm">Download Template</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const coverage = plan.coverage?.[0];
              const isCompleted = coverage?.status === "completed";
              
              return (
                <Card key={plan.id} className={isCompleted ? "border-green-200 bg-green-50/10" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">{plan.subject?.name}</Badge>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardTitle className="text-base line-clamp-2">{plan.topic_title}</CardTitle>
                    <CardDescription className="text-xs">Sequence: {plan.sequence_order}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Clock className="h-3 w-3" /> 
                      <span>Planned duration: {plan.planned_weeks} weeks</span>
                    </div>
                    <Button 
                      variant={isCompleted ? "outline" : "default"} 
                      className="w-full h-8 text-xs gap-2"
                      onClick={() => handleToggleCoverage(plan.id, coverage?.status || "pending")}
                    >
                      {isCompleted ? "Topic Covered" : "Mark as Covered"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SyllabusCoverage;
