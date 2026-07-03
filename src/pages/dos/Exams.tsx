// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExamSeries, useExamTimetable } from "@/hooks/useAcademicPlanning";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useStaff } from "@/hooks/useStaff";
import { FileText, Calendar, Clock, MapPin, User, Plus, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Exams = () => {
  const { data: series = [], isLoading: loadingSeries } = useExamSeries();
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const { data: timetable = [], isLoading: loadingTimetable } = useExamTimetable(selectedSeries);
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useStaff("teacher");
  const { data: rooms = [] } = useQuery({
    queryKey: ["exam-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_infrastructure")
        .select("id, name, sitting_capacity")
        .eq("asset_type", "classroom");
      if (error) throw error;
      return data ?? [];
    },
  });
  const roomName = (id?: string | null) => {
    const room = rooms.find((room) => room.id === id);
    if (!room) return id || "TBD";
    return room.name ? `${room.name}${room.sitting_capacity ? ` (${room.sitting_capacity})` : ""}` : id || "TBD";
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [seriesOpen, setSeriesOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [newSeries, setNewSeries] = useState({ name: "", academic_year: "", term: "", start_date: "", end_date: "" });
  const [newSlot, setNewSlot] = useState({ exam_date: "", start_time: "", end_time: "", class_id: "", subject_id: "", invigilator_id: "", room_id: "" });

  const createSeries = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exam_series").insert({
        name: newSeries.name,
        academic_year: newSeries.academic_year ? Number(newSeries.academic_year) : null,
        term: newSeries.term || null,
        start_date: newSeries.start_date || null,
        end_date: newSeries.end_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-series"] });
      setSeriesOpen(false);
      setNewSeries({ name: "", academic_year: "", term: "", start_date: "", end_date: "" });
      toast({ title: "Series created" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const calcDuration = (start: string, end: string) => {
    if (!start || !end) return 120;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const createSlot = useMutation({
    mutationFn: async () => {
      const duration = calcDuration(newSlot.start_time, newSlot.end_time);
      const { error } = await supabase.from("exam_timetable").insert({
        series_id: selectedSeries,
        exam_date: newSlot.exam_date,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time || null,
        duration_minutes: duration > 0 ? duration : 120,
        class_id: newSlot.class_id || null,
        subject_id: newSlot.subject_id || null,
        invigilator_id: newSlot.invigilator_id || null,
        room_id: newSlot.room_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-timetable"] });
      setSlotOpen(false);
      setNewSlot({ exam_date: "", start_time: "", end_time: "", class_id: "", subject_id: "", invigilator_id: "", room_id: "" });
      toast({ title: "Slot added" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout title="Exam Scheduling" subtitle="Academic Assessments & Invigilator Rotas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end bg-card p-4 rounded-lg border shadow-sm">
          <div className="space-y-2 flex-1">
            <p className="text-xs font-bold uppercase text-muted-foreground ml-1">Exam Series</p>
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger>
                <SelectValue placeholder="Choose exam series" />
              </SelectTrigger>
              <SelectContent>
                {series.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.academic_year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={seriesOpen} onOpenChange={setSeriesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                  <Plus className="h-4 w-4" /> New Series
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Exam Series</DialogTitle>
                  <DialogDescription>Create a new academic exam series to group scheduled slots.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div><Label>Series Name</Label><Input value={newSeries.name} onChange={(e) => setNewSeries(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Term I Exams 2026" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Academic Year</Label><Input value={newSeries.academic_year} onChange={(e) => setNewSeries(p => ({ ...p, academic_year: e.target.value }))} placeholder="2026" /></div>
                    <div>
                      <Label>Term</Label>
                      <Select value={newSeries.term} onValueChange={(value) => setNewSeries(p => ({ ...p, term: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="term_1">Term 1</SelectItem>
                          <SelectItem value="term_2">Term 2</SelectItem>
                          <SelectItem value="term_3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Start Date</Label><Input type="date" value={newSeries.start_date} onChange={(e) => setNewSeries(p => ({ ...p, start_date: e.target.value }))} /></div>
                    <div><Label>End Date</Label><Input type="date" value={newSeries.end_date} onChange={(e) => setNewSeries(p => ({ ...p, end_date: e.target.value }))} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSeriesOpen(false)}>Cancel</Button>
                  <Button disabled={!newSeries.name || createSeries.isPending} onClick={() => createSeries.mutate()}>
                    {createSeries.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Series
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={slotOpen} onOpenChange={setSlotOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedSeries} className="gap-2 flex-1 sm:flex-none">
                  <Plus className="h-4 w-4" /> Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Exam Slot</DialogTitle>
                  <DialogDescription>Schedule a new exam slot under the selected series.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Date</Label><Input type="date" value={newSlot.exam_date} onChange={(e) => setNewSlot(p => ({ ...p, exam_date: e.target.value }))} /></div>
                    <div><Label>Start Time</Label><Input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot(p => ({ ...p, start_time: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>End Time</Label><Input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot(p => ({ ...p, end_time: e.target.value }))} /></div>
                    <div>
                    <Label>Room</Label>
                    <div>
                      <Select value={newSlot.room_id} onValueChange={(value) => setNewSlot(p => ({ ...p, room_id: value === "none" ? "" : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unspecified</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name ? `${room.name}${room.sitting_capacity ? ` (${room.sitting_capacity})` : ""}` : room.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2">
                        <Button variant="ghost" size="sm" onClick={() => window.open('/settings#wash', '_blank')}>Manage Rooms</Button>
                      </div>
                    </div>
                  </div>                  </div>                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Class</Label>
                      <Select value={newSlot.class_id} onValueChange={(value) => setNewSlot(p => ({ ...p, class_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}{cls.capacity ? ` (${cls.capacity})` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Select value={newSlot.subject_id} onValueChange={(value) => setNewSlot(p => ({ ...p, subject_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Invigilator</Label>
                      <Select value={newSlot.invigilator_id} onValueChange={(value) => setNewSlot(p => ({ ...p, invigilator_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invigilator" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSlotOpen(false)}>Cancel</Button>
                  <Button disabled={!newSlot.exam_date || !newSlot.start_time || createSlot.isPending} onClick={() => createSlot.mutate()}>
                    {createSlot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Slot
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => window.open('/settings#wash', '_blank')}>Manage Rooms</Button>
            </div>
          </div>
        </div>

        {!selectedSeries ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center space-y-3">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold">No Series Selected</h3>
                <p className="text-sm text-muted-foreground">Select an exam series above to view the assessment timetable.</p>
              </div>
            </CardContent>
          </Card>
        ) : loadingTimetable ? (
          <div className="py-20 text-center text-muted-foreground">Loading timetable...</div>
        ) : timetable.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center space-y-3">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold">Empty Timetable</h3>
                <p className="text-sm text-muted-foreground">No exam slots have been scheduled for this series yet.</p>
                <Button variant="outline" className="mt-4" size="sm" onClick={() => setSlotOpen(true)}>Start Scheduling</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Exam Timetable</CardTitle>
                <CardDescription>Official schedule for the selected assessment series</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.print()}>
                <FileText className="h-4 w-4" /> Print Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Invigilator</TableHead>
                      <TableHead>Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetable.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">
                          {format(new Date(slot.exam_date), "EEE, MMM d")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{slot.start_time.slice(0, 5)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{slot.end_time ? slot.end_time.slice(0, 5) : `${slot.duration_minutes}m`}</span>
                          </div>
                        </TableCell>
                        <TableCell>{slot.class?.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{slot.subject?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{slot.invigilator?.full_name || "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{roomName(slot.room_id)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Exams;
