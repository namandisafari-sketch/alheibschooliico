// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExamSeries, useExamTimetable } from "@/hooks/useAcademicPlanning";
import { FileText, Calendar, Clock, MapPin, User, Plus, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Exams = () => {
  const { data: series = [], isLoading: loadingSeries } = useExamSeries();
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const { data: timetable = [], isLoading: loadingTimetable } = useExamTimetable(selectedSeries);
  const { toast } = useToast();

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
            <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> New Series
            </Button>
            <Button className="gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
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
                <Button variant="outline" className="mt-4" size="sm">Start Scheduling</Button>
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
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4" /> Print Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
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
                            <span className="text-xs text-muted-foreground">({slot.duration_minutes}m)</span>
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
                            <span>Room {slot.room_id?.slice(0, 4) || "TBD"}</span>
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
