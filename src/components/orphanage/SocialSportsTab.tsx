// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSocialSports, useSaveSocialSport } from "@/hooks/useOrphanage";
import { format } from "date-fns";
import { Users, Plus, Search, Trophy, Filter } from "lucide-react";

const activityTypes = [
  { value: "sports", label: "Sports", color: "text-blue-600" },
  { value: "cultural", label: "Cultural", color: "text-purple-600" },
  { value: "club", label: "Club", color: "text-green-600" },
  { value: "outreach", label: "Outreach", color: "text-orange-600" },
  { value: "competition", label: "Competition", color: "text-rose-600" },
  { value: "recreation", label: "Recreation", color: "text-teal-600" },
  { value: "life_skills", label: "Life Skills", color: "text-indigo-600" },
  { value: "community_service", label: "Community Service", color: "text-cyan-600" },
];

export function SocialSportsTab() {
  const [filter, setFilter] = useState("");
  const { data: activities } = useSocialSports();
  const save = useSaveSocialSport();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ learner_id: "", activity_type: "sports", activity_name: "", activity_date: new Date().toISOString().split("T")[0], participation_level: "good", notes: "" });
  const [search, setSearch] = useState("");

  const filtered = (activities || []).filter(a =>
    (!filter || a.activity_type === filter) &&
    (!search || a.activity_name?.toLowerCase().includes(search.toLowerCase()) || a.learner?.full_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Social & Sports Activities</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Record Activity</Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <div className="flex gap-1 flex-wrap">
              <Button key="all" variant={!filter ? "default" : "outline"} size="sm" onClick={() => setFilter("")}>All</Button>
              {activityTypes.map(t => (
                <Button key={t.value} variant={filter === t.value ? "default" : "outline"} size="sm" onClick={() => setFilter(t.value)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(a => {
              const typeInfo = activityTypes.find(t => t.value === a.activity_type);
              return (
                <div key={a.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={typeInfo?.color}>{typeInfo?.label || a.activity_type}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(a.activity_date), "MMM d, yyyy")}</span>
                  </div>
                  <p className="font-medium text-sm">{a.activity_name}</p>
                  <p className="text-xs text-muted-foreground">{a.learner?.full_name || a.learner_id?.substring(0, 8)}</p>
                  {a.participation_level && (
                    <div className="mt-2">
                      <Badge variant={a.participation_level === "excellent" ? "default" : a.participation_level === "good" ? "secondary" : "outline"} className="text-xs">{a.participation_level}</Badge>
                    </div>
                  )}
                  {a.achievement && <p className="text-xs mt-1 text-green-600">🏆 {a.achievement}</p>}
                  {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No activities recorded</p>}
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Learner ID</Label><Input value={form.learner_id} onChange={e => setForm({...form, learner_id: e.target.value})} placeholder="Enter learner UUID" /></div>
            <div><Label>Activity Type</Label>
              <Select value={form.activity_type} onValueChange={v => setForm({...form, activity_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Activity Name</Label><Input value={form.activity_name} onChange={e => setForm({...form, activity_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" value={form.activity_date} onChange={e => setForm({...form, activity_date: e.target.value})} /></div>
              <div><Label>Participation</Label>
                <Select value={form.participation_level} onValueChange={v => setForm({...form, participation_level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="excellent">Excellent</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="average">Average</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <Button onClick={() => { save.mutate(form); setOpen(false); setForm({ learner_id: "", activity_type: "sports", activity_name: "", activity_date: new Date().toISOString().split("T")[0], participation_level: "good", notes: "" }); }} disabled={!form.learner_id || !form.activity_name || save.isPending}>Save Activity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
