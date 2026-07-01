// @ts-nocheck
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCheck, Phone, AlertTriangle, CheckCircle2, Clock, Search, X, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export default function HostVerification() {
  const { user } = useAuth();
  const [pinInput, setPinInput] = useState("");
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const pin = pinInput.trim();
    if (!pin || pin.length !== 4) {
      setError("Please enter a valid 4-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    setVisit(null);
    try {
      const { data, error: err } = await supabase
        .from("appointments")
        .select("*")
        .eq("gate_pin", pin)
        .eq("status", "checked_in")
        .maybeSingle();
      if (err) throw err;
      if (!data) {
        setError("No active visitor found with this PIN. It may have expired or been completed.");
        return;
      }
      setVisit(data);
    } catch (err: any) {
      setError(err.message || "Failed to look up PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVisit = async () => {
    if (!visit) return;
    setConfirming(true);
    try {
      const { error: err } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          host_verified_at: new Date().toISOString(),
          host_verified_by: user?.id || null,
        })
        .eq("id", visit.id);
      if (err) throw err;
      toast({ title: "Visit confirmed", description: `You have confirmed ${visit.visitor_name}'s visit.` });
      setVisit({ ...visit, status: "completed", host_verified_at: new Date().toISOString() });
      fetch("/api/notify/appointment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_name: visit.visitor_name,
          visitor_phone: visit.visitor_phone,
          visitor_email: visit.visitor_email,
          purpose: visit.purpose,
          scheduled_for: visit.scheduled_for,
          host_name: visit.host_name,
          location: visit.location,
          newStatus: "completed",
          changedBy: user?.email || "Host",
        }),
      }).catch(() => {});
    } catch (err: any) {
      toast({ title: "Confirmation failed", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const handleClear = () => {
    setPinInput("");
    setVisit(null);
    setError(null);
  };

  return (
    <DashboardLayout
      title="Host Verification"
      subtitle="Enter the 4-digit PIN from the visitor's gate pass to verify their visit"
    >
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Enter Gate PIN
            </CardTitle>
            <CardDescription>
              Ask the visitor for the 4-digit PIN printed on their gate pass
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="0000"
                className="font-mono text-2xl tracking-[0.5em] text-center flex-1"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
              />
              <Button onClick={handleLookup} disabled={loading || pinInput.length !== 4} className="gap-2 px-6">
                <Search className="h-4 w-4" /> {loading ? "..." : "Find"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes("gate_pin") && (
                  <p className="text-xs text-red-500 mt-1">
                    The gate_pin column may not exist in the database yet. Please ask an administrator to add it.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {visit && (
          <>
            <Card className={`border-2 overflow-hidden ${visit.status === "completed" ? "border-slate-200" : "border-blue-200"}`}>
              <div className={`p-4 text-white ${visit.status === "completed" ? "bg-slate-600" : "bg-blue-600"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Visit</p>
                  <Badge variant="outline" className="border-0 bg-white/20 text-white text-[10px] uppercase font-black">
                    {visit.status === "completed" ? "Completed" : "Checked In"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visitor</p>
                    <p className="font-bold text-lg">{visit.visitor_name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                    <p className="font-bold flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {visit.visitor_phone || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purpose</p>
                  <p className="font-bold">{visit.purpose}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Host / Visiting</p>
                  <p className="font-bold">{visit.host_name || "—"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checked In At</p>
                    <p className="font-bold">{visit.checked_in_at ? format(new Date(visit.checked_in_at), "h:mm a") : "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p>
                    <p className="font-bold">{visit.checked_in_at ? format(new Date(visit.checked_in_at), "MMM d") : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {visit.status === "checked_in" && (
              <Card className="border-2 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                    <UserCheck className="h-5 w-5" /> Confirm This Visit
                  </CardTitle>
                  <CardDescription>
                    Verify that {visit.visitor_name} is here to see you and confirm their visit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleConfirmVisit}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest gap-3"
                    disabled={confirming}
                  >
                    {confirming ? "Confirming..." : "Confirm Visit"}
                    <ThumbsUp className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {visit.status === "completed" && (
              <Card className="border-2 border-slate-200 bg-slate-50">
                <CardContent className="p-5 flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-slate-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Visit Already Confirmed</p>
                    <p className="text-sm text-slate-500">
                      This visit has been verified by the host.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" onClick={handleClear} className="w-full gap-2">
              <X className="h-4 w-4" /> Clear & Verify Another
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
