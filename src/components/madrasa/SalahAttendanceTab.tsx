// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle2, Sparkles, BookOpen, User, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useSalahAttendance, useSaveSalahAttendance } from "@/hooks/useMadrasa";
import { useLearners } from "@/hooks/useLearners";
import { useClasses } from "@/hooks/useClasses";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Tahajjud"];

export const SalahAttendanceTab = () => {
  const [date, setDate] = useState(new Date());
  const { toast } = useToast();
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data: records = [], isLoading, refetch } = useSalahAttendance(formattedDate);
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: learners = [], isLoading: learnersLoading } = useLearners();

  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; existingId?: string }>>({});

  const saveSalah = useSaveSalahAttendance();

  // Populate first class as selected class once classes are loaded
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Synchronize existing attendance records with the local state map when a prayer is opened
  useEffect(() => {
    if (!selectedPrayer) return;
    
    const map: Record<string, { status: string; existingId?: string }> = {};
    records
      .filter(r => r.prayer_name === selectedPrayer)
      .forEach(r => {
        if (r.learner_id) {
          map[r.learner_id] = { status: r.status, existingId: r.id };
        }
      });
    setAttendanceMap(map);
  }, [selectedPrayer, records]);

  const getStats = (prayer: string) => {
    const prayerRecords = records.filter(r => r.prayer_name === prayer);
    const present = prayerRecords.filter(r => r.status === "Jamaah" || r.status === "Individual").length;
    return { present, total: prayerRecords.length };
  };

  const filteredLearners = learners.filter(l => l.class_id === selectedClassId && l.status === "active");

  const handleStatusChange = (learnerId: string, status: string) => {
    setAttendanceMap(prev => {
      const current = prev[learnerId]?.status;
      // Toggle off if same clicked twice, or select new
      if (current === status) {
        const next = { ...prev };
        delete next[learnerId];
        return next;
      }
      return {
        ...prev,
        [learnerId]: {
          ...prev[learnerId],
          status
        }
      };
    });
  };

  const handleSaveAttendance = () => {
    if (!selectedPrayer) return;

    // Filter local map of records to save only for currently displayed class learners
    const activeClassLearnerIds = new Set(filteredLearners.map(l => l.id));
    const recordsToSave = Object.entries(attendanceMap)
      .filter(([learnerId]) => activeClassLearnerIds.has(learnerId))
      .map(([learnerId, info]) => ({
        learnerId,
        status: info.status,
        existingId: info.existingId
      }));

    saveSalah.mutate({
      date: formattedDate,
      prayerName: selectedPrayer,
      records: recordsToSave
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Attendance for ${selectedPrayer} updated successfully.`,
        });
        setSelectedPrayer(null);
        refetch();
      },
      onError: (err) => {
        toast({
          title: "Error occurred",
          description: err.message || "Could not record salah attendance.",
          variant: "destructive"
        });
      }
    });
  };

  const handleMarkAllJamaah = () => {
    const nextMap = { ...attendanceMap };
    filteredLearners.forEach(l => {
      nextMap[l.id] = {
        ...nextMap[l.id],
        status: "Jamaah"
      };
    });
    setAttendanceMap(nextMap);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          {format(date, "EEEE, dd MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(date.getTime() - 86400000))}>Previous Day</Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(date.getTime() + 86400000))}>Next Day</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PRAYERS.map((prayer) => {
          const { present, total } = getStats(prayer);
          const percent = total > 0 ? (present / total) * 100 : 0;

          return (
            <Card key={prayer} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group bg-card">
              <CardHeader className="bg-muted/50 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800">{prayer}</CardTitle>
                <Badge className="bg-primary/10 text-primary border-none">Active</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-1.5 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-muted-foreground">Attendance Rate:</span>
                      <span className="font-bold">{present} Present / {total || '—'}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                      onClick={() => setSelectedPrayer(prayer)}
                    >
                      Mark Attendance
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Dialog for filling in Salah attendance */}
      <Dialog open={!!selectedPrayer} onOpenChange={(open) => !open && setSelectedPrayer(null)}>
        <DialogContent className="max-w-2xl bg-white shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
              Mark {selectedPrayer} Salah Attendance
            </DialogTitle>
            <DialogDescription>
              Select learning class to register today's congregational (Jamaah) and individual prayers.
            </DialogDescription>
          </DialogHeader>

          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-muted">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Subject Class:</span>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {filteredLearners.length > 0 && (
              <Button size="xs" variant="outline" className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50" onClick={handleMarkAllJamaah}>
                Set All to Jamaah
              </Button>
            )}
          </div>

          {/* Student list */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 py-4 px-1">
            {learnersLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ))
            ) : filteredLearners.length === 0 ? (
              <div className="text-center py-8 text-slate-500 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm">No active learners registered in this class.</p>
              </div>
            ) : (
              filteredLearners.map(learner => {
                const currentStatus = attendanceMap[learner.id]?.status;

                return (
                  <div key={learner.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border/60 hover:bg-slate-50/50 rounded-xl gap-2 transition-colors">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{learner.full_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Admin: {learner.admission_number || "Pending"}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {[
                        { status: "Jamaah", label: "Jamaah", active: "bg-emerald-600 text-white hover:bg-emerald-700", inactive: "text-emerald-700 border-emerald-100 hover:bg-emerald-50 bg-emerald-50/20" },
                        { status: "Individual", label: "Indiv", active: "bg-blue-600 text-white hover:bg-blue-700", inactive: "text-blue-700 border-blue-100 hover:bg-blue-50 bg-blue-50/20" },
                        { status: "Late", label: "Late", active: "bg-amber-500 text-white hover:bg-amber-600", inactive: "text-amber-700 border-amber-100 hover:bg-amber-50 bg-amber-50/20" },
                        { status: "Excused", label: "Excused", active: "bg-purple-600 text-white hover:bg-purple-700", inactive: "text-purple-700 border-purple-100 hover:bg-purple-50 bg-purple-50/20" },
                        { status: "Absent", label: "Absent", active: "bg-rose-600 text-white hover:bg-rose-700", inactive: "text-rose-700 border-rose-100 hover:bg-rose-50 bg-rose-50/20" }
                      ].map(cfg => {
                        const isSelected = currentStatus === cfg.status;
                        return (
                          <Button
                            key={cfg.status}
                            size="xs"
                            variant={isSelected ? "default" : "outline"}
                            className={`h-7 px-2 text-[11px] font-medium transition-all ${isSelected ? cfg.active : cfg.inactive}`}
                            onClick={() => handleStatusChange(learner.id, cfg.status)}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
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

          {/* Action Footer */}
          <div className="flex justify-end gap-2 border-t border-muted pt-4">
            <Button variant="outline" onClick={() => setSelectedPrayer(null)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSaveAttendance}
              disabled={saveSalah.isPending || filteredLearners.length === 0}
            >
              {saveSalah.isPending ? "Saving Records..." : "Save Daily Attendance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
