import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Check, X, Clock, Calendar, Users, TrendingUp, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, addDays, startOfWeek, endOfWeek, parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useClasses } from "@/hooks/useClasses";

type AttendanceRow = {
  date: string;
  status: string;
  class_id: string;
  count: number;
};

type DailyBreakdown = {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

export const AttendanceOverview = () => {
  const { data: classes = [] } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const dateStart = format(weekStart, "yyyy-MM-dd");
  const dateEnd = format(weekEnd, "yyyy-MM-dd");

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["attendance-overview", selectedClassId, dateStart, dateEnd],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("date, status, class_id, learner_id")
        .gte("date", dateStart)
        .lte("date", dateEnd);

      if (selectedClassId) {
        query = query.eq("class_id", selectedClassId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as { date: string; status: string; class_id: string; learner_id: string }[];
    },
  });

  const classStats = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const classMap = new Map<string, { present: number; absent: number; late: number; excused: number; learners: Set<string> }>();
    const classNames = new Map(classes.map(c => [c.id, c.name]));

    rawData.forEach(r => {
      if (!classMap.has(r.class_id)) {
        classMap.set(r.class_id, { present: 0, absent: 0, late: 0, excused: 0, learners: new Set() });
      }
      const stat = classMap.get(r.class_id)!;
      stat.learners.add(r.learner_id);
      if (r.status === "present") stat.present++;
      else if (r.status === "absent") stat.absent++;
      else if (r.status === "late") stat.late++;
      else if (r.status === "excused") stat.excused++;
    });

    return Array.from(classMap.entries()).map(([id, s]) => ({
      classId: id,
      className: classNames.get(id) || id.slice(0, 8),
      total: s.present + s.absent + s.late + s.excused,
      present: s.present,
      absent: s.absent,
      late: s.late,
      excused: s.excused,
      rate: s.present + s.late > 0 ? Math.round(((s.present + s.late) / (s.present + s.absent + s.late + s.excused)) * 100) : 0,
      uniqueLearners: s.learners.size,
    }));
  }, [rawData, classes]);

  const dailyBreakdown = useMemo(() => {
    if (!rawData) return [];

    const dayMap = new Map<string, DailyBreakdown>();

    for (let d = new Date(weekStart); d <= weekEnd; d = addDays(d, 1)) {
      const key = format(d, "yyyy-MM-dd");
      dayMap.set(key, { date: key, present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    }

    rawData.forEach(r => {
      const day = dayMap.get(r.date);
      if (!day) return;
      if (r.status === "present") day.present++;
      else if (r.status === "absent") day.absent++;
      else if (r.status === "late") day.late++;
      else if (r.status === "excused") day.excused++;
      day.total++;
    });

    return Array.from(dayMap.values());
  }, [rawData, weekStart, weekEnd]);

  const chartData = dailyBreakdown.map(d => ({
    name: format(parseISO(d.date), "EEE"),
    date: d.date,
    Present: d.present,
    Absent: d.absent,
    Late: d.late,
    Excused: d.excused,
  }));

  const totalRecords = rawData?.length || 0;
  const presentCount = rawData?.filter(r => r.status === "present").length || 0;
  const absentCount = rawData?.filter(r => r.status === "absent").length || 0;
  const lateCount = rawData?.filter(r => r.status === "late").length || 0;
  const excusedCount = rawData?.filter(r => r.status === "excused").length || 0;
  const overallRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;

  const daysWithData = new Set(rawData?.map(r => r.date) || []);
  const daysInRange = differenceInDays(weekEnd, weekStart) + 1;
  const missingDays = daysInRange - daysWithData.size;

  const weekLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-stretch sm:items-center gap-2 sm:gap-4">
          <SearchableSelect
            options={[
              { value: "", label: "All Classes" },
              ...classes.map(c => ({ value: c.id, label: c.name }))
            ]}
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            placeholder="All Classes"
            className="w-full sm:w-56"
          />
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2 whitespace-nowrap">{weekLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] ml-1" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : totalRecords === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mb-4 opacity-50" />
          <p className="font-medium">No attendance records for this period</p>
          <p className="text-sm">Select a different week or class</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-6">
            <Card className="border-none shadow-sm col-span-2 sm:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{overallRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{totalRecords}</p>
                    <p className="text-[10px] text-muted-foreground">Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{presentCount}</p>
                    <p className="text-[10px] text-muted-foreground">Present</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <X className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{absentCount}</p>
                    <p className="text-[10px] text-muted-foreground">Absent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{lateCount}</p>
                    <p className="text-[10px] text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{excusedCount}</p>
                    <p className="text-[10px] text-muted-foreground">Excused</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Daily Attendance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 12 }}
                      formatter={(value: number, name: string) => [value, name]}
                      labelFormatter={(label: string) => `Day: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Present" stackId="a" radius={[0, 0, 0, 0]} fill="#10b981" />
                    <Bar dataKey="Late" stackId="a" radius={[0, 0, 0, 0]} fill="#f59e0b" />
                    <Bar dataKey="Absent" stackId="a" radius={[0, 0, 0, 0]} fill="#ef4444" />
                    <Bar dataKey="Excused" stackId="a" radius={[4, 4, 0, 0]} fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Missing Days Alert */}
          {missingDays > 0 && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <span>
                <strong>{missingDays} day{missingDays > 1 ? "s" : ""}</strong> without attendance records this week.
                {missingDays >= daysInRange
                  ? " No attendance has been taken at all."
                  : " Consider taking attendance for missing dates."}
              </span>
            </div>
          )}

          {/* Class Breakdown */}
          {!selectedClassId && classStats.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Per-Class Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Class</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Rate</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Present</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Absent</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Late</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Excused</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Learners</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStats.map((s) => (
                        <tr key={s.classId} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 font-medium">{s.className}</td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium",
                              s.rate >= 90 ? "bg-success/10 text-success" :
                              s.rate >= 75 ? "bg-warning/10 text-warning" :
                              "bg-destructive/10 text-destructive"
                            )}>
                              {s.rate}%
                            </span>
                          </td>
                          <td className="p-3 text-center">{s.present}</td>
                          <td className="p-3 text-center text-destructive">{s.absent}</td>
                          <td className="p-3 text-center text-warning">{s.late}</td>
                          <td className="p-3 text-center text-muted-foreground">{s.excused}</td>
                          <td className="p-3 text-center">{s.uniqueLearners}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
