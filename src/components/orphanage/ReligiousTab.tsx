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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrphanLearners, useReligiousDevelopment, useSaveReligiousDevelopment } from "@/hooks/useOrphanage";
import { BookOpen, Plus, Search, Star } from "lucide-react";

export function ReligiousTab() {
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState(null);
  const { data: orphans } = useOrphanLearners(search);
  const { data: records } = useReligiousDevelopment(selectedLearner?.id);
  const save = useSaveReligiousDevelopment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ learner_id: "", term: "Term 1", academic_year: `${new Date().getFullYear()}`, quran_pages: 0, islamic_studies_score: null, salah_attendance_rate: null, tarbiyah_score: null, conduct_rating: 3, teacher_notes: "" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" /> Learners</CardTitle></CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto space-y-1">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
          {(orphans || []).map(o => (
            <div key={o.id} className={`p-2 rounded cursor-pointer text-sm ${selectedLearner?.id === o.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => { setSelectedLearner(o); }}>{o.full_name}</div>
          ))}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Religious Development {selectedLearner ? `- ${selectedLearner.full_name}` : ""}</CardTitle>
          {selectedLearner && <Button size="sm" onClick={() => { setForm({...form, learner_id: selectedLearner.id}); setOpen(true); }}><Plus className="h-4 w-4" /> Add Record</Button>}
        </CardHeader>
        <CardContent>
          {selectedLearner ? (
            <Table>
              <TableHeader><TableRow><TableHead>Term</TableHead><TableHead>Year</TableHead><TableHead>Quran Pages</TableHead><TableHead>Islamic Studies</TableHead><TableHead>Salah Attendance</TableHead><TableHead>Conduct</TableHead></TableRow></TableHeader>
              <TableBody>
                {(records || []).map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.term}</TableCell>
                    <TableCell>{r.academic_year}</TableCell>
                    <TableCell>{r.quran_pages}</TableCell>
                    <TableCell>{r.islamic_studies_score ? `${r.islamic_studies_score}%` : "—"}</TableCell>
                    <TableCell>{r.salah_attendance_rate ? `${r.salah_attendance_rate}%` : "—"}</TableCell>
                    <TableCell>{r.conduct_rating ? `${r.conduct_rating}/5` : "—"}</TableCell>
                  </TableRow>
                ))}
                {(!records || records.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No records yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          ) : <p className="text-muted-foreground text-center py-8">Select a learner</p>}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Religious Development Record</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm({...form, term: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label><Input value={form.academic_year} onChange={e => setForm({...form, academic_year: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quran Pages Memorized</Label><Input type="number" value={form.quran_pages} onChange={e => setForm({...form, quran_pages: Number(e.target.value)})} /></div>
              <div><Label>Islamic Studies Score (%)</Label><Input type="number" value={form.islamic_studies_score} onChange={e => setForm({...form, islamic_studies_score: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Salah Attendance (%)</Label><Input type="number" value={form.salah_attendance_rate} onChange={e => setForm({...form, salah_attendance_rate: Number(e.target.value)})} /></div>
              <div><Label>Tarbiyah Score (%)</Label><Input type="number" value={form.tarbiyah_score} onChange={e => setForm({...form, tarbiyah_score: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Conduct Rating</Label>
              <Select value={String(form.conduct_rating)} onValueChange={v => setForm({...form, conduct_rating: Number(v)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.teacher_notes} onChange={e => setForm({...form, teacher_notes: e.target.value})} /></div>
            <Button onClick={() => { save.mutate(form); setOpen(false); }} disabled={save.isPending}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
