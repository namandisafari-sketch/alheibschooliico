// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Clock, MapPin, User, ChevronLeft, ChevronRight, AlertTriangle, BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClasses } from "@/hooks/useClasses";
import { useClassTimetable, useCreateTimetableSlot, useTimetable } from "@/hooks/useTimetable";
import { useAuth } from "@/hooks/useAuth";
import { useTeachers } from "@/hooks/useTeachers";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 }
];
const TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00"
];

const SPECIAL_SUBJECTS = [
  { id: "break", name: "Break" },
  { id: "lunch", name: "Lunch" },
  { id: "free_period", name: "Free Period" },
];

const SUBJECT_PALETTE = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", badge: "bg-pink-100 text-pink-700", dot: "bg-pink-500" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
];

const SPECIAL_STYLES = {
  break: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  lunch: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  free_period: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

const ROW_HEIGHT = 80;
const TIME_COL_WIDTH = 80;

function getSubjectColor(subjectId: string | null, notes?: string | null) {
  if (!subjectId) {
    if (notes === "Break") return SPECIAL_STYLES.break;
    if (notes === "Lunch") return SPECIAL_STYLES.lunch;
    if (notes === "Free period") return SPECIAL_STYLES.free_period;
    return SUBJECT_PALETTE[0];
  }
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = ((hash << 5) - hash) + subjectId.charCodeAt(i);
  }
  return SUBJECT_PALETTE[Math.abs(hash) % SUBJECT_PALETTE.length];
}

