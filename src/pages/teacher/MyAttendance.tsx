// @ts-nocheck
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, TrendingUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const { data: activeLeave = [] } = useQuery({
    queryKey: ["my-active-leave", user?.id, today],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests" as any)
        .select("*")
        .eq("user_id", user.id)
        .or("status.eq.approved,admin_decision.eq.approved")
        .lte("start_date", today)
        .gte("end_date", today);
      if (error) throw error;
      return data || [];
    },
  });

  const isOnApprovedLeave = activeLeave.length > 0;
  const approvedLeaveSummary = isOnApprovedLeave ? `${activeLeave[0]?.leave_type || "Leave"} approved until ${activeLeave[0]?.end_date}` : "No approved leave for today.";

  const fetchAttendance = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff_attendance" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user?.id]);

  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const campusLocation = { latitude: 0.3167, longitude: 32.5825 };
  const attendanceRadius = 250;

  const handleClockAction = (action: "in" | "out") => {
    if (!user?.id) return;
    if (!navigator?.geolocation) {
      setLocationMessage("Geolocation is unavailable in this browser.");
      return;
    }

    setActionLoading(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const distance = getDistanceFromLatLonInMeters(
            campusLocation.latitude,
            campusLocation.longitude,
            latitude,
            longitude,
          );

          if (distance > attendanceRadius) {
            setLocationMessage(`Check-in must happen from inside the approved campus radius (${attendanceRadius}m). Current distance: ${Math.round(distance)}m.`);
            setActionLoading(false);
            return;
          }

          const timeString = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          const currentHour = new Date().getHours();
          const existingRecord = rows.find((row) => row.date === today);

          if (action === "in") {
            const status = currentHour >= 8 ? "late" : "present";
            if (existingRecord) {
              const { error } = await supabase
                .from("staff_attendance" as any)
                .update({ check_in: timeString, status, notes: `On-campus clock-in (${Math.round(distance)}m from center)` })
                .eq("id", existingRecord.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("staff_attendance" as any)
                .insert({
                  user_id: user.id,
                  date: today,
                  check_in: timeString,
                  status: status,
                  notes: `On-campus clock-in (${Math.round(distance)}m from center)`,
                });
              if (error) throw error;
            }
            setLocationMessage(`Checked in at ${timeString}. ${status === "late" ? "Late entry recorded." : "Welcome on time."}`);
          } else {
            if (currentHour < 16 && !isOnApprovedLeave) {
              setLocationMessage("Early checkout is restricted before 16:00 unless you have approved leave.");
              setActionLoading(false);
              return;
            }
            if (existingRecord) {
              const { error } = await supabase
                .from("staff_attendance" as any)
                .update({ check_out: timeString, notes: `On-campus checkout (${Math.round(distance)}m from center)` })
                .eq("id", existingRecord.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("staff_attendance" as any)
                .insert({
                  user_id: user.id,
                  date: today,
                  check_out: timeString,
                  status: "present",
                  notes: `On-campus checkout (${Math.round(distance)}m from center)`,
                });
              if (error) throw error;
            }
            setLocationMessage(`Checked out at ${timeString}. ${isOnApprovedLeave ? "Approved leave applied." : "Good work today."}`);
          }

          await fetchAttendance();
        } catch (error: any) {
          setLocationMessage(error?.message || "Unable to record attendance.");
        } finally {
          setActionLoading(false);
        }
      },
      (err) => {
        setLocationMessage(err.message || "Location permission denied.");
        setActionLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const navigate = useNavigate();

  const todayRecord = rows.find((r) => r.date === today);
  const attendanceMessage = todayRecord
    ? `Today: check-in ${todayRecord.check_in || "--"} · check-out ${todayRecord.check_out || "--"}.`
    : "No attendance recorded for today yet.";

  const presentCount = rows.filter((r) => r.status === "present").length;
  const lateCount = rows.filter((r) => r.status === "late").length;
  const absentCount = rows.filter((r) => r.status === "absent").length;
  const attendanceRate = rows.length ? Math.round(((presentCount + (lateCount * 0.5)) / rows.length) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">Present</Badge>;
      case "late":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20">Late</Badge>;
      case "on_leave":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">On Leave</Badge>;
      default:
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20">Absent</Badge>;
    }
  };

  return (
    <DashboardLayout title="My Attendance" subtitle="Clock-in Logs & Punctuality Analysis">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-1 w-full ${attendanceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attendance Rate</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-black">{attendanceRate}%</p>
                <div className="flex items-center text-[10px] text-emerald-600 font-bold mb-1">
                  <TrendingUp className="h-3 w-3 mr-1" /> Termly
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Days Present</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{presentCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-100" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Late Counts</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{lateCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-100" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Absent Days</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-100" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" size="sm" className="h-10" onClick={() => handleClockAction("in")} disabled={actionLoading}>
                    Check In
                  </Button>
                  <Button variant="outline" size="sm" className="h-10" onClick={() => handleClockAction("out")} disabled={actionLoading}>
                    Check Out
                  </Button>
                </div>
                <div className="text-sm text-slate-600">{attendanceMessage}</div>
                <div className="text-xs text-muted-foreground">{approvedLeaveSummary}</div>
                {locationMessage ? (
                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-700">
                    {locationMessage}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-1 space-y-3">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Range Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">Position must be captured within the administrator-approved attendance radius.</p>
                <p className="font-mono text-sm">Radius: {attendanceRadius}m</p>
                <p className="text-xs text-muted-foreground mt-2">Campus center is used as the approved check-in zone. Early checkout is blocked before 16:00 unless approved leave is active.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent>
                <div className="text-xs font-bold uppercase text-muted-foreground">Today&apos;s Record</div>
                <div className="mt-3 text-sm text-slate-700">
                  {todayRecord ? (
                    <>
                      <div>In: {todayRecord.check_in || "--"}</div>
                      <div>Out: {todayRecord.check_out || "--"}</div>
                      <div>Status: {getStatusBadge(todayRecord.status)}</div>
                    </>
                  ) : (
                    <div>No record available yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-slate-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Attendance Log</CardTitle>
                <CardDescription>Review your time entries and status history</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold">
                <Filter className="h-3 w-3" /> Filter Log
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Clock In</th>
                      <th className="px-6 py-3 text-left">Clock Out</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        </tr>
                      ))
                    ) : rows.length > 0 ? (
                      rows.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold border-l-4 border-l-transparent hover:border-l-primary transition-all">
                            {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600">{r.check_in || "--:--"}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{r.check_out || "--:--"}</td>
                          <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                          <td className="px-6 py-4 text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                            {r.notes || "No notes"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                          No attendance records found for your account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Policy Awareness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 space-y-2">
                  <p className="text-[11px] font-bold text-amber-900">Late Coming Policy</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Clock-ins after 8:00 AM are flagged as "Late". Repeated lateness (3+ times a month) may trigger a formal warning from leadership.
                  </p>
                </div>
                <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 space-y-2">
                  <p className="text-[11px] font-bold text-red-900">Absence Policy</p>
                  <p className="text-[10px] text-red-800 leading-relaxed">
                    Unexplained absences result in automatic deductions from the monthly net pay. Ensure all leave is approved in advance.
                  </p>
                </div>
                <Button className="w-full h-8 text-[11px] font-bold" variant="outline" onClick={() => navigate("/teacher/requests") }>
                  Apply for Leave
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Summary Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Records</span>
                  <span className="font-bold">{rows.length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Perfect Score Weeks</span>
                  <span className="font-bold text-emerald-400">12</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Your promptness has improved by 12% compared to last term. High compliance levels contribute to positive performance reviews.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAttendance;
