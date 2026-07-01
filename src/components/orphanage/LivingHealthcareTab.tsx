// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useOrphanLearners, useLivingHealthcare, useSaveLivingHealthcare } from "@/hooks/useOrphanage";
import { Activity, Plus, Search, Heart, Stethoscope } from "lucide-react";
import { format } from "date-fns";

export function LivingHealthcareTab() {
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState(null);
  const { data: orphans } = useOrphanLearners(search);
  const { data: records } = useLivingHealthcare(selectedLearner?.id);
  const saveRecord = useSaveLivingHealthcare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ learner_id: "", assessment_date: new Date().toISOString().split("T")[0], living_condition_score: 3, nutrition_status: "good", health_status: "", notes: "" });

  const openForm = (learner) => {
    setSelectedLearner(learner);
    setForm({ ...form, learner_id: learner.id });
    setOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4" /> Learners</CardTitle></CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto space-y-1">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
          {(orphans || []).map(o => (
            <div key={o.id} className={`p-2 rounded cursor-pointer text-sm ${selectedLearner?.id === o.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => setSelectedLearner(o)}>
              {o.full_name}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Living & Healthcare {selectedLearner ? `- ${selectedLearner.full_name}` : ""}</CardTitle>
          {selectedLearner && <Button size="sm" onClick={() => openForm(selectedLearner)}><Plus className="h-4 w-4" /> New Assessment</Button>}
        </CardHeader>
        <CardContent>
          {selectedLearner ? (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Living Condition</TableHead><TableHead>Nutrition</TableHead><TableHead>Health Status</TableHead><TableHead>Med Visits</TableHead><TableHead>Next Checkup</TableHead></TableRow></TableHeader>
              <TableBody>
                {(records || []).map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.assessment_date ? format(new Date(r.assessment_date), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>{r.living_condition_score ? `${r.living_condition_score}/5` : "—"}</TableCell>
                    <TableCell><Badge variant={r.nutrition_status === "poor" ? "destructive" : r.nutrition_status === "fair" ? "secondary" : "default"}>{r.nutrition_status || "—"}</Badge></TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{r.health_status || "—"}</TableCell>
                    <TableCell>{r.medical_visit_count}</TableCell>
                    <TableCell className="text-sm">{r.next_checkup_date ? format(new Date(r.next_checkup_date), "MMM d, yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
                {(!records || records.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No assessments yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          ) : <p className="text-muted-foreground text-center py-8">Select a learner</p>}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Living & Healthcare Assessment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Assessment Date</Label><Input type="date" value={form.assessment_date} onChange={e => setForm({...form, assessment_date: e.target.value})} /></div>
            <div><Label>Living Condition Score (1-5)</Label>
              <Select value={String(form.living_condition_score)} onValueChange={v => setForm({...form, living_condition_score: Number(v)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} - {["Poor","Below Avg","Average","Good","Excellent"][n-1]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nutrition Status</Label>
              <Select value={form.nutrition_status} onValueChange={v => setForm({...form, nutrition_status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Health Status / Notes</Label><Textarea value={form.health_status} onChange={e => setForm({...form, health_status: e.target.value})} /></div>
            <div><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <Button onClick={() => { saveRecord.mutate(form); setOpen(false); }} disabled={saveRecord.isPending}>Save Assessment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
