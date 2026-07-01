// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon, CheckCircle2, Sparkles, BookOpen, User, Check, AlertCircle,
  Search, Clock, Users, TrendingUp, ArrowLeft, ArrowRight,
  Eye, EyeOff, Moon, Sun, Sunrise, Sunset, CloudSun, Star,
  Loader2, Filter, BarChart3, Download,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO } from "date-fns";
import { useSalahAttendance, useSaveSalahAttendance, useSalahAttendanceByDateRange, useMadrasaStats } from "@/hooks/useMadrasa";
import { useLearners } from "@/hooks/useLearners";
import { useClasses } from "@/hooks/useClasses";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';

const PRAYERS = [
  { key: "Fajr", label: "Fajr", icon: Moon, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { key: "Dhuhr", label: "Dhuhr", icon: Sun, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { key: "Asr", label: "Asr", icon: CloudSun, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { key: "Maghrib", label: "Maghrib", icon: Sunset, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { key: "Isha", label: "Isha", icon: Moon, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  { key: "Tahajjud", label: "Tahajjud", icon: Star, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
];

const STATUS_CONFIG = [
  { status: "Jamaah", label: "Jamaah", icon: Users, active: "bg-emerald-600 text-white hover:bg-emerald-700", inactive: "text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-emerald-50/20" },
  { status: "Individual", label: "Individual", icon: User, active: "bg-blue-600 text-white hover:bg-blue-700", inactive: "text-blue-700 border-blue-200 hover:bg-blue-50 bg-blue-50/20" },
  { status: "Late", label: "Late", icon: Clock, active: "bg-amber-500 text-white hover:bg-amber-600", inactive: "text-amber-700 border-amber-200 hover:bg-amber-50 bg-amber-50/20" },
  { status: "Excused", label: "Excused", icon: CheckCircle2, active: "bg-purple-600 text-white hover:bg-purple-700", inactive: "text-purple-700 border-purple-200 hover:bg-purple-50 bg-purple-50/20" },
  { status: "Absent", label: "Absent", icon: AlertCircle, active: "bg-rose-600 text-white hover:bg-rose-700", inactive: "text-rose-700 border-rose-200 hover:bg-rose-50 bg-rose-50/20" },
];

export const SalahAttendanceTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data: records = [], isLoading, refetch } = useSalahAttendance(formattedDate);
  const { data: weekRecords = [] } = useSalahAttendanceByDateRange(
    format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const { data: classes = [] } = useClasses();
  const { data: learners = [] } = useLearners();
  const { data: stats } = useMadrasaStats();

  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; existingId?: string }>>({});
  const [learnerSearch, setLearnerSearch] = useState("");
  const [showStats, setShowStats] = useState(true);

  const saveSalah = useSaveSalahAttendance();

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!selectedPrayer) return;
    const map: Record<string, { status: string; existingId?: string }> = {};
    records.filter(r => r.prayer_name === selectedPrayer).forEach(r => {
      if (r.learner_id) map[r.learner_id] = { status: r.status, existingId: r.id };
    });
    setAttendanceMap(map);
    setLearnerSearch("");
  }, [selectedPrayer, records]);

  const filteredLearners = useMemo(() => {
    let result = learners.filter(l => l.class_id === selectedClassId && l.status === "active");
    if (learnerSearch) {
      const q = learnerSearch.toLowerCase();
      result = result.filter(l =>
        l.full_name?.toLowerCase().includes(q) ||
        l.admission_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [learners, selectedClassId, learnerSearch]);

  // Stats per prayer
  const prayerStats = useMemo(() => {
    return PRAYERS.map(p => {
      const prayerRecords = records.filter(r => r.prayer_name === p.key);
      const present = prayerRecords.filter(r => r.status === "Jamaah" || r.status === "Individual").length;
      const absent = prayerRecords.filter(r => r.status === "Absent").length;
      const excused = prayerRecords.filter(r => r.status === "Excused").length;
      const late = prayerRecords.filter(r => r.status === "Late").length;
      return {
        prayer: p.key,
        label: p.label,
        icon: p.icon,
        color: p.color,
        bg: p.bg,
        total: prayerRecords.length,
        present,
        absent,
        excused,
        late,
        percent: prayerRecords.length > 0 ? Math.round((present / prayerRecords.length) * 100) : 0,
      };
    });
  }, [records]);

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayRecords = weekRecords.filter(r => r.date === dayStr);
      const present = dayRecords.filter(r => r.status === "Jamaah" || r.status === "Individual").length;
      return {
        name: format(day, "EEE"),
        date: dayStr,
        present,
        total: dayRecords.length,
      };
    });
  }, [weekRecords, date]);

  const handleStatusChange = (learnerId: string, status: string) => {
    setAttendanceMap(prev => {
      const current = prev[learnerId]?.status;
      if (current === status) {
        const next = { ...prev };
        delete next[learnerId];
        return next;
      }
      return { ...prev, [learnerId]: { ...prev[learnerId], status } };
    });
  };

  const handleSaveAttendance = () => {
    if (!selectedPrayer) return;
    const activeClassLearnerIds = new Set(filteredLearners.map(l => l.id));
    const recordsToSave = Object.entries(attendanceMap)
      .filter(([learnerId]) => activeClassLearnerIds.has(learnerId))
      .map(([learnerId, info]) => ({ learnerId, status: info.status, existingId: info.existingId }));

    saveSalah.mutate({
      date: formattedDate,
      prayerName: selectedPrayer,
      records: recordsToSave,
    }, {
      onSuccess: () => {
        toast({ title: "Salah Attendance Saved", description: `${selectedPrayer} attendance updated.` });
        setSelectedPrayer(null);
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message || "Failed to save.", variant: "destructive" });
      },
    });
  };

  const handleMarkAll = (status: string) => {
    const nextMap = { ...attendanceMap };
    filteredLearners.forEach(l => { nextMap[l.id] = { ...nextMap[l.id], status }; });
    setAttendanceMap(nextMap);
  };

  const countByStatus = (status: string) =>
    Object.values(attendanceMap).filter(v => v.status === status).length;

  const totalMarked = Object.keys(attendanceMap).length;

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => setDate(subDays(date, 1))}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <p className="font-bold text-sm">{format(date, "EEEE, dd MMMM yyyy")}</p>
            </div>
          </Card>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setDate(subDays(date, -1))}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">{stats?.todaySalahEntries || 0} entries today</span>
        </div>
      </div>

      {/* Prayer Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {prayerStats.map((p) => {
          const PrayerIcon = p.icon;
          return (
            <Card key={p.prayer} className={cn(
              "overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer group",
              selectedPrayer === p.prayer && "ring-2 ring-primary"
            )} onClick={() => setSelectedPrayer(p.prayer)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", p.bg)}>
                    <PrayerIcon className={cn("h-4 w-4", p.color)} />
                  </div>
                  <Badge variant={p.percent >= 70 ? "default" : p.percent >= 40 ? "secondary" : "destructive"} className="text-[8px] px-1.5">
                    {p.percent}%
                  </Badge>
                </div>
                <p className="font-bold text-sm">{p.prayer}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground">{p.present}/{p.total}</span>
                  <span className="text-[8px] font-bold text-muted-foreground">
                    +{p.late} late
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-2">
                  <div
                    className={cn("h-full rounded-full transition-all", p.percent >= 70 ? "bg-emerald-500" : p.percent >= 40 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Chart */}
      {showStats && weeklyChartData.some(d => d.total > 0) && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold">Weekly Attendance Trend</p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowStats(false)}>
                <EyeOff className="h-3 w-3 mr-1" /> Hide
              </Button>
            </div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="present" name="Present" radius={[4, 4, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Entry Dialog */}
      <Dialog open={!!selectedPrayer} onOpenChange={(open) => !open && setSelectedPrayer(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Mark {selectedPrayer} Salah Attendance
            </DialogTitle>
            <DialogDescription>
              {format(date, "EEEE, dd MMMM yyyy")} — Record congregational and individual prayer attendance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Class:</span>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search learner..."
                    className="pl-7 h-8 w-[180px] text-xs"
                    value={learnerSearch}
                    onChange={(e) => setLearnerSearch(e.target.value)}
                  />
                </div>
                <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={() => handleMarkAll("Jamaah")}>
                  All Jamaah
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-rose-600" onClick={() => handleMarkAll("Absent")}>
                  All Absent
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={() => setAttendanceMap({})}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Status Summary */}
            <div className="flex gap-3 text-[10px] font-medium">
              <span className="text-emerald-600">Jamaah: {countByStatus("Jamaah")}</span>
              <span className="text-blue-600">Individual: {countByStatus("Individual")}</span>
              <span className="text-amber-600">Late: {countByStatus("Late")}</span>
              <span className="text-purple-600">Excused: {countByStatus("Excused")}</span>
              <span className="text-rose-600">Absent: {countByStatus("Absent")}</span>
              <span className="text-muted-foreground">Total: {totalMarked}/{filteredLearners.length}</span>
            </div>

            {/* Learner List */}
            <div className="max-h-[350px] overflow-y-auto space-y-1.5 border rounded-xl p-2">
              {filteredLearners.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">No active learners in this class</p>
                </div>
              ) : (
                filteredLearners.map(learner => {
                  const currentStatus = attendanceMap[learner.id]?.status;
                  return (
                    <div key={learner.id} className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                      currentStatus ? "bg-slate-50 border-slate-200" : "border-dashed border-slate-200 hover:border-slate-300"
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          currentStatus === "Jamaah" ? "bg-emerald-100 text-emerald-700" :
                          currentStatus === "Individual" ? "bg-blue-100 text-blue-700" :
                          currentStatus === "Late" ? "bg-amber-100 text-amber-700" :
                          currentStatus === "Excused" ? "bg-purple-100 text-purple-700" :
                          currentStatus === "Absent" ? "bg-rose-100 text-rose-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {learner.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{learner.full_name}</p>
                          <p className="text-[9px] text-muted-foreground">{learner.admission_number || "—"}</p>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-wrap justify-end">
                        {STATUS_CONFIG.map(cfg => {
                          const isSelected = currentStatus === cfg.status;
                          const StatusIcon = cfg.icon;
                          return (
                            <Button
                              key={cfg.status}
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className={cn("h-7 px-2 text-[10px] font-medium transition-all", isSelected ? cfg.active : cfg.inactive)}
                              onClick={() => handleStatusChange(learner.id, cfg.status)}
                            >
                              {isSelected && <Check className="h-3 w-3 mr-0.5" />}
                              <StatusIcon className="h-3 w-3 mr-0.5" />
                              {cfg.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setSelectedPrayer(null)}>Cancel</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={handleSaveAttendance}
                disabled={saveSalah.isPending}
              >
                {saveSalah.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save {selectedPrayer} Attendance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
