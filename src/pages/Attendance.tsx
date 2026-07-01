// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getUgandaDateString } from "@/lib/ugandaTime";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock, Calendar, Loader2, Users, BarChart3, BookOpen, ShieldAlert } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClasses } from "@/hooks/useClasses";
import { useAttendance, useBulkMarkAttendance } from "@/hooks/useAttendance";
import { AttendanceOverview } from "@/components/attendance/AttendanceOverview";
import { Database } from "@/integrations/supabase/types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

const statusBtnConfig: Record<AttendanceStatus, { icon: typeof Check; activeClass: string }> = {
  present: { icon: Check, activeClass: "bg-success text-white border-success" },
  absent: { icon: X, activeClass: "bg-destructive text-white border-destructive" },
  late: { icon: Clock, activeClass: "bg-warning text-white border-warning" },
  excused: { icon: Calendar, activeClass: "bg-muted text-muted-foreground border-muted-foreground" },
};

import { SearchableSelect } from "@/components/ui/searchable-select";

const MarkAttendanceTab = () => {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getUgandaDateString());
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [classTeacherIds, setClassTeacherIds] = useState<string[]>([]);

  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: learners = [], isLoading: learnersLoading } = useAttendance(selectedClassId, selectedDate);
  const bulkMarkAttendance = useBulkMarkAttendance();

  useRealtime("attendance", [["attendance", selectedClassId, selectedDate]]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("classes").select("id").eq("teacher_id", user.id).then(({ data }) => {
      setClassTeacherIds((data || []).map(c => c.id));
    });
  }, [user?.id]);

  const myClasses = classes.filter(c => classTeacherIds.includes(c.id));
  const isClassTeacher = classTeacherIds.length > 0;

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const learnersWithStatus = useMemo(() => {
    return learners.map((learner) => ({
      ...learner,
      currentStatus: localAttendance[learner.id] || learner.attendance?.status || null,
    }));
  }, [learners, localAttendance]);

  const handleStatusChange = (learnerId: string, status: AttendanceStatus) => {
    setLocalAttendance((prev) => ({ ...prev, [learnerId]: status }));
  };

  const presentCount = learnersWithStatus.filter((s) => s.currentStatus === "present").length;
  const absentCount = learnersWithStatus.filter((s) => s.currentStatus === "absent").length;
  const lateCount = learnersWithStatus.filter((s) => s.currentStatus === "late").length;
  const excusedCount = learnersWithStatus.filter((s) => s.currentStatus === "excused").length;

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    const records = Object.entries(localAttendance).map(([learnerId, status]) => {
      const learner = learners.find((l) => l.id === learnerId);
      return {
        learnerId,
        status,
        existingId: learner?.attendance?.id,
      };
    });

    if (records.length === 0) return;

    await bulkMarkAttendance.mutateAsync({
      classId: selectedClassId,
      date: selectedDate,
      records,
    });

    setLocalAttendance({});
  };

  const hasChanges = Object.keys(localAttendance).length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {!isClassTeacher ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold mb-1">Only Class Teachers can mark attendance</p>
            <p className="text-sm text-muted-foreground mb-4">
              You are not assigned as a Class Teacher for any class. Use the Lesson Register to track your lesson delivery.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/teacher/lesson-register"><BookOpen className="h-4 w-4" /> Go to Lesson Register</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <SearchableSelect
            options={myClasses.map(c => ({ value: c.id, label: c.name }))}
            value={selectedClassId}
            onValueChange={(value) => {
              setSelectedClassId(value);
              setLocalAttendance({});
            }}
            placeholder="Select your class"
            className="w-full sm:w-64"
            disabled={classesLoading}
          />
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setLocalAttendance({});
              }}
              className="bg-transparent text-sm outline-none w-full"
              max={getUgandaDateString()}
            />
          </div>
        </div>
        <Button 
          onClick={handleSaveAttendance} 
          disabled={!hasChanges || bulkMarkAttendance.isPending}
          className="w-full sm:w-auto"
        >
          {bulkMarkAttendance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Attendance
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-semibold text-card-foreground">{learners.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-semibold text-card-foreground">{presentCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Present</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-semibold text-card-foreground">{absentCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-semibold text-card-foreground">{lateCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Late</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-semibold text-card-foreground">{excusedCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Excused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-3 sm:p-4">
          <h3 className="font-display text-sm sm:text-base font-semibold text-card-foreground">
            {selectedClass?.name || "Select a class"} - Attendance
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {selectedClass?.teacher_name || "No teacher assigned"} • {learners.length} learners
          </p>
        </div>

        {!selectedClassId ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p>Select a class to take attendance</p>
          </div>
        ) : learnersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : learners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p>No learners in this class</p>
          </div>
        ) : (
          <div className="p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {learnersWithStatus.map((learner) => {
                const status = learner.currentStatus;
                return (
                  <div
                    key={learner.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-3 transition-colors",
                      status === "present" ? "border-success/30 bg-success/5" :
                      status === "absent" ? "border-destructive/30 bg-destructive/5" :
                      status === "late" ? "border-warning/30 bg-warning/5" :
                      "border-border bg-card"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {(learner.full_name || "").split(" ").map((n: string) => n[0] || "").join("").slice(0, 2) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 uppercase truncate">{learner.full_name}</p>
                      <p className="text-[10px] text-slate-500">
                        {learner.attendance?.check_in_time
                          ? `In: ${learner.attendance.check_in_time.slice(0, 5)}`
                          : "Not recorded"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((s) => {
                        const cfg = statusBtnConfig[s];
                        const Icon = cfg.icon;
                        const isActive = status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleStatusChange(learner.id, s)}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-md border transition-all",
                              isActive ? cfg.activeClass : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                            )}
                            title={s.charAt(0).toUpperCase() + s.slice(1)}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unsaved Changes Notice */}
      {hasChanges && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm text-warning-foreground">
          You have unsaved changes. Click "Save Attendance" to save.
        </div>
      )}
      </>
      )}
    </div>
  );
};

const Attendance = () => {
  return (
    <DashboardLayout title="Attendance" subtitle="Track and analyse learner attendance">
      <div className="mb-4 sm:mb-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="mark" className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Mark Attendance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0">
            <AttendanceOverview />
          </TabsContent>
          <TabsContent value="mark" className="mt-0">
            <MarkAttendanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
