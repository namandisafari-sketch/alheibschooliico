// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Table2, RefreshCw, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExamSeatingPlanProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetableId: string;
}

export const ExamSeatingPlan = ({ open, onOpenChange, timetableId }: ExamSeatingPlanProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: venues = [] } = useQuery({
    queryKey: ["exam-venues", timetableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_venues")
        .select("*, hosted_class:classes!exam_venues_hosted_class_id_fkey(id, name)")
        .eq("exam_timetable_id", timetableId)
        .order("venue_name");
      if (error) throw error;
      return data;
    },
    enabled: !!timetableId,
  });

  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [patternType, setPatternType] = useState("shift");
  const [shiftAmount, setShiftAmount] = useState(1);
  const [totalSessions, setTotalSessions] = useState(2);
  const [generating, setGenerating] = useState(false);

  const { data: plan } = useQuery({
    queryKey: ["exam-seating-plan", selectedVenueId],
    queryFn: async () => {
      if (!selectedVenueId) return null;
      const { data, error } = await supabase
        .from("exam_seating_plans")
        .select("*")
        .eq("exam_venue_id", selectedVenueId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVenueId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["exam-seat-assignments", plan?.id],
    queryFn: async () => {
      if (!plan?.id) return [];
      const { data, error } = await supabase
        .from("exam_seat_assignments")
        .select("*, learner:learners(id, full_name, admission_number)")
        .eq("seating_plan_id", plan.id)
        .order("session_number")
        .order("desk_number");
      if (error) throw error;
      return data;
    },
    enabled: !!plan?.id,
  });

  const generatePlan = async () => {
    const venue = venues.find(v => v.id === selectedVenueId);
    if (!venue) return;

    const hostedClassId = venue.hosted_class_id;
    if (!hostedClassId) {
      toast({ title: "No hosted class", description: "Set a hosted class on the venue first", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data: learners, error: learnersError } = await supabase
        .from("learners")
        .select("id, full_name, admission_number")
        .eq("class_id", hostedClassId)
        .eq("status", "active")
        .order("admission_number");

      if (learnersError) throw learnersError;
      if (!learners || learners.length === 0) {
        toast({ title: "No learners", description: "No active learners found in the hosted class", variant: "destructive" });
        setGenerating(false);
        return;
      }

      const totalDesks = Math.min(venue.capacity, learners.length);

      // Delete existing plan + assignments if any
      if (plan?.id) {
        await supabase.from("exam_seat_assignments").delete().eq("seating_plan_id", plan.id);
        await supabase.from("exam_seating_plans").delete().eq("id", plan.id);
      }

      // Create new seating plan
      const { data: newPlan, error: planError } = await supabase
        .from("exam_seating_plans")
        .insert({
          exam_venue_id: selectedVenueId,
          pattern_type: patternType,
          shift_amount: shiftAmount,
          total_sessions: totalSessions,
          is_generated: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Generate seat assignments
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

      // Batch insert assignments
      const { error: insertError } = await supabase
        .from("exam_seat_assignments")
        .insert(assignments);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["exam-seating-plan"] });
      queryClient.invalidateQueries({ queryKey: ["exam-seat-assignments"] });
      toast({ title: "Seating plan generated", description: `${assignments.length} seat assignments created` });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const selectedVenue = venues.find(v => v.id === selectedVenueId);
  const groupedBySession: Record<number, typeof assignments> = {};
  for (const a of assignments) {
    (groupedBySession[a.session_number] ??= []).push(a);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exam Seating Plans</DialogTitle>
          <DialogDescription>Auto-generate seating patterns for each venue.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {venues.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg border-dashed">
              No venues assigned. Add venues first.
            </div>
          ) : (
            <>
              <div>
                <Label>Select Venue</Label>
                <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.venue_name} {v.hosted_class ? `(Hosts: ${v.hosted_class.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVenue && (
                <>
                  {!selectedVenue.hosted_class_id && (
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                      This venue has no hosted class set. Learners cannot be seated until a hosted class is assigned.
                    </div>
                  )}

                  {plan?.is_generated && (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">
                      <Table2 className="h-4 w-4" />
                      Plan generated ({plan.pattern_type}) - {assignments.length} seat assignments
                      <Badge variant="outline" className="ml-auto text-xs">{plan.total_sessions} session{plan.total_sessions > 1 ? "s" : ""}</Badge>
                    </div>
                  )}

                  <div className="border rounded-lg p-4 space-y-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Generate New Plan</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Pattern</Label>
                        <Select value={patternType} onValueChange={setPatternType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Input type="number" min={1} value={shiftAmount} onChange={(e) => setShiftAmount(Number(e.target.value) || 1)} />
                      </div>
                      <div>
                        <Label>Sessions</Label>
                        <Input type="number" min={1} max={10} value={totalSessions} onChange={(e) => setTotalSessions(Number(e.target.value) || 1)} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {patternType === "shift" && "Learners shift desks by the specified amount each session."}
                      {patternType === "admission_number" && "Learners sit at desks matching their admission number order."}
                      {patternType === "reverse_admission" && "Ascending order alternates with descending order between sessions."}
                      {patternType === "alphabetical" && "Seated alphabetically by full name."}
                      {patternType === "random" && "Random desk assignment each session."}
                    </p>
                    <Button
                      className="gap-2"
                      disabled={!selectedVenue.hosted_class_id || generating}
                      onClick={generatePlan}
                    >
                      {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                      <RefreshCw className="h-4 w-4" /> Generate Plan
                    </Button>
                  </div>

                  {/* Seating grid display */}
                  {Object.keys(groupedBySession).length > 0 && (
                    <div className="space-y-6">
                      {Object.entries(groupedBySession)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([session, seats]) => (
                          <div key={session}>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Badge>Session {session}</Badge>
                              <span className="text-xs text-muted-foreground">{seats.length} learners seated</span>
                            </h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                              {seats.sort((a, b) => a.desk_number - b.desk_number).map((seat) => (
                                <div
                                  key={seat.id}
                                  className="border rounded-lg p-2 text-center text-xs space-y-1"
                                >
                                  <div className="font-bold text-muted-foreground">#{seat.desk_number}</div>
                                  <div className="font-medium truncate" title={seat.learner?.full_name}>
                                    {seat.learner?.full_name?.split(" ").slice(0, 2).join(" ") || "—"}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {seat.learner?.admission_number || ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