function formatTimeDisplay(start: string, end: string) {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

function getDurationMinutes(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function computeRowSpan(start: string, end: string) {
  const startIdx = TIMES.indexOf(start);
  if (startIdx === -1) return 1;
  let endIdx = startIdx;
  for (let i = startIdx; i < TIMES.length; i++) {
    if (TIMES[i] < end) endIdx = i;
    else break;
  }
  return Math.max(1, endIdx - startIdx + 1);
}

const Timetable = () => {
    const { data: classes = [] } = useClasses();
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [term, setTerm] = useState("term_1");
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const createSlot = useCreateTimetableSlot();

    const { data: slotsClass = [], isLoading: isLoadingClass } = useClassTimetable(selectedClassId, term);
    const { user, role } = useAuth();

    const { data: teacherSlots = [], isLoading: isLoadingTeacher } = useQuery({
      queryKey: ["teacher-timetable", user?.id, term],
      enabled: Boolean(user && role === "teacher"),
      queryFn: async () => {
        const { data, error } = await supabase.from("class_timetables").select(`
          *,
          subjects:subjects(name, code),
          profiles:profiles(full_name),
          classes:classes(name),
          room:school_infrastructure(name)
        `).eq("teacher_id", user.id).eq("term", term);
        if (error) throw error;
        return data || [];
      },
    });

    const [teacherViewMode, setTeacherViewMode] = useState<"my" | "class">(role === "teacher" ? "my" : "class");
    const location = useLocation();
    const [highlightSlotId, setHighlightSlotId] = useState<string | null>(null);

    const slots = role === "teacher" && teacherViewMode === "my" ? teacherSlots : slotsClass;
    const isLoading = role === "teacher" && teacherViewMode === "my" ? isLoadingTeacher : isLoadingClass;
    const { data: subjects = [] } = useQuery({
      queryKey: ["subjects-list"],
      queryFn: async () => {
        const { data } = await supabase.from("subjects").select("id, name");
        return data || [];
      },
    });
    const { data: teachers = [] } = useTeachers();
    const { data: rooms = [] } = useQuery({
      queryKey: ["classroom-rooms"],
      queryFn: async () => {
        const { data } = await supabase.from("school_infrastructure").select("id, name").eq("asset_type", "classroom");
        return data || [];
      },
    });

    const [newSlot, setNewSlot] = useState({
      class_id: selectedClassId,
      subject_id: "",
      teacher_id: "",
      room_id: "",
      day_of_week: "1",
      start_time: "08:00",
      end_time: "08:40",
      notes: "",
    });

    useEffect(() => {
      setNewSlot((prev) => ({ ...prev, class_id: selectedClassId }));
    }, [selectedClassId]);

    let selectedClass = selectedClassId === "all"
      ? "General timetable"
      : classes.find(c => c.id === selectedClassId)?.name || "selected class";
    if (role === "teacher") {
      selectedClass = user?.full_name ? `${user.full_name}'s timetable` : "My Timetable";
    }
    const termOptions = ["term_1", "term_2", "term_3"];

    const selectedTermIndex = termOptions.indexOf(term);
    const handlePrevTerm = () => {
      const nextIndex = selectedTermIndex > 0 ? selectedTermIndex - 1 : termOptions.length - 1;
      setTerm(termOptions[nextIndex]);
    };
    const handleNextTerm = () => {
      const nextIndex = selectedTermIndex >= 0 ? (selectedTermIndex + 1) % termOptions.length : 0;
      setTerm(termOptions[nextIndex]);
    };

    const handleExport = () => {
      if (!selectedClassId) {
        toast({ title: "Select a class first", description: "Choose a class before exporting its timetable.", variant: "destructive" });
        return;
      }
      if (!slots.length) {
        toast({ title: "No timetable data", description: "There is no timetable data available to export.", variant: "destructive" });
        return;
      }

      const headers = ["Day", "Start Time", "End Time", "Subject", "Teacher", "Room", "Notes", "Term"];
      const csvRows = [headers.join(",")];
      slots.forEach((slot) => {
        csvRows.push([
          DAYS.find((day) => day.value === slot.day_of_week)?.label || "",
          slot.start_time,
          slot.end_time,
          slot.subjects?.name || "",
          slot.profiles?.full_name || "",
          slot.room?.name || "",
          slot.notes || "",
          slot.term || "",
        ].map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedClass || "timetable"}-${term}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Export started", description: "Downloading timetable CSV file." });
    };

    const handleAddPeriod = () => {
      if (!selectedClassId || selectedClassId === "all") {
        toast({ title: "Select a specific class", description: "Choose one class before adding a period.", variant: "destructive" });
        return;
      }
      setIsAddOpen(true);
    };

    const handleSavePeriod = async () => {
      const isSpecial = ["break", "lunch", "free_period"].includes(newSlot.subject_id);
      if (!newSlot.subject_id || (!isSpecial && !newSlot.teacher_id)) {
        toast({ title: "Missing details", description: "Please select a subject and a teacher unless this is a break or lunch slot.", variant: "destructive" });
        return;
      }
      try {
        await createSlot.mutateAsync({
          ...newSlot,
          day_of_week: Number(newSlot.day_of_week),
          room_id: newSlot.room_id || null,
          subject_id: isSpecial ? null : newSlot.subject_id,
          teacher_id: isSpecial ? null : newSlot.teacher_id,
          notes: isSpecial ? (newSlot.subject_id === "break" ? "Break" : newSlot.subject_id === "lunch" ? "Lunch" : "Free period") : newSlot.notes,
          term,
        });
        toast({ title: "Period added", description: "The timetable entry has been saved." });
        setIsAddOpen(false);
        setNewSlot((prev) => ({
          ...prev,
          subject_id: "",
          teacher_id: "",
          room_id: "",
          day_of_week: "1",
          start_time: "08:00",
          end_time: "08:40",
          notes: "",
        }));
      } catch (error: any) {
        toast({ title: "Could not save period", description: error?.message || "Try again later.", variant: "destructive" });
      }
    };

    const gridData = useMemo(() => {
      const occupied: Record<string, Set<number>> = {};
      DAYS.forEach((day) => { occupied[day.value] = new Set(); });

      const data: Record<string, Record<number, { slot: any; rowSpan: number } | "covered">> = {};
      DAYS.forEach((day) => {
        data[day.value] = {};
        TIMES.forEach((time) => { data[day.value][time] = null; });
      });

      const sorted = [...slots].sort((a, b) => TIMES.indexOf(a.start_time) - TIMES.indexOf(b.start_time));

      sorted.forEach((slot) => {
        const startIdx = TIMES.indexOf(slot.start_time);
        if (startIdx === -1) return;

        const rowSpan = computeRowSpan(slot.start_time, slot.end_time);
        const startTime = slot.start_time;

        if (!occupied[slot.day_of_week].has(startIdx)) {
          data[slot.day_of_week][startTime] = { slot, rowSpan };
          for (let i = startIdx + 1; i < startIdx + rowSpan; i++) {
            occupied[slot.day_of_week].add(i);
          }
        }
      });

      return data;
    }, [slots]);

    const totalPeriods = slots.length;
    const totalTeachers = new Set(slots.map((s) => s.profiles?.full_name).filter(Boolean)).size;

    const conflicts = useMemo(() => {
      const grouped: Record<string, any[]> = {};
      slots.forEach((slot) => {
        const key = `${slot.day_of_week}-${slot.start_time}`;
        grouped[key] = grouped[key] || [];
        grouped[key].push(slot);
      });
      return Object.values(grouped).filter((group) => group.length > 1);
    }, [slots]);

    const teacherUsage = useMemo(() => {
      const counts: Record<string, { teacher: string; hours: number }> = {};
      slots.forEach((slot) => {
        const teacherName = slot.profiles?.full_name || "Unassigned";
        counts[teacherName] = counts[teacherName] || { teacher: teacherName, hours: 0 };
        counts[teacherName].hours += 1;
      });
      return Object.values(counts)
        .filter((entry) => entry.teacher !== "Unassigned")
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 3);
    }, [slots]);

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const view = params.get("view");
      if (view === "my" && role === "teacher") setTeacherViewMode("my");
      if (view === "class") setTeacherViewMode("class");
      const focus = params.get("focus");
      setHighlightSlotId(focus || null);
    }, [location.search, role]);

    useEffect(() => {
      if (!highlightSlotId) return;
      setTimeout(() => {
        const el = document.getElementById(`slot-${highlightSlotId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary");
          setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 3500);
        }
      }, 300);
    }, [highlightSlotId, slots]);

    const pageTitle = role === "teacher" ? "My Timetable" : "Academic Timetable";
    const pageSubtitle = role === "teacher" ? "Your teaching schedule & room assignments" : "Master Schedule & Block Planning";

    return (
      <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        {role === "teacher" ? (
                          <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-lg bg-slate-100 p-1">
                              <button
                                onClick={() => setTeacherViewMode("my")}
                                className={`px-3 py-1 text-sm rounded-md ${teacherViewMode === "my" ? "bg-white font-semibold" : "text-slate-600"}`}
                              >
                                My timetable
                              </button>
                              <button
                                onClick={() => setTeacherViewMode("class")}
                                className={`px-3 py-1 text-sm rounded-md ${teacherViewMode === "class" ? "bg-white font-semibold" : "text-slate-600"}`}
                              >
                                Class view
                              </button>
                            </div>
                            {teacherViewMode === "my" ? (
                              <div className="bg-slate-50 rounded-lg p-2 text-sm font-medium">{selectedClass}</div>
                            ) : (
                              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem key="all" value="all">All classes</SelectItem>
                                  {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ) : (
                          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="all" value="all">All classes</SelectItem>
                              {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevTerm}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-xs font-bold px-3 uppercase">{term.replace("_", " ")}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextTerm}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        <div className="flex gap-2 flex-1 sm:flex-none">
                            <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={handleExport}>
                                <Download className="h-4 w-4" /> Export
                            </Button>
                            <Button size="sm" className="gap-2 flex-1 sm:flex-none" onClick={handleAddPeriod} disabled={role === "teacher" && teacherViewMode === "my"}>
                                <Plus className="h-4 w-4" /> Add Period
                            </Button>
                        </div>
                    </div>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Timetable Period</DialogTitle>
                      <DialogDescription>Open a new timetable slot for the selected class and term.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Subject</Label>
                          <Select value={newSlot.subject_id} onValueChange={(value) => setNewSlot((prev) => ({ ...prev, subject_id: value }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {SPECIAL_SUBJECTS.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                              ))}
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Teacher</Label>
                          <Select value={newSlot.teacher_id} onValueChange={(value) => setNewSlot((prev) => ({ ...prev, teacher_id: value }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Day</Label>
                          <Select value={newSlot.day_of_week} onValueChange={(value) => setNewSlot((prev) => ({ ...prev, day_of_week: value }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map((day) => (
                                <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Start Time</Label>
                          <Input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot((prev) => ({ ...prev, start_time: e.target.value }))} />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot((prev) => ({ ...prev, end_time: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <Label>Room</Label>
                        <Select value={newSlot.room_id} onValueChange={(value) => setNewSlot((prev) => ({ ...prev, room_id: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea value={newSlot.notes} onChange={(e) => setNewSlot((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
                      </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button onClick={handleSavePeriod}>Save Period</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {!selectedClassId ? (
                    <Card className="border-dashed py-20">
                        <CardContent className="text-center space-y-3">
                            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-bold">No Class Selected</h3>
                                <p className="text-sm text-muted-foreground">Select a class from the dropdown above to view its timetable.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                  <>
                    {slots.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Periods</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{totalPeriods}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Teachers</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{totalTeachers}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Conflicts</p>
                          <p className={`text-2xl font-bold mt-1 ${conflicts.length > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                            {conflicts.length}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto overflow-y-auto rounded-2xl border border-slate-100 shadow-sm bg-white"
                         style={{ maxHeight: "calc(100vh - 320px)" }}>
                      <div className="min-w-[1000px]">

                        {isLoading ? (
                          <div>
                            {TIMES.map(time => (
                              <div key={time} className="grid border-b border-slate-100"
                                   style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(5, 1fr)`, minHeight: `${ROW_HEIGHT}px` }}>
                                <div className="border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                                  <Skeleton className="h-4 w-12" />
                                </div>
                                {DAYS.map(day => (
                                  <div key={`${day.value}-${time}`} className="p-2 border-r border-slate-100 last:border-r-0 flex items-center justify-center">
                                    <Skeleton className="h-full w-full rounded-lg" />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid"
                               style={{
                                 gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(5, 1fr)`,
                                 gridTemplateRows: `auto repeat(${TIMES.length}, ${ROW_HEIGHT}px)`,
                               }}>
                            {/* Header row */}
                            <div className="sticky top-0 z-10 bg-slate-50 border-b border-r border-slate-100 font-bold text-[11px] text-slate-500 flex items-center justify-center uppercase tracking-wider"
                                 style={{ gridColumn: 1, gridRow: 1 }}>
                              Time
                            </div>
                            {DAYS.map((day, i) => (
                              <div key={day.value}
                                   className="sticky top-0 z-10 bg-slate-50 border-b border-r border-slate-100 last:border-r-0 font-bold text-[11px] text-slate-500 flex items-center justify-center uppercase tracking-wider"
                                   style={{ gridColumn: i + 2, gridRow: 1 }}>
                                {day.label}
                              </div>
                            ))}

                            {/* Grid body */}
                            {TIMES.map((time, timeIdx) => (
                              <div key={time} style={{ display: "contents" }}>
                                {/* Time label */}
                                <div className="border-r border-b border-slate-100 bg-slate-50/30 flex flex-col items-center justify-center gap-0.5"
                                     style={{ gridColumn: 1, gridRow: timeIdx + 2 }}>
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  <span className="font-medium text-[11px] text-slate-500">{time}</span>
                                </div>

                                {/* Day cells */}
                                {DAYS.map((day, dayIdx) => {
                                  const cell = gridData[day.value]?.[time];

                                  if (!cell) {
                                    return (
                                      <div key={`${day.value}-${time}`}
                                           className="border-r border-b border-slate-100 last:border-r-0 p-1.5"
                                           style={{ gridColumn: dayIdx + 2, gridRow: timeIdx + 2 }}>
                                        <div className="h-full w-full rounded-lg border border-dashed border-slate-100" />
                                      </div>
                                    );
                                  }

                                  if (cell === "covered") {
                                    return (
                                      <div key={`${day.value}-${time}`}
                                           className="border-r border-b border-slate-100 last:border-r-0"
                                           style={{ gridColumn: dayIdx + 2, gridRow: timeIdx + 2 }} />
                                    );
                                  }

                                  const { slot, rowSpan } = cell;
                                  const palette = getSubjectColor(slot.subjects?.id || slot.subject_id, slot.notes);
                                  const isSpecial = slot.notes === "Break" || slot.notes === "Lunch" || slot.notes === "Free period";

                                  return (
                                    <div key={`${slot.id}-${day.value}-${time}`}
                                         id={`slot-${slot.id}`}
                                         className={`border-r border-b border-slate-100 last:border-r-0 p-1.5 ${highlightSlotId === slot.id ? 'ring-2 ring-primary rounded-lg relative z-20' : ''}`}
                                         style={{ gridColumn: dayIdx + 2, gridRow: `${timeIdx + 2} / span ${rowSpan}` }}>
                                      <div className={`h-full ${palette.bg} border ${palette.border} rounded-lg ${isSpecial ? '' : 'shadow-sm'} hover:shadow-md transition-shadow overflow-hidden flex flex-col ${rowSpan >= 3 ? 'p-2.5' : 'p-1.5'}`}>
                                        {/* Top row: subject + badge */}
                                        <div className="flex items-start justify-between gap-1 min-w-0">
                                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${palette.dot}`} />
                                            <span className={`font-bold ${palette.text} truncate ${rowSpan >= 3 ? 'text-xs' : 'text-[11px]'}`}>
                                              {slot.subjects?.name || slot.notes || "Period"}
                                            </span>
                                          </div>
                                          {slot.room?.name && (
                                            <Badge variant="outline" className={`${palette.badge} text-[9px] h-4 px-1 border-0 flex-shrink-0 font-medium`}>
                                              {slot.room.name}
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Time range */}
                                        <div className={`flex items-center gap-1 text-[10px] text-slate-500 mt-0.5`}>
                                          <Clock className="h-3 w-3 flex-shrink-0" />
                                          <span>{formatTimeDisplay(slot.start_time, slot.end_time)}</span>
                                          <span className="text-slate-300 mx-0.5">·</span>
                                          <span>{getDurationMinutes(slot.start_time, slot.end_time)}min</span>
                                        </div>

                                        {/* Teacher */}
                                        {slot.profiles?.full_name && (
                                          <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5">
                                            <User className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{slot.profiles.full_name}</span>
                                          </div>
                                        )}

                                        {/* Class name */}
                                        {slot.classes?.name && (
                                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                            <BookOpen className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{slot.classes.name}</span>
                                          </div>
                                        )}

                                        {/* Notes */}
                                        {slot.notes && !["Break", "Lunch", "Free period"].includes(slot.notes) && (
                                          <p className={`text-[9px] text-slate-400 italic truncate mt-0.5`}>{slot.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" /> 
                                Detected Conflicts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {conflicts.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-700">{conflicts.length} conflict{conflicts.length === 1 ? "" : "s"} found for {selectedClass}.</p>
                                    {conflicts.slice(0, 3).map((group, index) => {
                                        const slot = group[0];
                                        return (
                                            <div key={index} className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-[11px] text-orange-700">
                                                <p className="font-semibold">{slot.start_time} on {DAYS.find((d) => d.value === slot.day_of_week)?.label || "Unknown"}</p>
                                                <p>{group.length} overlapping period{group.length === 1 ? "" : "s"}.</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4 bg-slate-50 rounded-lg border border-dashed">
                                    No scheduling conflicts detected for {selectedClass}.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                Teacher Utilization
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {teacherUsage.length > 0 ? (
                                teacherUsage.map((usage) => (
                                    <div key={usage.teacher} className="flex items-center justify-between">
                                        <span className="text-xs font-medium truncate">{usage.teacher}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, usage.hours * 10)}%` }}></div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{usage.hours} period{usage.hours === 1 ? "" : "s"}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4 bg-slate-50 rounded-lg border border-dashed">
                                    No teacher timetable data available for {selectedClass}.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Timetable;
