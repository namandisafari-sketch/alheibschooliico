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
import { useOrphanAlerts, useResolveAlert, useCreateAlert } from "@/hooks/useOrphanage";
import { format } from "date-fns";
import { Bell, AlertTriangle, CheckCircle2, Plus, Filter, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const severityConfig = {
  critical: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
  high: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle },
  medium: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: Bell },
  low: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Bell },
  info: { color: "bg-slate-100 text-slate-800 border-slate-200", icon: Bell },
};

export function AlertsTab() {
  const [showAll, setShowAll] = useState(false);
  const { data: alerts } = useOrphanAlerts(!showAll);
  const resolveAlert = useResolveAlert();
  const createAlert = useCreateAlert();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ learner_id: "", alert_type: "general", severity: "info", title: "", message: "" });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alerts & Notifications</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={showAll} onCheckedChange={setShowAll} />
              <span className="text-xs text-muted-foreground">Show resolved</span>
            </div>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Alert</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(alerts || []).map(a => {
            const SeverityIcon = severityConfig[a.severity]?.icon || Bell;
            return (
              <div key={a.id} className={`flex items-start justify-between p-4 border rounded-lg ${a.is_resolved ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <SeverityIcon className={`h-5 w-5 mt-0.5 ${a.severity === "critical" ? "text-red-500" : a.severity === "high" ? "text-orange-500" : "text-amber-500"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{a.title}</p>
                      <Badge variant="outline" className={`text-xs ${severityConfig[a.severity]?.color}`}>{a.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{a.alert_type.replace(/_/g, " ")}</Badge>
                    </div>
                    {a.message && <p className="text-sm text-muted-foreground mt-1">{a.message}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span><Clock className="h-3 w-3 inline" /> {format(new Date(a.created_at), "MMM d, yyyy h:mm a")}</span>
                      {a.learner?.full_name && <span>• {a.learner.full_name}</span>}
                    </div>
                  </div>
                </div>
                {!a.is_resolved && (
                  <Button variant="ghost" size="sm" onClick={() => resolveAlert.mutate(a.id)} disabled={resolveAlert.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            );
          })}
          {(!alerts || alerts.length === 0) && <p className="text-center text-muted-foreground py-8">No alerts</p>}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Alert</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Learner ID (optional)</Label><Input value={form.learner_id} onChange={e => setForm({...form, learner_id: e.target.value})} placeholder="UUID or leave empty for general" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Alert Type</Label>
                <Select value={form.alert_type} onValueChange={v => setForm({...form, alert_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["health_concern","academic_concern","behavioral_concern","attendance_concern","sponsorship_expiry","sponsorship_payment_due","report_due","checkup_due","birthday","general"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({...form, severity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} /></div>
            <Button onClick={() => { createAlert.mutate(form); setOpen(false); setForm({ learner_id: "", alert_type: "general", severity: "info", title: "", message: "" }); }} disabled={!form.title || createAlert.isPending}>Create Alert</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
