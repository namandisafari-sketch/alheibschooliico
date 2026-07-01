import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useHikvisionStatus, useHikvisionMappings, useCreateMapping, useDeleteMapping, useHikvisionSync, useStaffList, useLearnerList, type DeviceMapping } from "@/hooks/useHikvision";
import { toast } from "sonner";
import {
  RefreshCw, Shield, User, Trash2, Save, Clock, Plus, Fingerprint,
} from "lucide-react";

export default function HikvisionManagement() {
  const { status, loading: statusLoading, refresh: refreshStatus } = useHikvisionStatus();
  const { data: mappings = [], isLoading: mappingsLoading } = useHikvisionMappings();
  const { data: staff = [] } = useStaffList();
  const { data: learners = [] } = useLearnerList();
  const createMapping = useCreateMapping();
  const deleteMapping = useDeleteMapping();
  const { result: syncResult, syncing, sync } = useHikvisionSync();

  const [showForm, setShowForm] = useState(false);
  const [empNo, setEmpNo] = useState("");
  const [empName, setEmpName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedLearnerId, setSelectedLearnerId] = useState("");

  const handleCreate = async () => {
    if (!empNo.trim()) {
      toast.error("Employee number is required");
      return;
    }
    if (!selectedUserId && !selectedLearnerId) {
      toast.error("Link to a staff member or learner");
      return;
    }
    await createMapping.mutateAsync({
      employee_no: empNo.trim(),
      user_id: selectedUserId || undefined,
      learner_id: selectedLearnerId || undefined,
      employee_name: empName.trim() || undefined,
    });
    toast.success("Mapping created");
    setEmpNo("");
    setEmpName("");
    setSelectedUserId("");
    setSelectedLearnerId("");
    setShowForm(false);
  };

  const handleDelete = async (mapping: DeviceMapping) => {
    await deleteMapping.mutateAsync(mapping.id);
    toast.success("Mapping removed");
  };

  return (
    <DashboardLayout
      title="Attendance Device"
      subtitle="Hikvision DS-K1A802AMF-B Fingerprint Terminal"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" /> Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <p className="text-sm text-muted-foreground">Checking...</p>
              ) : status?.ok ? (
                <div className="space-y-1">
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Online
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{status?.info?.deviceName || status?.info?.deviceID || "Connected"}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Offline
                  </p>
                  <p className="text-xs text-red-500">{status?.error || "No connection"}</p>
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-3 w-full gap-1 text-xs" onClick={refreshStatus}>
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fingerprint className="h-4 w-4" /> Mappings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mappings.length}</p>
              <p className="text-xs text-muted-foreground">employee numbers linked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Last Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncResult ? (
                <div>
                  <p className="text-sm">
                    <span className="text-green-600 font-medium">{syncResult.synced}</span> synced
                    {syncResult.failed > 0 && <span className="text-red-500 ml-1">({syncResult.failed} failed)</span>}
                  </p>
                  {syncResult.errors.length > 0 && (
                    <p className="text-xs text-red-500 truncate mt-1">{syncResult.errors[0]}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run a sync to see results</p>
              )}
              <Button
                variant="outline" size="sm" className="mt-3 w-full gap-1 text-xs"
                onClick={() => sync()} disabled={syncing}
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Employee Mappings</CardTitle>
              <CardDescription>Link Hikvision employee numbers to users and learners</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
              <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Mapping"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Employee Number (from device)</Label>
                    <Input placeholder="e.g. 1001" value={empNo} onChange={e => setEmpNo(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Employee Name (optional)</Label>
                    <Input placeholder="John Doe" value={empName} onChange={e => setEmpName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Link to Staff</Label>
                    <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); setSelectedLearnerId(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                      <SelectContent>
                        {staff.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Link to Learner</Label>
                    <Select value={selectedLearnerId} onValueChange={(v) => { setSelectedLearnerId(v); setSelectedUserId(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select learner..." /></SelectTrigger>
                      <SelectContent>
                        {learners.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.admission_number || "no adm#"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" onClick={handleCreate} disabled={createMapping.isPending} className="gap-1">
                  <Save className="h-4 w-4" /> Save Mapping
                </Button>
              </div>
            )}

            {mappingsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : mappings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No mappings yet</p>
                <p className="text-xs">Link employee numbers from the device to staff or learners</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Linked To</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono font-medium">{m.employee_no}</TableCell>
                      <TableCell>{m.employee_name || "—"}</TableCell>
                      <TableCell>
                        {m.profiles ? (
                          <Badge variant="secondary" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {m.profiles.full_name}
                          </Badge>
                        ) : m.learners ? (
                          <Badge variant="outline" className="text-xs">
                            {m.learners.full_name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unlinked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.device_name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => handleDelete(m)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
