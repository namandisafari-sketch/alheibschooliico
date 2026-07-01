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
import { useSponsorships, useSponsorReports, useSaveSponsorReport } from "@/hooks/useOrphanage";
import { format } from "date-fns";
import { FileText, Plus, Search, Send, Eye } from "lucide-react";

export function SponsorReportsTab() {
  const [search, setSearch] = useState("");
  const [selectedSponsorship, setSelectedSponsorship] = useState(null);
  const { data: sponsorships } = useSponsorships({ status: "active" });
  const { data: reports } = useSponsorReports(selectedSponsorship?.id);
  const saveReport = useSaveSponsorReport();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sponsorship_id: "", report_type: "monthly", title: "", summary: "", academic_progress: "", health_update: "", religious_progress: "", social_activities: "" });

  const filteredSponsorships = (sponsorships || []).filter(s =>
    s.sponsor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.learner?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Active Sponsorships</CardTitle></CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto space-y-1">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
          {filteredSponsorships.map(s => (
            <div key={s.id} className={`p-2 rounded cursor-pointer text-sm ${selectedSponsorship?.id === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => setSelectedSponsorship(s)}>
              <p className="font-medium">{s.sponsor?.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">→ {s.learner?.full_name || "—"}</p>
            </div>
          ))}
          {filteredSponsorships.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No active sponsorships</p>}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Sponsor Reports {selectedSponsorship ? `- ${selectedSponsorship.sponsor?.full_name}` : ""}</CardTitle>
          {selectedSponsorship && <Button size="sm" onClick={() => { setForm({...form, sponsorship_id: selectedSponsorship.id, title: `Report - ${selectedSponsorship.sponsor?.full_name}`}); setOpen(true); }}><Plus className="h-4 w-4" /> New Report</Button>}
        </CardHeader>
        <CardContent>
          {selectedSponsorship ? (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {(reports || []).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><Badge variant="outline">{r.report_type}</Badge></TableCell>
                    <TableCell className="text-xs">{r.period_start?.substring(0, 10)} to {r.period_end?.substring(0, 10)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "sent" ? "default" : r.status === "final" ? "secondary" : "outline"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.report_date ? format(new Date(r.report_date), "MMM d, yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
                {(!reports || reports.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No reports yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          ) : <p className="text-muted-foreground text-center py-8">Select a sponsorship to view reports</p>}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Sponsor Report</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Report Type</Label>
                <Select value={form.report_type} onValueChange={v => setForm({...form, report_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            </div>
            <div><Label>Summary</Label><Textarea value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} /></div>
            <div><Label>Academic Progress</Label><Textarea value={form.academic_progress} onChange={e => setForm({...form, academic_progress: e.target.value})} /></div>
            <div><Label>Health Update</Label><Textarea value={form.health_update} onChange={e => setForm({...form, health_update: e.target.value})} /></div>
            <div><Label>Religious Progress</Label><Textarea value={form.religious_progress} onChange={e => setForm({...form, religious_progress: e.target.value})} /></div>
            <div><Label>Social Activities</Label><Textarea value={form.social_activities} onChange={e => setForm({...form, social_activities: e.target.value})} /></div>
            <Button onClick={() => { saveReport.mutate({...form, report_date: new Date().toISOString().split("T")[0], period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0], period_end: new Date().toISOString().split("T")[0], status: "draft"}); setOpen(false); }} disabled={!form.title || saveReport.isPending}>Create Report (Draft)</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
