import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Kpi, Section } from "@/components/role/RolePage";
import { Shield, Car, LogOut, ClipboardList, UserCheck, AlertTriangle, Scan, DoorOpen, CalendarCheck, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { IDScannerDialog } from "@/components/visitors/IDScannerDialog";
import { useState } from "react";
import { uuidToShortId } from "@/lib/shortId";
import { format } from "date-fns";

export const GatemanDashboard = () => {
  const [scannerOpen, setScannerOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const { data: todayVisits = 0 } = useQuery({
    queryKey: ["gateman-today-visits"],
    queryFn: async () => {
      const { count } = await supabase
        .from("visitor_visits")
        .select("id", { count: "exact", head: true })
        .gte("check_in_at", todayStr);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: vehiclesIn = 0 } = useQuery({
    queryKey: ["gateman-vehicles-in"],
    queryFn: async () => {
      const { count } = await supabase
        .from("vehicle_logs")
        .select("id", { count: "exact", head: true })
        .is("exit_time", null);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: pendingExits = 0 } = useQuery({
    queryKey: ["gateman-pending-exits"],
    queryFn: async () => {
      const { count } = await supabase
        .from("exit_passes")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved");
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: checkedIn = 0 } = useQuery({
    queryKey: ["gateman-checked-in"],
    queryFn: async () => {
      const { count } = await supabase
        .from("visitor_visits")
        .select("id", { count: "exact", head: true })
        .eq("status", "checked_in");
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: approvedAppts = 0 } = useQuery({
    queryKey: ["gateman-approved-appts"],
    queryFn: async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("scheduled_for", todayStr);
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const { data: appointmentsToday = [] } = useQuery({
    queryKey: ["gateman-appts-today"],
    queryFn: async () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { data } = await supabase
        .from("appointments")
        .select("id, visitor_name, visitor_phone, purpose, host_name, scheduled_for, status")
        .in("status", ["approved", "checked_in", "scheduled"])
        .gte("scheduled_for", todayStr)
        .lt("scheduled_for", tomorrow.toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(10);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ["gateman-pending-approvals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exit_passes")
        .select("id, reason, departure_target_time, pass_type, learner:learner_id(full_name), staff:staff_id(full_name)")
        .eq("status", "approved")
        .order("departure_target_time", { ascending: true })
        .limit(10);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: biometricToday = 0 } = useQuery({
    queryKey: ["gateman-biometric-today"],
    queryFn: async () => {
      const { count } = await supabase
        .from("staff_attendance")
        .select("id", { count: "exact", head: true })
        .eq("date", todayStr.slice(0, 10))
        .eq("source", "hikvision");
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const { data: biometricList = [] } = useQuery({
    queryKey: ["gateman-biometric-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_attendance")
        .select("id, user_id, check_in, profiles:user_id(full_name)")
        .eq("date", todayStr.slice(0, 10))
        .eq("source", "hikvision")
        .order("check_in", { ascending: false })
        .limit(8);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: activeVisits = [] } = useQuery({
    queryKey: ["gateman-active-visits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, visitor_name, visitor_phone, purpose, host_name, checked_in_at, status, host_verified_at")
        .in("status", ["checked_in", "completed"])
        .order("checked_in_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Kpi label="Visitors Today" value={todayVisits} icon={UserCheck} tone="primary" />
        <Kpi label="Checked In Now" value={checkedIn} icon={DoorOpen} tone="info" />
        <Kpi label="Appointments Today" value={appointmentsToday.length} icon={CalendarCheck} tone="success" />
        <Kpi label="Ready to Check In" value={approvedAppts} icon={Shield} tone="info" />
        <Kpi label="Vehicles Inside" value={vehiclesIn} icon={Car} tone="info" />
        <Kpi label="Ready for Exit" value={pendingExits} icon={LogOut} tone="warning" />
        <Kpi label="Biometric Today" value={biometricToday} icon={Fingerprint} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Gate Operations" description="Front-line controls">
          <div className="grid gap-3">
            <Button asChild className="justify-start h-12 rounded-xl bg-blue-600 hover:bg-blue-700">
              <Link to="/gate/appointments"><CalendarCheck className="mr-2 h-4 w-4" />Appointment Verification</Link>
            </Button>
            <IDScannerDialog
              onScanComplete={(result) => {
                setScannerOpen(true);
              }}
            />
            <Button asChild className="justify-start h-12 rounded-xl">
              <Link to="/gate?tab=visitors"><Shield className="mr-2 h-4 w-4" />Visitor Sign-In</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate/vehicles"><Car className="mr-2 h-4 w-4" />Vehicle In/Out Log</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate/exit-passes"><LogOut className="mr-2 h-4 w-4" />Learner Exit Passes</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate/handover"><ClipboardList className="mr-2 h-4 w-4" />Shift Handover</Link>
            </Button>
          </div>
        </Section>

        <Section title="Pending Exits" description="Ready for gate verification">
          {pendingApprovals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No pending exit passes</p>
          ) : (
            <div className="divide-y">
              {pendingApprovals.map((p: any) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {p.learner?.full_name || p.staff?.full_name || "Unknown"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.reason || "No reason"} &middot; {p.pass_type}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg">
                    <Link to={`/gate/exit-passes`}>Verify</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Today's Appointments" description="Approved & pending visits">
          {appointmentsToday.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No appointments scheduled for today</p>
          ) : (
            <div className="divide-y">
              {appointmentsToday.map((a: any) => (
                <div key={a.id} className="py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{a.visitor_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.purpose} {a.host_name ? `· ${a.host_name}` : ""}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {format(new Date(a.scheduled_for), "h:mm a")} · ID: {uuidToShortId(a.id)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                      a.status === "approved" ? "bg-blue-100 text-blue-700" :
                      a.status === "checked_in" ? "bg-emerald-100 text-emerald-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {a.status === "approved" ? "Check In" : a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Active Visitors" description="Checked in & host verification status">
          {activeVisits.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No active visitors</p>
          ) : (
            <div className="divide-y">
              {activeVisits.slice(0, 8).map((v: any) => (
                <div key={v.id} className="py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{v.visitor_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {v.host_name ? `→ ${v.host_name}` : v.purpose}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {v.checked_in_at ? format(new Date(v.checked_in_at), "h:mm a") : ""} · {uuidToShortId(v.id)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {v.status === "completed" && v.host_verified_at ? (
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                        Completed
                      </span>
                    ) : v.status === "completed" ? (
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                        Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-amber-100 text-amber-700">
                        Awaiting Host
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Quick Actions" description="Common gate tasks">
          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-start h-10 rounded-xl text-xs">
              <Link to="/gate/handover"><ClipboardList className="mr-2 h-3.5 w-3.5" />Start Shift Handover</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-10 rounded-xl text-xs">
              <Link to="/gate/vehicles"><Car className="mr-2 h-3.5 w-3.5" />Log Vehicle Entry</Link>
            </Button>
            <p className="text-[10px] text-muted-foreground text-center pt-2">
              All gate actions are logged and time-stamped
            </p>
          </div>
        </Section>

        <Section title="Biometric Check-ins" description="Staff via fingerprint device">
          {biometricList.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center flex flex-col items-center gap-1">
              <Fingerprint className="h-5 w-5 opacity-30" />
              No biometric check-ins yet
            </p>
          ) : (
            <div className="divide-y">
              {biometricList.map((b: any) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-sm font-medium">{b.profiles?.full_name || "Unknown"}</p>
                  </div>
                  <span className="text-[10px] font-mono text-green-700">
                    {b.check_in ? format(new Date(b.check_in), "HH:mm") : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2">
            <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs gap-1">
              <Link to="/gate?tab=staff"><Fingerprint className="h-3 w-3" /> View All Check-ins</Link>
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
};