// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { Search, Calendar, CheckCircle, XCircle, Clock, User, Phone, ExternalLink, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Appointments = () => {
  const { data: appointments = [] } = useAppointments();
  const updateAppointment = useUpdateAppointment();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [conflictMap, setConflictMap] = useState<Record<string, any[]>>({});
  const [checkingConflict, setCheckingConflict] = useState<string | null>(null);

  const dayMap: Record<string, number> = {
    Sunday: 7, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
  };

  const checkTimetableConflict = async (a: any) => {
    if (!a.host_staff_id || !a.scheduled_for) return [];
    const dt = new Date(a.scheduled_for);
    const dayOfWeek = dayMap[dt.toLocaleDateString("en-US", { weekday: "long" })] || 0;
    const timeStr = `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;

    const { data: timetable } = await supabase
      .from("class_timetables")
      .select("*, subjects:subjects(name), classes:classes(name)")
      .eq("teacher_id", a.host_staff_id)
      .eq("day_of_week", dayOfWeek);

    if (!timetable) return [];

    return timetable.filter((slot: any) => {
      return timeStr >= slot.start_time && timeStr < slot.end_time;
    });
  };

  const handleApproveWithConflictCheck = async (a: any) => {
    setCheckingConflict(a.id);
    try {
      const conflicts = await checkTimetableConflict(a);
      if (conflicts.length > 0) {
        setConflictMap(prev => ({ ...prev, [a.id]: conflicts }));
        toast({
          title: "Timetable Conflict Detected",
          description: `${a.host_name || "Staff member"} has ${conflicts.length} lesson(s) scheduled at this time.`,
          variant: "destructive",
        });
        return;
      }
      await handleApprove(a);
    } finally {
      setCheckingConflict(null);
    }
  };

  const filtered = appointments.filter((a) =>
    a.visitor_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.purpose?.toLowerCase().includes(search.toLowerCase()) ||
    a.host_name?.toLowerCase().includes(search.toLowerCase())
  );

  const notifyStatus = (a: any, newStatus: string) => {
    fetch("/api/notify/appointment-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_name: a.visitor_name,
        visitor_phone: a.visitor_phone,
        visitor_email: a.visitor_email,
        purpose: a.purpose,
        scheduled_for: a.scheduled_for,
        host_name: a.host_name,
        location: a.location,
        newStatus,
        changedBy: user?.email || "Office Staff",
      }),
    }).catch(() => {});
  };

  const handleApprove = async (a: any) => {
    try {
      await updateAppointment.mutateAsync({ id: a.id, status: "approved" });
      notifyStatus(a, "approved");
      toast({ title: "Approved", description: "Appointment has been approved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (a: any) => {
    try {
      await updateAppointment.mutateAsync({ id: a.id, status: "cancelled" });
      notifyStatus(a, "cancelled");
      toast({ title: "Cancelled", description: "Appointment has been cancelled." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

   const handleCheckIn = async (a: any) => {
      try {
        await updateAppointment.mutateAsync({
          id: a.id,
          status: "checked_in",
          checked_in_at: new Date().toISOString(),
        });
        notifyStatus(a, "checked_in");
        toast({ title: "Checked In", description: "Visitor has been checked in." });
      } catch (e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
     }
   };

  const pending = filtered.filter((a) => a.status === "scheduled");
  const approved = filtered.filter((a) => a.status === "approved");
  const today = filtered.filter((a) =>
    a.scheduled_for?.startsWith(new Date().toISOString().split("T")[0])
  );

  const statusBadge = (status: string) => {
    const map = {
      scheduled: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      checked_in: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-slate-100 text-slate-600 border-slate-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_show: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  return (
    <DashboardLayout title="Appointment Management" subtitle="Approve, manage, and track visitor appointments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approved.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{today.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filtered.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by visitor, purpose, host..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending Approval ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {pending.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">No pending appointments.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((a) => {
                    const conflicts = conflictMap[a.id];
                    return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.visitor_name}
                            {conflicts && conflicts.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Conflict: {conflicts.length} lesson(s) at this time</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{a.purpose}</TableCell>
                          <TableCell>
                            {a.host_name || "—"}
                            {conflicts && conflicts.length > 0 && (
                              <div className="text-[10px] text-red-500 mt-0.5">
                                {conflicts.map((c: any) => (
                                  <span key={c.id} className="block">{c.subjects?.name} ({c.classes?.name})</span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs">{a.scheduled_for ? format(new Date(a.scheduled_for), "MMM d, yyyy") : "—"}</span>
                              <span className="text-[10px] text-muted-foreground">{a.scheduled_for ? format(new Date(a.scheduled_for), "h:mm a") : ""}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {a.visitor_phone && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" /> {a.visitor_phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApproveWithConflictCheck(a)} disabled={updateAppointment.isPending || checkingConflict === a.id}>
                                <CheckCircle className="h-3 w-3 mr-1" /> {checkingConflict === a.id ? "Checking..." : "Approve"}
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(a)} disabled={updateAppointment.isPending}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    );
                    })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {approved.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">No approved appointments.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approved.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.visitor_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{a.purpose}</TableCell>
                          <TableCell>{a.host_name || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs">{a.scheduled_for ? format(new Date(a.scheduled_for), "MMM d, yyyy") : "—"}</span>
                              <span className="text-[10px] text-muted-foreground">{a.scheduled_for ? format(new Date(a.scheduled_for), "h:mm a") : ""}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusBadge(a.status)} variant="outline">
                              {a.status === "checked_in" ? "Checked In" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {a.status === "approved" && (
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => handleCheckIn(a)} disabled={updateAppointment.isPending}>
                                Check In
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">No appointments found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.visitor_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{a.purpose}</TableCell>
                          <TableCell>{a.host_name || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs">{a.scheduled_for ? format(new Date(a.scheduled_for), "MMM d, yyyy") : "—"}</span>
                              <span className="text-[10px] text-muted-foreground">{a.scheduled_for ? format(new Date(a.scheduled_for), "h:mm a") : ""}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{a.visitor_phone || "—"}</TableCell>
                          <TableCell>
                            <Badge className={statusBadge(a.status)} variant="outline">
                              {a.status === "checked_in" ? "Checked In" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
