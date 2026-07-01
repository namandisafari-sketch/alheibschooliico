// @ts-nocheck
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, CheckCircle, Clock, Phone, Mail, Building, Download, Share2 } from "lucide-react";
import { format } from "date-fns";
import { uuidToShortId } from "@/lib/shortId";

export default function BookAppointment() {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [form, setForm] = useState({
    visitor_name: "",
    visitor_phone: "",
    visitor_email: "",
    purpose: "",
    host_name: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name.trim() || !form.visitor_phone.trim() || !form.purpose.trim() || !form.scheduled_date) {
      return;
    }
    setSubmitting(true);
    try {
      const scheduled_for = `${form.scheduled_date}T${form.scheduled_time || "10:00"}:00`;
      const res = await fetch("/api/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_name: form.visitor_name.trim(),
          visitor_phone: form.visitor_phone.trim(),
          purpose: form.purpose.trim(),
          host_name: form.host_name.trim() || null,
          scheduled_for,
          duration_minutes: 30,
          status: "scheduled",
          notes: form.notes.trim() || null,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      const data = result.data;
      const short_id = uuidToShortId(data.id);
      setAppointment({ ...data, short_id });
      setStep("success");
      fetch("/api/notify/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id,
          visitor_name: data.visitor_name,
          visitor_phone: data.visitor_phone,
          visitor_email: form.visitor_email || undefined,
          purpose: data.purpose,
          scheduled_for: data.scheduled_for,
          location: data.location || undefined,
          host_staff_name: data.host_name || undefined,
        }),
      }).catch(() => {});
    } catch (err: any) {
      alert(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `appointment-${appointment?.short_id || "qr"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareQR = async () => {
    if (!appointment) return;
    const url = `${window.location.origin}/track-appointment?id=${appointment.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Appointment Confirmation", text: `My appointment ID: ${appointment.short_id || uuidToShortId(appointment.id)}`, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight text-slate-900">TennaHub Technologies</p>
              <p className="text-[10px] text-slate-500 font-medium">Limited</p>
            </div>
          </div>
          <a href="tel:+256745368426" className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
            <Phone className="h-4 w-4" />
            +256 745 368 426
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          {step === "form" && (
            <Card className="border-2 border-slate-100 shadow-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <CalendarClock className="h-6 w-6 text-blue-300" />
                  <h1 className="text-xl font-black uppercase tracking-tight">Book a Visit</h1>
                </div>
                <p className="text-sm text-slate-300">
                  Schedule your visit to <strong>Alheib Mixed Day & Boarding School</strong>
                </p>
              </div>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name *</Label>
                    <Input
                      required
                      placeholder="Enter your full name"
                      className="h-11 rounded-xl border-2"
                      value={form.visitor_name}
                      onChange={(e) => update("visitor_name", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number *</Label>
                      <Input
                        required
                        placeholder="+256 700..."
                        className="h-11 rounded-xl border-2"
                        value={form.visitor_phone}
                        onChange={(e) => update("visitor_phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="h-11 rounded-xl border-2"
                        value={form.visitor_email}
                        onChange={(e) => update("visitor_email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purpose of Visit *</Label>
                    <Input
                      required
                      placeholder="e.g. Parent meeting, School tour, Official business"
                      className="h-11 rounded-xl border-2"
                      value={form.purpose}
                      onChange={(e) => update("purpose", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Person to Visit (Staff name)</Label>
                    <Input
                      placeholder="e.g. Mr. Kateregga"
                      className="h-11 rounded-xl border-2"
                      value={form.host_name}
                      onChange={(e) => update("host_name", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preferred Date *</Label>
                      <Input
                        required
                        type="date"
                        className="h-11 rounded-xl border-2"
                        value={form.scheduled_date}
                        onChange={(e) => update("scheduled_date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preferred Time</Label>
                      <Input
                        type="time"
                        className="h-11 rounded-xl border-2"
                        value={form.scheduled_time}
                        onChange={(e) => update("scheduled_time", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Additional Notes</Label>
                    <Textarea
                      rows={2}
                      placeholder="Any special requests or information"
                      className="rounded-xl border-2"
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>

                  <Separator />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-0.5 gap-3"
                    disabled={submitting}
                  >
                    {submitting ? "Booking..." : "Confirm Appointment"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    By booking, you agree to the school's visitor policy.
                    <br />
                    Powered by <strong>TennaHub Technologies Limited</strong>
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "success" && appointment && (
            <Card className="border-2 border-emerald-100 shadow-xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white text-center">
                <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-tight">Appointment Confirmed!</h1>
                <p className="text-sm text-emerald-100 mt-1">Save your QR code or ID for gate entry</p>
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col items-center gap-2" ref={qrRef}>
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
                    <QRCodeSVG
                      value={`${window.location.origin}/track-appointment?id=${appointment.id}`}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Scan at the gate for faster check-in
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Appointment ID</p>
                  <p className="text-2xl font-mono font-black tracking-widest text-slate-900 select-all">{appointment.short_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={downloadQR}
                    className="rounded-xl h-11 bg-slate-900 hover:bg-slate-800 gap-2"
                  >
                    <Download className="h-4 w-4" /> Save QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareQR}
                    className="rounded-xl h-11 gap-2"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visitor</span>
                    <span className="font-bold">{appointment.visitor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-bold">{format(new Date(appointment.scheduled_for), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-bold">{format(new Date(appointment.scheduled_for), "h:mm a")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose</span>
                    <span className="font-bold">{appointment.purpose}</span>
                  </div>
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground text-center">
                  Present your QR code or ID number at the gate for verification.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11"
                    onClick={() => navigate(`/track-appointment?id=${appointment.id}`)}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Track Status
                  </Button>
                  <Button
                    className="flex-1 rounded-xl h-11 bg-slate-900 hover:bg-slate-800"
                    onClick={() => { setStep("form"); setAppointment(null); setForm({ visitor_name: "", visitor_phone: "", visitor_email: "", purpose: "", host_name: "", scheduled_date: "", scheduled_time: "", notes: "" }); }}
                  >
                    Book Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} TennaHub Technologies Limited. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="tel:+256745368426" className="flex items-center gap-1 hover:text-slate-700">
              <Phone className="h-3 w-3" /> +256 745 368 426
            </a>
            <a href="mailto:info@tennahub.com" className="flex items-center gap-1 hover:text-slate-700">
              <Mail className="h-3 w-3" /> info@tennahub.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
