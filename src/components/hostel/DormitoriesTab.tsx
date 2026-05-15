import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Bed, Plus, Users, Trash2, UserPlus, UserMinus } from "lucide-react";
import { useDormitories, useDormitoryResidents, type Dormitory } from "@/hooks/useHostel";
import { useLearners } from "@/hooks/useLearners";

const DormitoryCard = ({ dorm, onSelect, onDelete, residentsCount }: { dorm: Dormitory; onSelect: () => void; onDelete: () => void; residentsCount: number }) => {
  const occupancy = Math.round((residentsCount / dorm.capacity) * 100);
  const genderColor = dorm.gender === "boys" ? "bg-blue-500/10 text-blue-700" : dorm.gender === "girls" ? "bg-pink-500/10 text-pink-700" : "bg-muted";
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition cursor-pointer" onClick={onSelect}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-lg ${genderColor}`}><Bed className="h-5 w-5" /></div>
          <Badge variant="outline" className="capitalize">{dorm.gender}</Badge>
        </div>
        <h3 className="font-bold text-lg">{dorm.name}</h3>
        {dorm.location && <p className="text-xs text-muted-foreground mb-2">{dorm.location}</p>}
        <div className="flex justify-between items-center mt-3">
          <div>
            <p className="text-2xl font-bold">{residentsCount}<span className="text-sm font-normal text-muted-foreground">/{dorm.capacity}</span></p>
            <p className="text-xs text-muted-foreground">{occupancy}% full</p>
          </div>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AddDormDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", gender: "boys", capacity: 30, location: "", notes: "" });
  const { upsert } = useDormitories();
  const submit = () => {
    upsert.mutate(form as any, { onSuccess: () => { setOpen(false); setForm({ name: "", gender: "boys", capacity: 30, location: "", notes: "" }); } });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Dormitory</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Dormitory</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Salaam House" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Block / wing" /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name || upsert.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AssignResidentDialog = ({ dormitoryId, dormGender }: { dormitoryId: string; dormGender: string }) => {
  const [open, setOpen] = useState(false);
  const [learnerId, setLearnerId] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const { assign } = useDormitoryResidents();
  const learners = useLearners();
  const filtered = (learners.data || []).filter((l: any) => dormGender === "mixed" || (dormGender === "boys" ? l.gender === "male" : l.gender === "female"));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-4 w-4 mr-2" /> Assign Learner</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Learner to Dormitory</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Learner *</Label>
            <Select value={learnerId} onValueChange={setLearnerId}>
              <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {filtered.map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.full_name} {l.admission_number ? `(${l.admission_number})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Bed Number</Label><Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} placeholder="e.g. B12" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!learnerId || assign.isPending} onClick={() => assign.mutate({ dormitory_id: dormitoryId, learner_id: learnerId, bed_number: bedNumber || undefined }, { onSuccess: () => { setOpen(false); setLearnerId(""); setBedNumber(""); } })}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const DormitoriesTab = () => {
  const { list, remove } = useDormitories();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const allResidents = useDormitoryResidents();
  const selectedResidents = useDormitoryResidents(selectedId || undefined);
  const selected = list.data?.find((d) => d.id === selectedId);
  const countFor = (id: string) => (allResidents.list.data || []).filter((r) => r.dormitory_id === id).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Dormitories</h2>
          <p className="text-sm text-muted-foreground">{list.data?.length || 0} dormitories • {allResidents.list.data?.length || 0} residents</p>
        </div>
        <AddDormDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.data?.map((d) => (
          <DormitoryCard key={d.id} dorm={d} residentsCount={countFor(d.id)} onSelect={() => setSelectedId(d.id)} onDelete={() => { if (confirm(`Delete ${d.name}?`)) remove.mutate(d.id); }} />
        ))}
        {list.data?.length === 0 && (
          <Card className="col-span-full border-dashed"><CardContent className="py-10 text-center text-muted-foreground">No dormitories yet. Click "Add Dormitory" to start.</CardContent></Card>
        )}
      </div>

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bed className="h-5 w-5" /> {selected?.name} — Residents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="capitalize">{selected?.gender} • {selectedResidents.list.data?.length || 0}/{selected?.capacity}</Badge>
              {selectedId && <AssignResidentDialog dormitoryId={selectedId} dormGender={selected?.gender || "mixed"} />}
            </div>
            <div className="space-y-2">
              {(selectedResidents.list.data || []).map((r) => (
                <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{r.learner?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.learner?.admission_number || "—"} {r.bed_number && `• Bed ${r.bed_number}`} • Since {r.assigned_date}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Release resident?")) selectedResidents.release.mutate(r.id); }}>
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {selectedResidents.list.data?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">No residents assigned yet.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
