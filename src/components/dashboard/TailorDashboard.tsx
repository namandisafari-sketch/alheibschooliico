// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Scissors, Plus, Ruler, Clock, CheckCircle2, Search, User, DollarSign } from "lucide-react";

const TASK_TYPES = [
  { value: "new_uniform", label: "New Uniform" },
  { value: "repair", label: "Repair" },
  { value: "alteration", label: "Alteration" },
  { value: "other_clothing", label: "Other Clothing" },
];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-slate-100 text-slate-800",
};

const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest (in)" },
  { key: "waist", label: "Waist (in)" },
  { key: "hips", label: "Hips (in)" },
  { key: "length", label: "Length (in)" },
  { key: "sleeve", label: "Sleeve (in)" },
  { key: "shoulder", label: "Shoulder (in)" },
  { key: "neck", label: "Neck (in)" },
  { key: "trouser_length", label: "Trouser Length (in)" },
  { key: "shorts_length", label: "Shorts Length (in)" },
  { key: "shirt_length", label: "Shirt Length (in)" },
];

export const TailorDashboard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [learnerSearch, setLearnerSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState(null);
  const [form, setForm] = useState({
    learner_id: "", task_type: "new_uniform", description: "",
    measurements: {}, priority: "normal", estimated_cost: 0, notes: "",
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tailor-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tailor_tasks")
        .select("*, learner:learners(full_name, admission_number)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: learners = [] } = useQuery({
    queryKey: ["tailor-learners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("learners")
        .select("id, full_name, admission_number")
        .eq("status", "active")
        .order("full_name");
      return data || [];
    },
  });

  const { data: stats = {} } = useQuery({
    queryKey: ["tailor-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_tailor_stats");
      return data || {};
    },
  });

  const create = useMutation({
    mutationFn: async (d) => {
      const { error } = await supabase.from("tailor_tasks").insert({
        learner_id: d.learner_id || null, task_type: d.task_type,
        description: d.description, measurements: d.measurements,
        priority: d.priority, estimated_cost: d.estimated_cost,
        notes: d.notes, recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tailor-tasks"] }); qc.invalidateQueries({ queryKey: ["tailor-stats"] }); toast.success("Task created"); setOpen(false); setForm({ learner_id: "", task_type: "new_uniform", description: "", measurements: {}, priority: "normal", estimated_cost: 0, notes: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, status, actual_cost }) => {
      const upd = { status };
      if (status === "completed") upd.completion_date = new Date().toISOString();
      if (status === "delivered") upd.delivered_date = new Date().toISOString();
      if (actual_cost !== undefined) upd.actual_cost = actual_cost;
      const { error } = await supabase.from("tailor_tasks").update(upd).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tailor-tasks"] }); qc.invalidateQueries({ queryKey: ["tailor-stats"] }); toast.success("Updated"); },
    onError: (e) => toast.error(e.message),
  });

  const filteredLearners = learners.filter((l) =>
    !learnerSearch || l.full_name?.toLowerCase().includes(learnerSearch.toLowerCase()) ||
    l.admission_number?.toLowerCase().includes(learnerSearch.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    !search || t.learner?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.task_type?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div id="tailor-stats" className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Tasks", value: stats.total_tasks || 0, icon: Scissors, color: "indigo" },
          { label: "Pending", value: stats.pending_tasks || 0, icon: Clock, color: "amber" },
          { label: "In Progress", value: stats.in_progress_tasks || 0, icon: Scissors, color: "blue" },
          { label: "Completed", value: stats.completed_tasks || 0, icon: CheckCircle2, color: "green" },
          { label: "Est. Cost (UGX)", value: Number(stats.total_estimated_cost || 0).toLocaleString(), icon: DollarSign, color: "teal" },
        ].map((s) => (
          <Card key={s.label} className="bg-muted/30">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs id="tailor-task-board" defaultValue="tasks">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="tasks">All Tasks</TabsTrigger>
            <TabsTrigger value="new" id="new-tailor-task-btn">New Task + Measurements</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          </TabsList>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
        </div>

        <TabsContent value="tasks">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tasks yet</TableCell></TableRow>
                  ) : filteredTasks.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setTask(t)}>
                      <TableCell className="text-sm font-medium">{t.learner?.full_name || "General"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{TASK_TYPES.find(x => x.value === t.task_type)?.label}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{t.description || "-"}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${STATUS_STYLES[t.status] || ""}`}>{t.status?.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{format(new Date(t.created_at), "dd MMM")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {t.status === "pending" && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); update.mutate({ id: t.id, status: "in_progress" }); }}>Start</Button>}
                          {t.status === "in_progress" && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); update.mutate({ id: t.id, status: "completed" }); }}>Complete</Button>}
                          {t.status === "completed" && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); update.mutate({ id: t.id, status: "delivered" }); }}>Deliver</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Ruler className="h-5 w-5" /> Record Measurements & New Task</CardTitle>
              <CardDescription>Select a learner (or leave blank for general), take measurements, and create a tailoring task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Learner (optional)</Label>
                <Input placeholder="Search by name or admission..." value={learnerSearch} onChange={(e) => setLearnerSearch(e.target.value)} className="mb-2" />
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  <Button variant={!form.learner_id ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setForm({ ...form, learner_id: "" })}>General</Button>
                  {filteredLearners.slice(0, 30).map((l) => (
                    <Button key={l.id} variant={form.learner_id === l.id ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setForm({ ...form, learner_id: l.id })}>
                      {l.full_name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Task Type</Label>
                  <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="e.g. Full school uniform - shirt and shorts" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /><Label className="font-bold">Measurements (inches)</Label></div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {MEASUREMENT_FIELDS.map(f => (
                    <div key={f.key} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{f.label}</Label>
                      <Input type="number" placeholder="--" value={form.measurements[f.key] || ""} onChange={(e) => setForm({ ...form, measurements: { ...form.measurements, [f.key]: e.target.value } })} className="h-8" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Cost (UGX)</Label>
                  <Input type="number" value={form.estimated_cost || ""} onChange={(e) => setForm({ ...form, estimated_cost: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Special instructions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.task_type} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> {create.isPending ? "Creating..." : "Create Task"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p>No active jobs</p>
                </CardContent>
              </Card>
            ) : tasks.filter((t) => t.status === "pending" || t.status === "in_progress").map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTask(t)}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{t.learner?.full_name || "General"}</p>
                      <p className="text-[10px] text-muted-foreground">{t.learner?.admission_number || ""}</p>
                    </div>
                    <Badge className={`text-[10px] ${STATUS_STYLES[t.status] || ""}`}>{t.status?.replace("_", " ")}</Badge>
                  </div>
                  <Badge variant="outline" className="text-[8px]">{TASK_TYPES.find(x => x.value === t.task_type)?.label}</Badge>
                  {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    {t.status === "pending" && <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => update.mutate({ id: t.id, status: "in_progress" })}>Start</Button>}
                    {t.status === "in_progress" && <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => { const c = prompt("Actual cost (UGX):", String(t.estimated_cost || 0)); if (c !== null) update.mutate({ id: t.id, status: "completed", actual_cost: parseFloat(c) || 0 }); }}>Complete</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!task} onOpenChange={(o) => { if (!o) setTask(null); }}>
        <DialogContent className="max-w-xl">
          {task && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Task Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[10px] text-muted-foreground">Learner</span><p className="font-medium">{task.learner?.full_name || "General"}</p></div>
                  <div><span className="text-[10px] text-muted-foreground">Type</span><p className="font-medium">{TASK_TYPES.find(x => x.value === task.task_type)?.label}</p></div>
                  <div><span className="text-[10px] text-muted-foreground">Status</span><Badge className={`text-[10px] ${STATUS_STYLES[task.status] || ""}`}>{task.status?.replace("_", " ")}</Badge></div>
                  <div><span className="text-[10px] text-muted-foreground">Cost</span><p className="font-medium">UGX {Number(task.estimated_cost || 0).toLocaleString()}</p></div>
                </div>
                {task.description && <div><span className="text-[10px] text-muted-foreground">Description</span><p className="text-sm">{task.description}</p></div>}
                {task.measurements && Object.keys(task.measurements).length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Measurements</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
                      {Object.entries(task.measurements).map(([k, v]) => (
                        <div key={k} className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-[8px] text-muted-foreground uppercase">{k.replace(/_/g, " ")}</p>
                          <p className="font-bold text-sm">{v}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {task.notes && <div><span className="text-[10px] text-muted-foreground">Notes</span><p className="text-sm text-muted-foreground">{task.notes}</p></div>}
                <div className="text-[10px] text-muted-foreground space-y-1">
                  <p>Created: {format(new Date(task.created_at), "dd MMM yyyy HH:mm")}</p>
                  {task.completion_date && <p>Completed: {format(new Date(task.completion_date), "dd MMM yyyy HH:mm")}</p>}
                  {task.delivered_date && <p>Delivered: {format(new Date(task.delivered_date), "dd MMM yyyy HH:mm")}</p>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
