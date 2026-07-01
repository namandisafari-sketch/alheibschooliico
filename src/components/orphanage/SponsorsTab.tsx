// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSponsors, useSaveSponsor, useSponsorships, useSaveSponsorship, useSponsorshipPayments, useSavePayment } from "@/hooks/useOrphanage";
import { format } from "date-fns";
import { Heart, Plus, Search, Phone, Mail, MapPin, DollarSign } from "lucide-react";

export function SponsorsTab() {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState("sponsors");
  const { data: sponsors } = useSponsors(search);
  const { data: sponsorships } = useSponsorships();
  const saveSponsor = useSaveSponsor();
  const saveSponsorship = useSaveSponsorship();

  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorshipOpen, setSponsorshipOpen] = useState(false);
  const [sf, setSf] = useState({ full_name: "", email: "", phone: "", sponsor_type: "individual", organization: "", notes: "" });
  const [spf, setSpf] = useState({ sponsor_id: "", learner_id: "", type: "full", monthly_amount: 0, start_date: "", status: "active" });

  return (
    <Tabs value={subTab} onValueChange={setSubTab}>
      <TabsList>
        <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
        <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
      </TabsList>

      <TabsContent value="sponsors">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" /> Sponsors</CardTitle>
            <Dialog open={sponsorOpen} onOpenChange={setSponsorOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Add Sponsor</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Sponsor</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Full Name *</Label><Input value={sf.full_name} onChange={e => setSf({...sf, full_name: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Email</Label><Input value={sf.email} onChange={e => setSf({...sf, email: e.target.value})} /></div>
                    <div><Label>Phone</Label><Input value={sf.phone} onChange={e => setSf({...sf, phone: e.target.value})} /></div>
                  </div>
                  <div><Label>Type</Label>
                    <Select value={sf.sponsor_type} onValueChange={v => setSf({...sf, sponsor_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="ngo">NGO</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="foundation">Foundation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Organization</Label><Input value={sf.organization} onChange={e => setSf({...sf, organization: e.target.value})} /></div>
                  <div><Label>Notes</Label><Textarea value={sf.notes} onChange={e => setSf({...sf, notes: e.target.value})} /></div>
                  <Button onClick={() => { saveSponsor.mutate(sf); setSponsorOpen(false); setSf({ full_name: "", email: "", phone: "", sponsor_type: "individual", organization: "", notes: "" }); }} disabled={!sf.full_name || saveSponsor.isPending}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4"><Input placeholder="Search sponsors..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" /></div>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Org</TableHead></TableRow></TableHeader>
              <TableBody>
                {(sponsors || []).map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {s.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>}
                        {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.sponsor_type}</Badge></TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell className="text-sm">{s.organization || "—"}</TableCell>
                  </TableRow>
                ))}
                {(!sponsors || sponsors.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sponsors yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sponsorships">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" /> Sponsorships</CardTitle>
            <Dialog open={sponsorshipOpen} onOpenChange={setSponsorshipOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> New Sponsorship</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Sponsorship</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Sponsor ID</Label><Input value={spf.sponsor_id} onChange={e => setSpf({...spf, sponsor_id: e.target.value})} placeholder="Enter sponsor UUID" /></div>
                  <div><Label>Learner ID</Label><Input value={spf.learner_id} onChange={e => setSpf({...spf, learner_id: e.target.value})} placeholder="Enter learner UUID" /></div>
                  <div><Label>Type</Label>
                    <Select value={spf.type} onValueChange={v => setSpf({...spf, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Monthly Amount</Label><Input type="number" value={spf.monthly_amount} onChange={e => setSpf({...spf, monthly_amount: Number(e.target.value)})} /></div>
                    <div><Label>Start Date</Label><Input type="date" value={spf.start_date} onChange={e => setSpf({...spf, start_date: e.target.value})} /></div>
                  </div>
                  <Button onClick={() => { saveSponsorship.mutate(spf); setSponsorshipOpen(false); setSpf({ sponsor_id: "", learner_id: "", type: "full", monthly_amount: 0, start_date: "", status: "active" }); }} disabled={!spf.sponsor_id || !spf.learner_id || saveSponsorship.isPending}>Create Sponsorship</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Sponsor</TableHead><TableHead>Learner</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Start</TableHead></TableRow></TableHeader>
              <TableBody>
                {(sponsorships || []).map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.sponsor?.full_name || s.sponsor_id.substring(0, 8)}</TableCell>
                    <TableCell>{s.learner?.full_name || s.learner_id.substring(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                    <TableCell>{s.currency} {s.monthly_amount?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell className="text-sm">{s.start_date ? format(new Date(s.start_date), "MMM d, yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
                {(!sponsorships || sponsorships.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sponsorships yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
