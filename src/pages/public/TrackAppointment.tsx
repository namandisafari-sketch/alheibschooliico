import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { uuidToShortId } from "@/lib/shortId";
import { CalendarClock, Building, Phone, Mail, Search, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, Star, Download, Share2, QrCode } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  checked_in: { label: "Checked In", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-700 border-slate-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  no_show: { label: "No Show", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
};

export default function TrackAppointment() {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const [query, setQuery] = useState(initialId);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (initialId) searchAppointment(initialId);
  }, [initialId]);

  const searchAppointment = async (val?: string) => {
    const search = (val || query).trim();
    if (!search) return;
    setLoading(true);
    setError(null);
    setAppointment(null);
    setReviewSubmitted(false);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
      let data: any = null;
      
      if (isUUID) {
        const { data: d, error: err } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", search)
          .maybeSingle();
        if (err) throw err;
        data = d;
      } else {
        const { data: all, error: err } = await supabase
          .from("appointments")
          .select("*")
          .gte("scheduled_for", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order("scheduled_for", { ascending: false })
          .limit(100);
        if (err) throw err;
        data = (all || []).find((a: any) => uuidToShortId(a.id) === search.toUpperCase()) || null;
      }
      
      if (!data) {
        setError("No appointment found with this ID. Please check and try again.");
        return;
      }
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || "Failed to look up appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || !appointment) return;
    setReviewSubmitting(true);
    try {
      const { error: err } = await supabase.from("appointment_reviews").insert({
        appointment_id: appointment.id,
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      if (err) throw err;
      setReviewSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
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
      a.download = `appointment-${appointment.short_id || "qr"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const StatusIcon = appointment ? statusConfig[appointment.status]?.icon || Clock : Clock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/book-appointment")} className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight text-slate-900">TennaHub Technologies</p>
              <p className="text-[10px] text-slate-500 font-medium">Limited</p>
            </div>
          </button>
          <a href="tel:+256745368426" className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
            <Phone className="h-4 w-4" />
            +256 745 368 426
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <Card className="border-2 border-slate-100 shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Search className="h-6 w-6 text-blue-300" />
                <h1 className="text-xl font-black uppercase tracking-tight">Track Appointment</h1>
              </div>
              <p className="text-sm text-slate-300">
                Enter your 6-character ID or scan the QR code
              </p>
            </div>

            <CardContent className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); searchAppointment(); }} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Appointment ID</Label>
                  <Input
                    placeholder="e.g. A3X7K9"
                    className="h-11 rounded-xl border-2 font-mono text-lg tracking-widest uppercase text-center"
                    value={query}
                    onChange={(e) => setQuery(e.target.value.toUpperCase())}
                    maxLength={36}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl gap-3"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Look Up Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-2 border-red-100 rounded-2xl bg-red-50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {appointment && (
            <>
              <Card className="border-2 border-slate-100 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-tight">Appointment</h2>
                    <Badge variant="outline" className={`${statusConfig[appointment.status]?.color || "bg-slate-100 text-slate-700"} border text-[10px] uppercase font-black tracking-wider`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[appointment.status]?.label || appointment.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col items-center gap-2" ref={qrRef}>
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-3">
                      <QRCodeSVG
                        value={`${window.location.origin}/track-appointment?id=${appointment.id}`}
                        size={160}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={downloadQR} className="gap-1 text-xs">
                      <Download className="h-3 w-3" /> Save QR
                    </Button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Appointment ID</p>
                    <p className="text-xl font-mono font-black tracking-widest text-slate-900 select-all">
                      {uuidToShortId(appointment.id)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visitor</p>
                      <p className="text-sm font-bold text-slate-900">{appointment.visitor_name}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                      <p className="text-sm font-bold text-slate-900">{appointment.visitor_phone || "—"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Purpose</p>
                    <p className="text-sm font-bold text-slate-900">{appointment.purpose}</p>
                  </div>

                  {appointment.host_name && (
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visiting</p>
                      <p className="text-sm font-bold text-slate-900">{appointment.host_name}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Scheduled Date</p>
                      <p className="text-sm font-bold text-slate-900">
                        {format(new Date(appointment.scheduled_for), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time</p>
                      <p className="text-sm font-bold text-slate-900">
                        {format(new Date(appointment.scheduled_for), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Notes</p>
                      <p className="text-sm text-slate-700">{appointment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-100 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <TimelineItem
                    icon={CalendarClock}
                    label="Appointment Booked"
                    time={appointment.created_at}
                    isFirst
                  />
                  <TimelineItem
                    icon={CheckCircle2}
                    label="Checked In"
                    time={appointment.checked_in_at || null}
                    isActive={appointment.status === "checked_in" || appointment.status === "completed"}
                  />
                  <TimelineItem
                    icon={CheckCircle2}
                    label="Completed"
                    time={appointment.completed_at || null}
                    isActive={appointment.status === "completed"}
                    isLast
                  />
                </CardContent>
              </Card>

              {/* Review */}
              {!reviewSubmitted && (
                <Card className="border-2 border-slate-100 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <Star className="h-4 w-4" /> Leave a Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                            star <= reviewRating
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-100 text-slate-300"
                          }`}
                        >
                          <Star className="h-5 w-5" fill={star <= reviewRating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Share your experience..."
                      className="rounded-xl border-2"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                    <Button
                      onClick={handleSubmitReview}
                      className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800"
                      disabled={reviewSubmitting || !reviewText.trim()}
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {reviewSubmitted && (
                <Card className="border-2 border-emerald-100 rounded-2xl bg-emerald-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 font-bold">Thank you for your feedback!</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-11"
                  onClick={() => navigate("/book-appointment")}
                >
                  <ArrowRight className="h-4 w-4 mr-2" /> Book Another
                </Button>
              </div>
            </>
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

function TimelineItem({
  icon: Icon,
  label,
  time,
  isFirst,
  isLast,
  isActive,
}: {
  icon: any;
  label: string;
  time: string | null;
  isFirst?: boolean;
  isLast?: boolean;
  isActive?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
          time || isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300"
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {time ? (
          <p className="text-xs text-slate-500">{format(new Date(time), "MMM d, yyyy h:mm a")}</p>
        ) : (
          <p className="text-xs text-slate-400 italic">Pending</p>
        )}
      </div>
    </div>
  );
}
