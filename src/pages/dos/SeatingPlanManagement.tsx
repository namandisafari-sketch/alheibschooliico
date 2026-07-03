// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Table2, RefreshCw, User, MapPin, Calendar, Clock,
  GraduationCap, CheckCircle2, XCircle, Trash2, Edit3, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VENUE_TYPES: Record<string, string> = {
  classroom: "Classroom",
  exam_hall: "Exam Hall",
  lab: "Lab",
  library: "Library",
  other: "Other",
};

export default function SeatingPlanManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters
  const [selectedSeries, setSelectedSeries] = useState<string>("");

  // Generation per venue
  const [patternMap, setPatternMap] = useState<Record<string, string>>({});
  const [shiftMap, setShiftMap] = useState<Record<string, number>>({});
  const [sessionMap, setSessionMap] = useState<Record<string, number>>({});
  const [selectedClassesMap, setSelectedClassesMap] = useState<Record<string, string[]>>({});
  const [deskCountEdit, setDeskCountEdit] = useState<Record<string, string>>({});
  const [editingDeskCount, setEditingDeskCount] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);

  // Fetch exam series
  const { data: series = [] } = useQuery({
    queryKey: ["exam-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_series")
        .select("id, name, academic_year, term")
        .order("academic_year", { ascending: false })
        .order("term", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all exam timetables
  const { data: timetables = [] } = useQuery({
    queryKey: ["exam-timetable-all", selectedSeries],
    queryFn: async () => {
      let query = supabase
        .from("exam_timetable")
        .select("*, class:classes!exam_timetable_class_id_fkey(id, name), subject:subjects(id, name), invigilator:profiles!exam_timetable_invigilator_id_fkey(id, full_name)")
        .order("exam_date")
        .order("start_time");
      if (selectedSeries) {
        query = query.eq("exam_series_id", selectedSeries);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch venues with their timetable info
  const { data: venues = [] } = useQuery({
    queryKey: ["exam-venues-all", selectedSeries],
    queryFn: async () => {
      let query = supabase
        .from("exam_venues")
        .select("*, timetable:exam_timetable!exam_venues_exam_timetable_id_fkey(id, exam_date, start_time, end_time, exam_series_id), hosted_class:classes!exam_venues_hosted_class_id_fkey(id, name)")
        .order("venue_name");
      if (selectedSeries) {
        query = query.eq("timetable.exam_series_id", selectedSeries);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch all active classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch seating plans for all venues
  const venueIds = venues.map(v => v.id);
  const { data: plans = [] } = useQuery({
    queryKey: ["seating-plans-all", venueIds],
    queryFn: async () => {
      if (venueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("exam_seating_plans")
        .select("*, venue:exam_venues!exam_seating_plans_exam_venue_id_fkey(id, venue_name)")
        .in("exam_venue_id", venueIds);
      if (error) throw error;
      return data;
    },
    enabled: venueIds.length > 0,
  });

  // Update desk count mutation
  const updateDeskCount = useMutation({
    mutationFn: async ({ venueId, deskCount }: { venueId: string; deskCount: number }) => {
      const { error } = await supabase
        .from("exam_venues")
        .update({ capacity: deskCount })
        .eq("id", venueId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-venues-all"] });
      toast({ title: "Desk count updated" });
    },
    onError: (e) => {
      toast({ title: "Error updating desk count", description: e.message, variant: "destructive" });
    },
  });

  // Delete plan mutation
  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      await supabase.from("exam_seat_assignments").delete().eq("seating_plan_id", planId);
      await supabase.from("exam_seating_plans").delete().eq("id", planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seating-plans-all"] });
      toast({ title: "Seating plan deleted" });
    },
    onError: (e) => {
      toast({ title: "Error deleting plan", description: e.message, variant: "destructive" });
    },
  });

  const generatePlan = async (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;

    const selectedClassIds = selectedClassesMap[venueId];
    if (!selectedClassIds || selectedClassIds.length === 0) {
      toast({ title: "No classes selected", description: "Select at least one class to seat", variant: "destructive" });
      return;
    }

    const patternType = patternMap[venueId] || "shift";
    const shiftAmount = shiftMap[venueId] || 1;
    const totalSessions = sessionMap[venueId] || 1;

    setGenerating(prev => ({ ...prev, [venueId]: true }));
    try {
      // Fetch learners from selected classes
      const { data: learners, error: learnersError } = await supabase
        .from("learners")
        .select("id, full_name, admission_number, class_id")
        .in("class_id", selectedClassIds)
        .eq("status", "active")
        .order("admission_number");

      if (learnersError) throw learnersError;
      if (!learners || learners.length === 0) {
        toast({ title: "No learners", description: "No active learners found in selected classes", variant: "destructive" });
        setGenerating(prev => ({ ...prev, [venueId]: false }));
        return;
      }

      const totalDesks = Math.min(venue.capacity, learners.length);

      // Delete existing plan for this venue if any
      const existingPlan = plans.find(p => p.exam_venue_id === venueId);
      if (existingPlan) {
        await supabase.from("exam_seat_assignments").delete().eq("seating_plan_id", existingPlan.id);
        await supabase.from("exam_seating_plans").delete().eq("id", existingPlan.id);
      }

      // Create new seating plan
      const { data: newPlan, error: planError } = await supabase
        .from("exam_seating_plans")
        .insert({
          exam_venue_id: venueId,
          pattern_type: patternType,
          shift_amount: shiftAmount,
          total_sessions: totalSessions,
          is_generated: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Sort learners by admission number
      const sortedByAdmission = [...learners].sort((a, b) => {
        const an = parseInt(a.admission_number) || 0;
        const bn = parseInt(b.admission_number) || 0;
        return an - bn;
      });

      const sortedByName = [...learners].sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      );

      const assignments = [];

      for (let session = 1; session <= totalSessions; session++) {
        let seatingOrder;

        switch (patternType) {
          case "admission_number":
            seatingOrder = sortedByAdmission;
            break;
          case "reverse_admission":
            seatingOrder = session % 2 === 1 ? sortedByAdmission : [...sortedByAdmission].reverse();
            break;
          case "alphabetical":
            seatingOrder = sortedByName;
            break;
          case "random": {
            const shuffled = [...learners];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            seatingOrder = shuffled;
            break;
          }
          case "shift":
          default:
            seatingOrder = sortedByAdmission;
            break;
        }

        seatingOrder.forEach((learner, index) => {
          let deskNumber;
          if (patternType === "shift") {
            deskNumber = ((index + (session - 1) * shiftAmount) % totalDesks) + 1;
          } else {
            deskNumber = (index % totalDesks) + 1;
          }

          assignments.push({
            seating_plan_id: newPlan.id,
            learner_id: learner.id,
            desk_number: deskNumber,
            session_number: session,
          });
        });
      }

      const batchSize = 500;
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from("exam_seat_assignments")
          .insert(batch);
        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ["seating-plans-all"] });
      toast({ title: "Seating plan generated", description: `${assignments.length} seat assignments across ${totalSessions} session(s)` });
    } catch (e) {
      toast({ title: "Error generating plan", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(prev => ({ ...prev, [venueId]: false }));
    }
  };

  const getClassColor = (index: number) => {
    const colors = [
      "bg-blue-100 border-blue-300 text-blue-800",
      "bg-green-100 border-green-300 text-green-800",
      "bg-amber-100 border-amber-300 text-amber-800",
      "bg-purple-100 border-purple-300 text-purple-800",
      "bg-pink-100 border-pink-300 text-pink-800",
      "bg-cyan-100 border-cyan-300 text-cyan-800",
      "bg-orange-100 border-orange-300 text-orange-800",
      "bg-teal-100 border-teal-300 text-teal-800",
    ];
    return colors[index % colors.length];
  };

  // Build a class color map per venue
  const buildClassColorMap = (classIds: string[]) => {
    const map: Record<string, string> = {};
    classIds.forEach((id, idx) => {
      map[id] = getClassColor(idx);
    });
    return map;
  };

  // Fetch class names map
  const classNames: Record<string, string> = {};
  classes.forEach(c => { classNames[c.id] = c.name; });

  return (
    <DashboardLayout title="Seating Plan Management" subtitle="Configure venues, assign classes, and generate exam seating plans">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-nowrap">Exam Series</Label>
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="All series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All series</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.academic_year} Term {s.term})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-sm">
            {venues.length} venue{venues.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {venues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No exam venues found.</p>
              <p className="text-sm text-muted-foreground">Go to Exams & Grading to create venues for timetable slots.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {venues.map((venue) => {
              const venuePlan = plans.find(p => p.exam_venue_id === venue.id);
              const isGenerating = generating[venue.id];
              const isExpanded = expandedVenue === venue.id;

              return (
                <Card key={venue.id} className={venuePlan && isExpanded ? "border-green-300" : ""}>
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedVenue(isExpanded ? null : venue.id)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {venue.venue_name}
                          {venuePlan && <Badge className="bg-green-100 text-green-800 border-green-300">Plan Generated</Badge>}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">{VENUE_TYPES[venue.venue_type] || venue.venue_type}</Badge>
                          </span>
                          {venue.hosted_class && (
                            <span className="flex items-center gap-1 text-xs">
                              <GraduationCap className="h-3 w-3" />
                              Hosts: {venue.hosted_class.name}
                            </span>
                          )}
                          {venue.timetable && (
                            <>
                              <span className="flex items-center gap-1 text-xs">
                                <Calendar className="h-3 w-3" />
                                {venue.timetable.exam_date}
                              </span>
                              <span className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {venue.timetable.start_time?.slice(0, 5)} - {venue.timetable.end_time?.slice(0, 5)}
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setExpandedVenue(isExpanded ? null : venue.id); }}
                      >
                        {isExpanded ? "Collapse" : "Configure"}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-2">
                      {/* Desk Count */}
                      <div className="flex items-center gap-3">
                        <Label className="text-nowrap">Number of Desks</Label>
                        {editingDeskCount[venue.id] ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              className="w-24 h-8"
                              value={deskCountEdit[venue.id] ?? venue.capacity}
                              onChange={(e) => setDeskCountEdit(prev => ({ ...prev, [venue.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => {
                                const count = parseInt(deskCountEdit[venue.id]);
                                if (count > 0) {
                                  updateDeskCount.mutate({ venueId: venue.id, deskCount: count });
                                }
                                setEditingDeskCount(prev => ({ ...prev, [venue.id]: false }));
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              {venue.capacity} desk{venue.capacity !== 1 ? "s" : ""}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() => {
                                setDeskCountEdit(prev => ({ ...prev, [venue.id]: String(venue.capacity) }));
                                setEditingDeskCount(prev => ({ ...prev, [venue.id]: true }));
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Class Selection */}
                      <div>
                        <Label className="mb-1.5 block">Select Classes to Seat</Label>
                        <div className="flex flex-wrap gap-2">
                          {classes.map((cls) => {
                            const selected = selectedClassesMap[venue.id]?.includes(cls.id);
                            return (
                              <Badge
                                key={cls.id}
                                variant={selected ? "default" : "outline"}
                                className={`cursor-pointer text-xs px-3 py-1.5 ${selected ? "" : "hover:bg-muted"}`}
                                onClick={() => {
                                  setSelectedClassesMap(prev => {
                                    const current = prev[venue.id] || [];
                                    const next = selected
                                      ? current.filter(id => id !== cls.id)
                                      : [...current, cls.id];
                                    return { ...prev, [venue.id]: next };
                                  });
                                }}
                              >
                                {cls.name}
                                {selected && <CheckCircle2 className="h-3 w-3 ml-1" />}
                              </Badge>
                            );
                          })}
                        </div>
                        {(!selectedClassesMap[venue.id] || selectedClassesMap[venue.id].length === 0) && (
                          <p className="text-xs text-muted-foreground mt-1">Click classes above to select them for seating</p>
                        )}
                      </div>

                      {/* Pattern Configuration */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Pattern</Label>
                          <Select
                            value={patternMap[venue.id] || "shift"}
                            onValueChange={(v) => setPatternMap(prev => ({ ...prev, [venue.id]: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shift">Shift</SelectItem>
                              <SelectItem value="admission_number">Admission Number</SelectItem>
                              <SelectItem value="reverse_admission">Reverse Admission</SelectItem>
                              <SelectItem value="alphabetical">Alphabetical</SelectItem>
                              <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Shift Amount</Label>
                          <Input
                            type="number" min={1}
                            value={shiftMap[venue.id] || 1}
                            onChange={(e) => setShiftMap(prev => ({ ...prev, [venue.id]: Number(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <Label>Sessions</Label>
                          <Input
                            type="number" min={1} max={10}
                            value={sessionMap[venue.id] || 2}
                            onChange={(e) => setSessionMap(prev => ({ ...prev, [venue.id]: Number(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patternMap[venue.id] === "shift" && "Learners shift desks by the specified amount each session."}
                        {patternMap[venue.id] === "admission_number" && "Learners sit at desks matching their admission number order."}
                        {patternMap[venue.id] === "reverse_admission" && "Ascending order alternates with descending between sessions."}
                        {patternMap[venue.id] === "alphabetical" && "Seated alphabetically by full name."}
                        {patternMap[venue.id] === "random" && "Random desk assignment each session."}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          className="gap-2"
                          disabled={isGenerating}
                          onClick={() => generatePlan(venue.id)}
                        >
                          {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                          <RefreshCw className="h-4 w-4" />
                          {venuePlan ? "Regenerate Plan" : "Generate Plan"}
                        </Button>
                        {venuePlan && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive"
                            onClick={() => deletePlan.mutate(venuePlan.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete Plan
                          </Button>
                        )}
                      </div>

                      {/* Seating Chart */}
                      {venuePlan && <SeatingChart plan={venuePlan} venueId={venue.id} classNames={classNames} />}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SeatingChart({ plan, venueId, classNames }: { plan: any; venueId: string; classNames: Record<string, string> }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ["seating-assignments", plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_seat_assignments")
        .select("*, learner:learners(id, full_name, admission_number, class_id)")
        .eq("seating_plan_id", plan.id)
        .order("session_number")
        .order("desk_number");
      if (error) throw error;
      return data;
    },
    enabled: !!plan.id,
  });

  const groupedBySession: Record<number, typeof assignments> = {};
  for (const a of assignments) {
    (groupedBySession[a.session_number] ??= []).push(a);
  }

  const classIds = [...new Set(assignments.map(a => a.learner?.class_id).filter(Boolean))];
  const classColorMap: Record<string, string> = {};
  const colors = [
    "bg-blue-100 border-blue-300 text-blue-800",
    "bg-green-100 border-green-300 text-green-800",
    "bg-amber-100 border-amber-300 text-amber-800",
    "bg-purple-100 border-purple-300 text-purple-800",
    "bg-pink-100 border-pink-300 text-pink-800",
    "bg-cyan-100 border-cyan-300 text-cyan-800",
    "bg-orange-100 border-orange-300 text-orange-800",
    "bg-teal-100 border-teal-300 text-teal-800",
  ];
  classIds.forEach((id, idx) => { classColorMap[id] = colors[idx % colors.length]; });

  const maxDesk = Math.max(...assignments.map(a => a.desk_number), 0);

  return (
    <div className="space-y-4 pt-2">
      <Separator />
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Table2 className="h-4 w-4" />
          Seating Chart
          <Badge variant="outline" className="text-xs">{plan.pattern_type}</Badge>
        </h4>
        <div className="flex items-center gap-2 text-xs">
          {classIds.map((id) => (
            <span key={id} className={`px-2 py-0.5 rounded border text-[10px] ${classColorMap[id] || ""}`}>
              {classNames[id] || id.slice(0, 8)}
            </span>
          ))}
        </div>
      </div>

      {Object.keys(groupedBySession).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No assignments yet. Generate the plan to see the seating chart.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBySession)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([session, seats]) => (
              <div key={session}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">Session {session}</Badge>
                  <span className="text-xs text-muted-foreground">{seats.length} learner{seats.length !== 1 ? "s" : ""} seated</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {seats.sort((a, b) => a.desk_number - b.desk_number).map((seat) => (
                    <div
                      key={seat.id}
                      className={`border rounded-lg p-2.5 text-center text-xs space-y-1 min-w-[100px] ${
                        classColorMap[seat.learner?.class_id] || "bg-card"
                      }`}
                    >
                      <div className="font-bold text-muted-foreground text-sm">#{seat.desk_number}</div>
                      <div className="font-medium truncate max-w-[90px]" title={seat.learner?.full_name}>
                        {seat.learner?.full_name?.split(" ").slice(0, 2).join(" ") || "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {seat.learner?.admission_number || ""}
                      </div>
                      {seat.learner?.class_id && (
                        <div className="text-[10px] font-medium truncate">
                          {classNames[seat.learner.class_id] || ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
