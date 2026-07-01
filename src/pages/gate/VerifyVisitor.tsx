import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, User, CheckCircle, AlertCircle, Camera, ScanLine,
  ShieldCheck, MapPin, Phone, Calendar, Hash, BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { parsePDF417Barcode, parseStudentScanPayload } from "@/lib/studentScan";

const VerifyVisitor = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [visitor, setVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanSource, setScanSource] = useState<"manual" | "pdf417" | "qr" | null>(null);
  const [autoLogged, setAutoLogged] = useState(false);
  const [restriction, setRestriction] = useState<string | null>(null);

  const checkRestrictions = async (student: any): Promise<string | null> => {
    const pupilStatus = (student.pupil_status || student.status || "").toLowerCase();
    if (pupilStatus && pupilStatus !== "active") {
      return `Student status is "${student.pupil_status || student.status}". Entry not allowed.`;
    }

    const todayStart = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("student_gate_logs")
      .select("id, check_in_at")
      .eq("learner_id", student.id)
      .eq("status", "checked_in")
      .gte("check_in_at", todayStart)
      .limit(1);

    if (existing && existing.length > 0) {
      return `Already checked in today at ${format(new Date(existing[0].check_in_at), "HH:mm")}.`;
    }

    return null;
  };

  const doCheckIn = async (student: any, source: "manual" | "pdf417" | "qr") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("student_gate_logs").insert({
      learner_id: student.id,
      status: "checked_in",
      verification_method: source,
      verified_by: user?.id,
    });
    if (error) throw error;
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      toast({ title: "Error", description: "Please scan a student ID card or enter admission number", variant: "destructive" });
      return;
    }

    setLoading(true);
    setVisitor(null);
    setScanSource(null);
    setAutoLogged(false);
    setRestriction(null);

    try {
      const raw = query.trim();
      let foundStudent: any = null;
      let source: "manual" | "pdf417" | "qr" = "manual";

      const pdf417 = parsePDF417Barcode(raw);
      if (pdf417) {
        const { data } = await supabase
          .from("learners")
          .select("*, classes(name)")
          .eq("id", pdf417.studentId)
          .maybeSingle();
        if (data) {
          foundStudent = data;
          source = "pdf417";
        }
      }

      if (!foundStudent) {
        const scan = parseStudentScanPayload(raw);
        if (scan.studentId) {
          const { data } = await supabase
            .from("learners")
            .select("*, classes(name)")
            .eq("id", scan.studentId)
            .maybeSingle();
          if (data) {
            foundStudent = data;
            source = "qr";
          }
        }
      }

      if (!foundStudent) {
        const { data } = await supabase
          .from("learners")
          .select("*, classes(name)")
          .eq("admission_number", raw)
          .maybeSingle();
        if (data) {
          foundStudent = data;
          source = "manual";
        }
      }

      if (!foundStudent) {
        const cleanQuery = raw.toLowerCase().trim();
        const { data: byName } = await supabase
          .from("learners")
          .select("*, classes(name)")
          .ilike("full_name", `%${cleanQuery}%`)
          .limit(5);

        if (byName && byName.length === 1) {
          foundStudent = byName[0];
          source = "manual";
        } else if (byName && byName.length > 1) {
          toast({
            title: "Multiple Matches",
            description: `Found ${byName.length} students matching "${raw}". Use admission number for exact match.`,
            variant: "default",
          });
          return;
        }
      }

      if (!foundStudent) {
        toast({
          title: "Not Found",
          description: `No student found matching "${raw}". Verify the ID card or admission number.`,
          variant: "destructive",
        });
        return;
      }

      setScanSource(source);
      setVisitor(foundStudent);

      const msg = await checkRestrictions(foundStudent);
      if (msg) {
        setRestriction(msg);
        return;
      }

      await doCheckIn(foundStudent, source);
      setAutoLogged(true);
      toast({
        title: "Auto Checked In",
        description: `${foundStudent.full_name} has been automatically logged at the gate.`,
      });
    } catch (err: any) {
      toast({ title: "Auto Check-in Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getVerificationBadge = () => {
    if (restriction) {
      return { label: "Entry Blocked", variant: "bg-red-600" as const, desc: restriction };
    }
    if (autoLogged) {
      return { label: "Auto Checked In", variant: "bg-emerald-600" as const, desc: "Student automatically logged at the gate" };
    }
    switch (scanSource) {
      case "pdf417":
        return { label: "ID Card Scanned", variant: "bg-emerald-600" as const, desc: "Verified via PDF417 barcode" };
      case "qr":
        return { label: "QR Code Scanned", variant: "bg-blue-600" as const, desc: "Verified via student QR code" };
      default:
        return { label: "Manual Entry", variant: "bg-amber-600" as const, desc: "Admission number lookup" };
    }
  };

  const badge = visitor ? getVerificationBadge() : null;

  return (
    <DashboardLayout title="Student Identity Verification" subtitle="Scan student ID card barcode at the gate">
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              Scan Student ID Card
            </CardTitle>
            <CardDescription>
              Use the handheld barcode scanner on the PDF417 barcode on the student ID card, or type admission number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(search);
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ScanLine className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <Input
                    placeholder='Scan barcode or type admission number (e.g., ADM/25/0001)...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-12 text-base font-mono tracking-wider rounded-xl border-2"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <Button type="submit" disabled={loading} className="gap-2 px-6 rounded-xl h-12" size="lg">
                  <Search className="h-4 w-4" />
                  {loading ? "Searching..." : "Verify"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Point the barcode scanner at the PDF417 barcode on the back of the student ID card — it scans automatically
              </p>
            </form>
          </CardContent>
        </Card>

        {visitor && (
          <Card className="border-2 border-emerald-200 bg-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-6 flex items-center gap-6">
              <div className="h-36 w-32 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shrink-0 shadow-lg">
                {visitor.photo_url ? (
                  <img src={visitor.photo_url} alt={visitor.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-12 w-12 text-slate-700" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge className={`${badge!.variant} text-white mb-2 uppercase text-[9px] font-black tracking-widest`}>
                  {badge!.label}
                </Badge>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1 truncate">
                  {visitor.full_name}
                </h3>
                <p className="text-blue-400 font-mono text-sm font-bold uppercase tracking-tighter">
                  ADM: {visitor.admission_number || "—"}
                </p>
                <div className="flex gap-4 mt-3 flex-wrap">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Class</p>
                    <p className="text-white font-bold uppercase">{visitor.classes?.name || visitor.class_name || "N/A"}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-slate-800" />
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gender</p>
                    <p className="text-white font-bold uppercase">{visitor.gender || "—"}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-slate-800" />
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Age</p>
                    <p className="text-white font-bold uppercase">
                      {visitor.date_of_birth ? `${calculateAge(visitor.date_of_birth)} years` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date of Birth
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {visitor.date_of_birth ? format(new Date(visitor.date_of_birth), "dd MMM yyyy") : "—"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Status
                  </p>
                  <p className="text-sm font-black text-slate-900 uppercase">
                    {visitor.pupil_status || visitor.status || "Active"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Guardian Contact
                  </p>
                  <p className="text-sm font-black text-slate-900 uppercase">{visitor.guardian_name || visitor.parent_name || "—"}</p>
                  <p className="text-xs font-bold text-slate-500">{visitor.guardian_phone || visitor.parent_phone || "—"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Admission No.
                  </p>
                  <p className="text-sm font-black text-slate-900 font-mono">{visitor.admission_number || "—"}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Home Location</p>
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-tight">
                      {[visitor.village, visitor.parish, visitor.sub_county, visitor.district]
                        .filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </div>
                {scanSource === "pdf417" && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Verification Details</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p><span className="font-bold text-slate-500">Source:</span> {badge!.desc}</p>
                  <p><span className="font-bold text-slate-500">Student ID:</span> <span className="font-mono text-[10px]">{visitor.id}</span></p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              {restriction ? (
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl h-11 text-base font-semibold shadow-lg shadow-red-200"
                  onClick={() => { setSearch(""); setVisitor(null); setRestriction(null); }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" /> Clear & Scan Next
                </Button>
              ) : autoLogged ? (
                <>
                  <Button
                    className="flex-1 bg-slate-600 rounded-xl h-11 text-base font-semibold"
                    disabled
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Already Checked In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setSearch(""); setVisitor(null); setAutoLogged(false); }}
                    className="flex-1 rounded-xl h-11 text-base"
                  >
                    Clear & Scan Next
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 text-base font-semibold shadow-lg shadow-emerald-200"
                    onClick={async () => {
                      try {
                        await doCheckIn(visitor, scanSource || "manual");
                        toast({
                          title: "Student Checked In",
                          description: `${visitor.full_name} has been verified and logged at the gate.`,
                        });
                      } catch (err: any) {
                        toast({ title: "Check-in Failed", description: err.message, variant: "destructive" });
                      }
                      setSearch("");
                      setVisitor(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Verified & Allow Entry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setSearch(""); setVisitor(null); }}
                    className="flex-1 rounded-xl h-11 text-base"
                  >
                    Clear & Scan Next
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {!visitor && search && !loading && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-start gap-4">
              <AlertCircle className="h-8 w-8 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700">Student Not Found</p>
                <p className="text-sm text-red-600 mt-1">
                  No student found matching "{search}". Check the ID card barcode or admission number and try again.
                </p>
                {search.includes(";") && (
                  <p className="text-xs text-red-500 mt-2 font-mono">
                    PDF417 barcode detected but student UUID not found in the system. The ID card may not be registered.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {visitor && restriction && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-start gap-4">
              <AlertCircle className="h-8 w-8 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700">Entry Blocked</p>
                <p className="text-sm text-red-600 mt-1">{restriction}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!visitor && !search && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center text-slate-500 py-16">
              <Camera className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="font-semibold text-lg">Scan Student ID Card</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                Point the barcode scanner at the PDF417 2D barcode on the student ID card.
                The system will automatically decode it and display full student details.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Verification Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>1. Point the handheld scanner at the <strong>PDF417 barcode</strong> on the student ID card</p>
            <p>2. System decodes the barcode and looks up the student in the database</p>
            <p>3. If the student is <strong>active</strong> and not already checked in, entry is <strong>logged automatically</strong></p>
            <p>4. Verify the student&apos;s <strong>photo</strong> matches the person at the gate</p>
            <p>5. Confirm <strong>identity details</strong> (name, class, admission number)</p>
            <p>6. Click <strong>"Clear & Scan Next"</strong> for the next student</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VerifyVisitor;
