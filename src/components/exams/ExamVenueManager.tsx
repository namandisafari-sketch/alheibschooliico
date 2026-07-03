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
import { Plus, Trash2, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExamVenueManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetableId: string;
}

export const ExamVenueManager = ({ open, onOpenChange, timetableId }: ExamVenueManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["exam-venues", timetableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_venues")
        .select("*, infrastructure:school_infrastructure(id, name), class:classes!exam_venues_class_id_fkey(id, name), hosted_class:classes!exam_venues_hosted_class_id_fkey(id, name)")
        .eq("exam_timetable_id", timetableId)
        .order("venue_name");
      if (error) throw error;
      return data;
    },
    enabled: !!timetableId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["exam-rooms-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_infrastructure")
        .select("id, name, sitting_capacity")
        .in("asset_type", ["classroom", "exam_hall", "lab", "library"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["exam-classes-venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, capacity")
        .order("level");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, level")
        .order("level");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [newVenue, setNewVenue] = useState({ venue_name: "", venue_type: "classroom", infrastructure_id: "", class_id: "", capacity: "", hosted_class_id: "" });

  const addVenue = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exam_venues").insert({
        exam_timetable_id: timetableId,
        venue_name: newVenue.venue_name,
        venue_type: newVenue.venue_type,
        infrastructure_id: newVenue.infrastructure_id || null,
        class_id: newVenue.class_id || null,
        hosted_class_id: newVenue.hosted_class_id || null,
        capacity: Number(newVenue.capacity) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-venues"] });
      setNewVenue({ venue_name: "", venue_type: "classroom", infrastructure_id: "", class_id: "", capacity: "", hosted_class_id: "" });
      toast({ title: "Venue added" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteVenue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_venues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-venues"] });
      toast({ title: "Venue removed" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const selectedRoom = rooms.find(r => r.id === newVenue.infrastructure_id);
  const selectedClass = classes.find(c => c.id === newVenue.class_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exam Venues</DialogTitle>
          <DialogDescription>Assign classrooms or rooms as venues for this exam slot.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading venues...</div>
        ) : (
          <div className="space-y-4">
            {venues.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg border-dashed">
                No venues assigned yet. Add one below.
              </div>
            )}
            {venues.map((venue) => (
              <div key={venue.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{venue.venue_name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5">{venue.venue_type}</Badge>
                      <span className="text-xs text-muted-foreground">Cap: {venue.capacity}</span>
                      {venue.infrastructure && <span className="text-xs text-muted-foreground">| {venue.infrastructure.name}</span>}
                      {venue.class && <span className="text-xs text-muted-foreground">| {venue.class.name}</span>}
                    </div>
                    {venue.hosted_class && (
                      <p className="text-xs text-muted-foreground mt-0.5">Hosts: <span className="font-medium">{venue.hosted_class.name}</span></p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteVenue.mutate(venue.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Add New Venue</p>
              <div>
                <Label>Venue Name</Label>
                <Input
                  value={newVenue.venue_name}
                  onChange={(e) => setNewVenue(p => ({ ...p, venue_name: e.target.value }))}
                  placeholder="e.g. Room 101, P7 Classroom"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={newVenue.venue_type} onValueChange={(v) => setNewVenue(p => ({ ...p, venue_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom">Classroom</SelectItem>
                      <SelectItem value="exam_hall">Exam Hall</SelectItem>
                      <SelectItem value="lab">Laboratory</SelectItem>
                      <SelectItem value="library">Library</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={newVenue.capacity} onChange={(e) => setNewVenue(p => ({ ...p, capacity: e.target.value }))} placeholder="40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Link Room (optional)</Label>
                  <Select value={newVenue.infrastructure_id} onValueChange={(v) => setNewVenue(p => ({ ...p, infrastructure_id: v, class_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({r.sitting_capacity})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Link Class (optional)</Label>
                  <Select value={newVenue.class_id} onValueChange={(v) => setNewVenue(p => ({ ...p, class_id: v, infrastructure_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.capacity})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Hosted Class <span className="text-destructive">*</span></Label>
                <Select value={newVenue.hosted_class_id} onValueChange={(v) => setNewVenue(p => ({ ...p, hosted_class_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Which class sits here?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {allClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} (P{c.level})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedRoom && !newVenue.venue_name && (
                <p className="text-xs text-muted-foreground">Venue name will default to "{selectedRoom.name}"</p>
              )}
              {selectedClass && !newVenue.venue_name && (
                <p className="text-xs text-muted-foreground">Venue name will default to "{selectedClass.name}"</p>
              )}
              <Button
                className="w-full gap-2"
                size="sm"
                disabled={!newVenue.venue_name && !selectedRoom && !selectedClass || addVenue.isPending}
                onClick={() => {
                  const name = newVenue.venue_name || selectedRoom?.name || selectedClass?.name || "";
                  if (!name) return;
                  addVenue.mutate();
                }}
              >
                {addVenue.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Plus className="h-4 w-4" /> Add Venue
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
