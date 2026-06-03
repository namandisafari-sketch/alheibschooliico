// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getUgandaDateString } from "@/lib/ugandaTime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Clock, Calendar, Loader2, Users } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useClasses } from "@/hooks/useClasses";
import { useAttendance, useMarkAttendance, useBulkMarkAttendance, LearnerWithAttendance } from "@/hooks/useAttendance";
import { useDisciplineFlags } from "@/hooks/useDisciplineFlags";
import { DisciplineFlag } from "@/components/discipline/DisciplineFlag";
import { Database } from "@/integrations/supabase/types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

const statusConfig: Record<AttendanceStatus, { icon: typeof Check; color: string; label: string }> = {
  present: { icon: Check, color: "bg-success text-success-foreground", label: "Present" },
  absent: { icon: X, color: "bg-destructive text-destructive-foreground", label: "Absent" },
  late: { icon: Clock, color: "bg-warning text-warning-foreground", label: "Late" },
  excused: { icon: Calendar, color: "bg-muted text-muted-foreground", label: "Excused" },
};

import { SearchableSelect } from "@/components/ui/searchable-select";

const Attendance = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getUgandaDateString());
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});

  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: learners = [], isLoading: learnersLoading } = useAttendance(selectedClassId, selectedDate);
  const markAttendance = useMarkAttendance();
  const bulkMarkAttendance = useBulkMarkAttendance();
  const { data: flags } = useDisciplineFlags();

  // Real-time updates
  useRealtime("attendance", [["attendance", selectedClassId, selectedDate]]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Merge server data with local changes
  const learnersWithStatus = useMemo(() => {
    return learners.map((learner) => ({
      ...learner,
      currentStatus: localAttendance[learner.id] || learner.attendance?.status || null,
    }));
  }, [learners, localAttendance]);

  const handleStatusChange = (learnerId: string, status: AttendanceStatus) => {
    setLocalAttendance((prev) => ({ ...prev, [learnerId]: status }));
  };

  // Calculate stats
  const presentCount = learnersWithStatus.filter((s) => s.currentStatus === "present").length;
  const absentCount = learnersWithStatus.filter((s) => s.currentStatus === "absent").length;
  const lateCount = learnersWithStatus.filter((s) => s.currentStatus === "late").length;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "full_name",
      header: "Learner",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {row.original.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 uppercase tracking-tight text-xs">{row.original.full_name}</p>
            <p className="text-[10px] text-slate-500 font-bold">
              {row.original.attendance?.check_in_time
                ? `Checked in: ${row.original.attendance.check_in_time.slice(0, 5)}`
                : "Not recorded"}
            </p>
            {flags?.[row.original.id] && (
              <div className="mt-1 w-full max-w-[200px]">
                <DisciplineFlag disciplineCase={flags[row.original.id]} />
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.currentStatus;
        const config = status ? statusConfig[status as AttendanceStatus] : null;
        const StatusIcon = config?.icon;
        return config && StatusIcon ? (
          <Badge className={cn("text-[9px] font-black uppercase tracking-widest h-5 px-1.5", config.color)}>
            <StatusIcon className="mr-1 h-2.5 w-2.5" />
            {config.label}
          </Badge>
        ) : null;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        const status = row.original.currentStatus;
        return (
          <div className="flex gap-1 justify-end">
            <Button
              variant={status === "present" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleStatusChange(row.original.id, "present")}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant={status === "absent" ? "destructive" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleStatusChange(row.original.id, "absent")}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant={status === "late" ? "secondary" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleStatusChange(row.original.id, "late")}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

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
    <DashboardLayout title="Attendance" subtitle="Track daily learner attendance - Term 3, 2024">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <SearchableSelect
            options={classes.map(c => ({ value: c.id, label: c.name }))}
            value={selectedClassId}
            onValueChange={(value) => {
              setSelectedClassId(value);
              setLocalAttendance({});
            }}
            placeholder="Select class"
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
      <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 animate-slide-up">
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
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
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
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
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
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
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
      </div>

      {/* Attendance List */}
      <div className="mt-4 sm:mt-6 rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: "400ms" }}>
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
          <div className="p-4 sm:p-6">
            <DataTable columns={columns} data={learnersWithStatus} searchKey="full_name" />
          </div>
        )}
      </div>

      {/* Unsaved Changes Notice */}
      {hasChanges && (
        <div className="mt-4 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm text-warning-foreground">
          You have unsaved changes. Click "Save Attendance" to save.
        </div>
      )}
    </DashboardLayout>
  );
};

export default Attendance;
