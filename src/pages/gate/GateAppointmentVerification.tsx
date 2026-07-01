import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { uuidToShortId } from "@/lib/shortId";
import { Search, CheckCircle2, Clock, XCircle, UserCheck, Phone, AlertTriangle, ShieldCheck, ThumbsUp, Building, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import ThermalGatePass from "@/components/gate/ThermalGatePass";

const statusConfig: Record<string, { label: string; color: string; badge: string }> = {
  scheduled: { label: "Pending Approval", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "text-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  checked_in: { label: "Checked In", color: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", color: "text-slate-600", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled: { label: "Cancelled", color: "text-red-600", badge: "bg-red-100 text-red-700 border-red-200" },
  no_show: { label: "No Show", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function GateAppointmentVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const [query, setQuery] = useState(initialId);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [purposeConfirmed, setPurposeConfirmed] = useState(false);
  const [gatePin, setGatePin] = useState<string>("");
  const [showGatePass, setShowGatePass] = useState(false);

  useEffect(() => {
    if (initialId) searchAppointment(initialId);
  }, [initialId]);

  const searchAppointment = async (val?: string) => {
    const search = (val || query).trim();
    if (!search) return;
    setLoading(true);
    setError(null);
    setAppointment(null);
    setVerificationNotes("");
    setIdentityConfirmed(false);
    setPurposeConfirmed(false);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
      let data: any = null;
      if (isUUID) {
        const r = await supabase.from("appointments").select("*").eq("id", search).maybeSingle();
        if (r.error) throw r.error;
        data = r.data;
      } else {
        const r = await supabase
          .from("appointments")
          .select("*")
          .gte("scheduled_for", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order("scheduled_for", { ascending: false })
          .limit(100);
        if (r.error) throw r.error;
        data = (r.data || []).find((a: any) => uuidToShortId(a.id) === search.toUpperCase()) || null;
      }
      if (!data) {
        setError("No appointment found with this ID.");
        return;
      }
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || "Failed to look up appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!appointment) return;
    setProcessing(true);
    try {
      const { error: err } = await supabase
        .from("appointments")
        .update({ status: "approved" })
        .eq("id", appointment.id);
      if (err) throw err;
      toast({ title: "Appointment approved", description: "This visitor can now be checked in at the gate." });
      setAppointment({ ...appointment, status: "approved" });
      fetch("/api/notify/appointment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_name: appointment.visitor_name,
          visitor_phone: appointment.visitor_phone,
          visitor_email: appointment.visitor_email,
          purpose: appointment.purpose,
          scheduled_for: appointment.scheduled_for,
          host_name: appointment.host_name,
          location: appointment.location,
          newStatus: "approved",
          changedBy: user?.email || "Gate Officer",
        }),
      }).catch(() => {});
    } catch (err: any) {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const generatePin = (): string => {
    return String(Math.floor(1000 + Math.random() * 9000));
  };

   const handleCheckIn = async () => {
      if (!appointment) return;
      setProcessing(true);
      try {
        const pin = generatePin();
        const { error: err } = await supabase
          .from("appointments")
          .update({
            status: "checked_in",
            checked_in_at: new Date().toISOString(),
            verified_by: user?.id || null,
          })
          .eq("id", appointment.id);
        if (err) throw err;
        setGatePin(pin);
        setAppointment({ ...appointment, status: "checked_in", checked_in_at: new Date().toISOString() });
        setShowGatePass(true);
        toast({ title: "Visitor checked in", description: `${appointment.visitor_name} has been verified and checked in.` });
        fetch("/api/notify/appointment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_name: appointment.visitor_name,
            visitor_phone: appointment.visitor_phone,
            visitor_email: appointment.visitor_email,
            purpose: appointment.purpose,
            scheduled_for: appointment.scheduled_for,
            host_name: appointment.host_name,
            location: appointment.location,
            newStatus: "checked_in",
            changedBy: user?.email || "Gate Officer",
          }),
        }).catch(() => {});
      } catch (err: any) {
        toast({ title: "Check-in failed", description: err.message, variant: "destructive" });
      } finally {
        setProcessing(false);
      }
   };

  const sc = appointment ? statusConfig[appointment.status] || statusConfig.scheduled : statusConfig.scheduled;

  return (
    <DashboardLayout
      title="Appointment Verification"
      subtitle="Scan or enter appointment ID to verify and check in visitors"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Find Appointment
            </CardTitle>
            <CardDescription>
              Enter the visitor's appointment ID or scan their QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); searchAppointment(); }} className="flex gap-2">
              <Input
                placeholder="Enter short ID (e.g. A3X7K9)"
                className="font-mono text-lg tracking-widest uppercase flex-1"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                maxLength={36}
              />
              <Button type="submit" disabled={loading} className="gap-2">
                <Search className="h-4 w-4" /> {loading ? "Searching..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {appointment && (
          <>
            <Card className="border-2 overflow-hidden">
              <div className={`p-4 text-white ${appointment.status === "checked_in" ? "bg-emerald-600" : appointment.status === "approved" ? "bg-blue-600" : "bg-slate-900"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Appointment</p>
                    <p className="text-xl font-mono font-black tracking-widest">{uuidToShortId(appointment.id)}</p>
                  </div>
                  <Badge variant="outline" className={`${sc.badge} border-0 text-[10px] uppercase font-black`}>
                    {sc.label}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visitor</p>
                    <p className="font-bold text-lg">{appointment.visitor_name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                    <p className="font-bold flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {appointment.visitor_phone || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purpose</p>
                  <p className="font-bold">{appointment.purpose}</p>
                </div>

                {appointment.host_name && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visiting</p>
                    <p className="font-bold">{appointment.host_name}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled</p>
                    <p className="font-bold">{format(new Date(appointment.scheduled_for), "MMM d, yyyy")}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</p>
                    <p className="font-bold">{format(new Date(appointment.scheduled_for), "h:mm a")}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visitor Notes</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Approval - Office staff can approve */}
            {appointment.status === "scheduled" && (
              <Card className="border-2 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <Clock className="h-5 w-5" /> Pending Approval
                  </CardTitle>
                  <CardDescription>
                    This appointment has not been approved yet. Only office staff can approve it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleApprove}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest gap-3"
                    disabled={processing}
                  >
                    {processing ? "Approving..." : "Approve Appointment"}
                    <ThumbsUp className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Approved - Gateman can check in */}
            {appointment.status === "approved" && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                    <ShieldCheck className="h-5 w-5" /> Gate Verification
                  </CardTitle>
                  <CardDescription>
                    Verify the visitor's identity and purpose before checking them in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={identityConfirmed}
                        onChange={(e) => setIdentityConfirmed(e.target.checked)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-sm">Identity Confirmed</p>
                        <p className="text-xs text-muted-foreground">Visitor's name matches the appointment and they have valid ID if required</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={purposeConfirmed}
                        onChange={(e) => setPurposeConfirmed(e.target.checked)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-sm">Purpose Verified</p>
                        <p className="text-xs text-muted-foreground">Visitor confirmed their purpose and the person they're visiting is aware</p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gate Notes</p>
                    <Textarea
                      rows={2}
                      placeholder="Any observations, items declared, or additional notes..."
                      className="rounded-xl"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleCheckIn}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest gap-3"
                    disabled={processing || !identityConfirmed || !purposeConfirmed}
                  >
                    {processing ? "Checking In..." : "Approve & Check In"}
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {appointment.status === "checked_in" && (
              <Card className="border-2 border-emerald-200 bg-emerald-50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-800">Already Checked In</p>
                      <p className="text-sm text-emerald-700">
                        Checked in at {appointment.checked_in_at ? format(new Date(appointment.checked_in_at), "h:mm a") : "unknown time"}.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setGatePin(appointment.gate_pin || generatePin()); setShowGatePass(true); }}
                    variant="outline"
                    className="w-full gap-2 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    <Printer className="h-4 w-4" /> Print Gate Pass
                  </Button>
                </CardContent>
              </Card>
            )}

            {appointment.status === "completed" && (
              <Card className="border-2 border-slate-200 bg-slate-50">
                <CardContent className="p-5 flex items-start gap-3">
                  <Clock className="h-6 w-6 text-slate-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Visit Completed</p>
                    <p className="text-sm text-slate-500">This visit has already been completed.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(appointment.status === "cancelled" || appointment.status === "no_show") && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-5 flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                  <div>
                    <p className="font-bold text-red-700 capitalize">{appointment.status}</p>
                    <p className="text-sm text-red-600">This appointment is no longer active.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" onClick={() => { setQuery(""); setAppointment(null); setError(null); setGatePin(""); }} className="w-full">
              Clear & Scan Next Visitor
            </Button>
          </>
        )}
      </div>

      {appointment && (
        <ThermalGatePass
          open={showGatePass}
          onOpenChange={setShowGatePass}
          visitorName={appointment.visitor_name}
          hostName={appointment.host_name}
          purpose={appointment.purpose}
          gatePin={gatePin}
          checkedInAt={appointment.checked_in_at || new Date().toISOString()}
          appointmentId={appointment.id}
        />
      )}
    </DashboardLayout>
  );
}
