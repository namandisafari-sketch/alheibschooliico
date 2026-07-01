// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrphanLearners, useOrphanAlerts, useResolveAlert } from "@/hooks/useOrphanage";
import { format } from "date-fns";
import { AlertTriangle, Search, UserCheck, Bell, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: orphans } = useOrphanLearners(search);
  const { data: alerts } = useOrphanAlerts(true);
  const resolveAlert = useResolveAlert();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Registered Orphans</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Search orphans..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sponsorship</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orphans || []).slice(0, 20).map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.full_name}</TableCell>
                  <TableCell>{o.admission_number}</TableCell>
                  <TableCell>{o.class?.name || "—"}</TableCell>
                  <TableCell><Badge variant={o.orphan_status === "supported" ? "default" : "secondary"}>{o.orphan_status || "registered"}</Badge></TableCell>
                  <TableCell>{o.sponsorship_number ? <Badge variant="outline">Sponsored</Badge> : <Badge variant="secondary">Unsponsored</Badge>}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/students?id=${o.id}`)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!orphans || orphans.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orphans registered yet. Go to Students to mark learners as orphans.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Active Alerts</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(alerts || []).slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${a.severity === "critical" ? "text-red-500" : a.severity === "high" ? "text-orange-500" : "text-amber-500"}`} />
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.message} {a.learner?.full_name ? `- ${a.learner.full_name}` : ""}</p>
                    <p className="text-xs text-muted-foreground mt-1"><Clock className="h-3 w-3 inline" /> {format(new Date(a.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => resolveAlert.mutate(a.id)} disabled={resolveAlert.isPending}>Resolve</Button>
              </div>
            ))}
            {(!alerts || alerts.length === 0) && <p className="text-center text-muted-foreground py-4">No active alerts</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
