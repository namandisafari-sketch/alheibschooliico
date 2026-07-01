// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrphanLearners, useEducationalSupport, useSaveEducationalSupport } from "@/hooks/useOrphanage";
import { GraduationCap, Plus, Search, BookOpen } from "lucide-react";

export function EducationTab() {
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState(null);
  const { data: orphans } = useOrphanLearners(search);
  const { data: records } = useEducationalSupport(selectedLearner?.id);
  const saveRecord = useSaveEducationalSupport();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ learner_id: "", term: "Term 1", academic_year: `${new Date().getFullYear()}`, school_fees_paid: 0, school_fees_balance: 0, supplies_provided: "", performance_score: null, attendance_rate: null, teacher_comments: "" });

  const openForm = (learner) => {
    setSelectedLearner(learner);
    setForm({ ...form, learner_id: learner.id });
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input placeholder="Search orphans..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Learners</CardTitle></CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto space-y-1">
            {(orphans || []).map(o => (
              <div key={o.id} className={`p-2 rounded cursor-pointer text-sm flex justify-between items-center ${selectedLearner?.id === o.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => setSelectedLearner(o)}>
                <span>{o.full_name}</span>
                <Badge variant="outline" className="text-xs">{o.class?.name || "—"}</Badge>
              </div>
            ))}
            {(!orphans || orphans.length === 0) && <p className="text-muted-foreground text-sm py-4 text-center">No orphans found</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Educational Records {selectedLearner ? `- ${selectedLearner.full_name}` : ""}</CardTitle>
            {selectedLearner && <Button size="sm" onClick={() => openForm(selectedLearner)}><Plus className="h-4 w-4" /> Add Record</Button>}
          </CardHeader>
          <CardContent>
            {selectedLearner ? (
              <Table>
                <TableHeader><TableRow><TableHead>Term</TableHead><TableHead>Year</TableHead><TableHead>Fees Paid</TableHead><TableHead>Balance</TableHead><TableHead>Performance</TableHead><TableHead>Attendance</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(records || []).map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.term}</TableCell>
                      <TableCell>{r.academic_year}</TableCell>
                      <TableCell>{r.school_fees_paid?.toLocaleString()}</TableCell>
                      <TableCell><span className={r.school_fees_balance > 0 ? "text-red-600" : ""}>{r.school_fees_balance?.toLocaleString()}</span></TableCell>
                      <TableCell>{r.performance_score ? `${r.performance_score}%` : "—"}</TableCell>
                      <TableCell>{r.attendance_rate ? `${r.attendance_rate}%` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(!records || records.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No records yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground text-center py-8">Select a learner from the list</p>}
          </CardContent>
        </Card>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Educational Support Record</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm({...form, term: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Academic Year</Label><Input value={form.academic_year} onChange={e => setForm({...form, academic_year: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fees Paid</Label><Input type="number" value={form.school_fees_paid} onChange={e => setForm({...form, school_fees_paid: Number(e.target.value)})} /></div>
              <div><Label>Fees Balance</Label><Input type="number" value={form.school_fees_balance} onChange={e => setForm({...form, school_fees_balance: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Supplies Provided</Label><Textarea value={form.supplies_provided} onChange={e => setForm({...form, supplies_provided: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Performance Score (%)</Label><Input type="number" value={form.performance_score} onChange={e => setForm({...form, performance_score: Number(e.target.value)})} /></div>
              <div><Label>Attendance Rate (%)</Label><Input type="number" value={form.attendance_rate} onChange={e => setForm({...form, attendance_rate: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Comments</Label><Textarea value={form.teacher_comments} onChange={e => setForm({...form, teacher_comments: e.target.value})} /></div>
            <Button onClick={() => { saveRecord.mutate(form); setEditOpen(false); }} disabled={saveRecord.isPending}>Save Record</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
