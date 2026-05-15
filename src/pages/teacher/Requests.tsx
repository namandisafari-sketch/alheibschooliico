// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, Wallet, Printer, FileText, Eye } from "lucide-react";
import { StaffSearchSelect } from "@/components/shared/StaffSearchSelect";
import "@/styles/print.css";

const leaveTypes = [
  { v: "annual", label: "Annual Leave" },
  { v: "emergency", label: "Emergency Leave" },
  { v: "maternity", label: "Maternity Leave" },
  { v: "sick", label: "Sick Leave" },
  { v: "other", label: "Other" },
];

const calcDays = (s: string, e: string) => {
  if (!s || !e) return 0;
  const a = new Date(s), b = new Date(e);
  return Math.max(1, Math.round((+b - +a) / 86400000) + 1);
};

const TeacherRequests = () => {
  const { user, profile, role } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"leave" | "advance">("leave");
  const [printRow, setPrintRow] = useState<any>(null);

  const { data: leaves = [] } = useQuery({
    queryKey: ["my-leaves", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("leave_requests" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });
  const { data: advances = [] } = useQuery({
    queryKey: ["my-advances", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("advance_requests" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Pre-load profile fields for the form
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, department, position").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMe(data));
  }, [user?.id]);

  // ===== Leave form state (mirrors Alheib paper form) =====
  const [f, setF] = useState({
    employee_full_name: "",
    employee_department: "",
    employee_position: "",
    employee_phone: "",
    leave_type: "annual",
    leave_type_other: "",
    start_date: "",
    end_date: "",
    reason: "",
    employee_signature_name: "",
    covering_staff_name: "",
    covering_staff_position: "",
    covering_staff_job_title: "",
    covering_staff_department: "",
    responsibilities_summary: "",
    covering_staff_signature_name: "",
  });

  useEffect(() => {
    if (!me) return;
    setF((p) => ({
      ...p,
      employee_full_name: p.employee_full_name || me.full_name || "",
      employee_department: p.employee_department || me.department || "",
      employee_position: p.employee_position || me.position || "",
      employee_phone: p.employee_phone || me.phone || "",
      employee_signature_name: p.employee_signature_name || me.full_name || "",
    }));
  }, [me]);

  const days = useMemo(() => calcDays(f.start_date, f.end_date), [f.start_date, f.end_date]);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const required = [
      ["employee_full_name", "Full Name"],
      ["employee_department", "Department"],
      ["employee_position", "Position / Job Title"],
      ["employee_phone", "Phone Number"],
      ["start_date", "Leave Start Date"],
      ["end_date", "Leave End Date"],
      ["reason", "Reason for Leave"],
      ["employee_signature_name", "Employee Signature Name"],
      ["covering_staff_name", "Covering Staff Name"],
      ["responsibilities_summary", "Summary of Responsibilities"],
      ["covering_staff_signature_name", "Covering Staff Signature Name"],
    ];
    for (const [k, label] of required) {
      if (!String(f[k] || "").trim()) {
        toast({ title: "Missing field", description: label, variant: "destructive" });
        return false;
      }
    }
    if (new Date(f.end_date) < new Date(f.start_date)) {
      toast({ title: "Invalid dates", description: "End date must be after start date", variant: "destructive" });
      return false;
    }
    return true;
  };

  const submitLeave = async () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("leave_requests" as any).insert({
      user_id: user!.id,
      leave_type: f.leave_type,
      leave_type_other: f.leave_type === "other" ? f.leave_type_other : null,
      start_date: f.start_date,
      end_date: f.end_date,
      days_count: days,
      reason: f.reason,
      employee_full_name: f.employee_full_name,
      employee_department: f.employee_department,
      employee_position: f.employee_position,
      employee_phone: f.employee_phone,
      employee_signature_name: f.employee_signature_name,
      employee_signed_at: now,
      covering_staff_name: f.covering_staff_name,
      covering_staff_position: f.covering_staff_position,
      covering_staff_job_title: f.covering_staff_job_title,
      covering_staff_department: f.covering_staff_department,
      responsibilities_summary: f.responsibilities_summary,
      covering_staff_signature_name: f.covering_staff_signature_name,
      covering_staff_signed_at: now,
    }).select().single();
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Leave request submitted", description: `Reference: ${data?.form_ref || "saved"}` });
    setF((p) => ({ ...p, reason: "", responsibilities_summary: "" }));
    qc.invalidateQueries({ queryKey: ["my-leaves"] });
    setPrintRow(data);
  };

  // ===== advance state (unchanged minimal) =====
  const [amount, setAmount] = useState("");
  const [advReason, setAdvReason] = useState("");
  const [plan, setPlan] = useState("");
  const submitAdv = async () => {
    const num = parseFloat(amount);
    if (!num || !advReason.trim()) return;
    const { error } = await supabase.from("advance_requests" as any).insert({
      user_id: user!.id, amount: num, reason: advReason, repayment_plan: plan,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Advance requested" }); setAmount(""); setAdvReason(""); qc.invalidateQueries({ queryKey: ["my-advances"] }); }
  };

  return (
    <DashboardLayout title="My Requests" subtitle="Official Alheib leave + salary advance forms">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={tab === "leave" ? "default" : "outline"} onClick={() => setTab("leave")}>
            <CalendarDays className="h-4 w-4 mr-1" />Leave Request
          </Button>
          <Button variant={tab === "advance" ? "default" : "outline"} onClick={() => setTab("advance")}>
            <Wallet className="h-4 w-4 mr-1" />Salary Advance
          </Button>
        </div>

        {tab === "leave" ? (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="border-b pb-3">
                <h2 className="font-black text-lg">ALHEIB STAFF LEAVE REQUEST FORM</h2>
                <p className="text-xs text-muted-foreground">Fill, submit, then print the official copy for filing. All workflow remains digital.</p>
              </div>

              {/* Employee Information */}
              <Section title="EMPLOYEE INFORMATION">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Full Name *">
                    <StaffSearchSelect
                      value={f.employee_full_name}
                      onSelect={(name, s) => setF((p) => ({
                        ...p,
                        employee_full_name: name,
                        employee_department: s?.department || p.employee_department,
                        employee_position: s?.position || p.employee_position,
                        employee_phone: s?.phone || p.employee_phone,
                        employee_signature_name: name,
                      }))}
                      placeholder="Search staff by name…"
                    />
                  </Field>
                  <Field label="Department *"><Input value={f.employee_department} onChange={(e) => set("employee_department", e.target.value)} /></Field>
                  <Field label="Position / Job Title *"><Input value={f.employee_position} onChange={(e) => set("employee_position", e.target.value)} /></Field>
                  <Field label="Phone Number *"><Input value={f.employee_phone} onChange={(e) => set("employee_phone", e.target.value)} /></Field>
                </div>
              </Section>

              {/* Leave Details */}
              <Section title="1. LEAVE DETAILS">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Type of Leave *">
                    <Select value={f.leave_type} onValueChange={(v) => set("leave_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  {f.leave_type === "other" && (
                    <Field label="Specify Other"><Input value={f.leave_type_other} onChange={(e) => set("leave_type_other", e.target.value)} /></Field>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  <Field label="Leave Start Date *"><Input type="date" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
                  <Field label="Leave End Date *"><Input type="date" value={f.end_date} onChange={(e) => set("end_date", e.target.value)} /></Field>
                  <Field label="Days"><Input value={days || ""} readOnly className="bg-muted" /></Field>
                </div>
                <Field label="2. Reason for Leave *" className="mt-3">
                  <Textarea rows={3} value={f.reason} onChange={(e) => set("reason", e.target.value)} />
                </Field>
              </Section>

              {/* Employee Declaration */}
              <Section title="3. DECLARATION BY EMPLOYEE">
                <p className="text-sm text-muted-foreground mb-2">
                  I hereby confirm that the above information is true and accurate, and I agree to comply with the organisation's leave policy.
                </p>
                <Field label="Employee Signature (type or pick name) *">
                  <StaffSearchSelect
                    value={f.employee_signature_name}
                    onSelect={(name) => set("employee_signature_name", name)}
                    placeholder="Pick employee name…"
                  />
                </Field>
              </Section>

              {/* Handover */}
              <Section title="4. HANDOVER / ASSIGNED RESPONSIBILITY">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Name of Staff Covering Duties *">
                    <StaffSearchSelect
                      value={f.covering_staff_name}
                      onSelect={(name, s) => setF((p) => ({
                        ...p,
                        covering_staff_name: name,
                        covering_staff_position: s?.position || p.covering_staff_position,
                        covering_staff_department: s?.department || p.covering_staff_department,
                        covering_staff_signature_name: name,
                      }))}
                      placeholder="Search covering staff…"
                    />
                  </Field>
                  <Field label="Position"><Input value={f.covering_staff_position} onChange={(e) => set("covering_staff_position", e.target.value)} /></Field>
                  <Field label="Job Title"><Input value={f.covering_staff_job_title} onChange={(e) => set("covering_staff_job_title", e.target.value)} /></Field>
                  <Field label="Department"><Input value={f.covering_staff_department} onChange={(e) => set("covering_staff_department", e.target.value)} /></Field>
                </div>
                <Field label="5. Summary of Responsibilities to be Covered *" className="mt-3">
                  <Textarea rows={3} value={f.responsibilities_summary} onChange={(e) => set("responsibilities_summary", e.target.value)} />
                </Field>
              </Section>

              {/* Covering staff declaration */}
              <Section title="6. DECLARATION BY COVERING STAFF">
                <p className="text-sm text-muted-foreground mb-2">
                  I hereby agree to take on the responsibilities assigned to me during the absence of the above-mentioned staff member. I confirm that I understand the duties delegated to me and commit to them responsibly and in accordance with school policies.
                </p>
                <Field label="Covering Staff Signature (pick name) *">
                  <StaffSearchSelect
                    value={f.covering_staff_signature_name}
                    onSelect={(name) => set("covering_staff_signature_name", name)}
                    placeholder="Pick covering staff name…"
                  />
                </Field>
              </Section>

              <div className="flex gap-2 justify-end pt-2">
                <Button onClick={submitLeave}>
                  <FileText className="h-4 w-4 mr-1" />Submit & Generate Official Copy
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-2">My leave history</h4>
                <div className="space-y-2">
                  {leaves.map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center border rounded-lg p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{l.form_ref || "—"}</p>
                        <p>{l.leave_type} · {l.start_date} → {l.end_date} {l.days_count ? `(${l.days_count}d)` : ""}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>{l.status}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => setPrintRow(l)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!leaves.length && <p className="text-sm text-muted-foreground">No requests yet.</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold">New advance request</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Amount (UGX)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div><Label>Repayment plan</Label><Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. deduct from next 2 salaries" /></div>
              </div>
              <div><Label>Reason</Label><Textarea value={advReason} onChange={(e) => setAdvReason(e.target.value)} rows={3} /></div>
              <Button onClick={submitAdv}>Submit</Button>

              <div className="border-t pt-4">
                <h4 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-2">My advance history</h4>
                <div className="space-y-2">
                  {advances.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center border rounded-lg p-3 text-sm">
                      <span>UGX {Number(a.amount).toLocaleString()} · {a.reason?.slice(0, 40)}</span>
                      <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
                    </div>
                  ))}
                  {!advances.length && <p className="text-sm text-muted-foreground">No requests yet.</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print preview dialog */}
      <Dialog open={!!printRow} onOpenChange={(o) => !o && setPrintRow(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b print:hidden">
            <DialogTitle>Official Leave Request — {printRow?.form_ref}</DialogTitle>
          </DialogHeader>
          {printRow && <PrintableLeaveForm row={printRow} />}
          <DialogFooter className="p-4 border-t print:hidden">
            <Button variant="outline" onClick={() => setPrintRow(null)}>Close</Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const Section = ({ title, children }: any) => (
  <div className="space-y-2">
    <p className="text-xs font-black uppercase tracking-widest text-primary">{title}</p>
    {children}
  </div>
);
const Field = ({ label, children, className = "" }: any) => (
  <div className={className}>
    <Label className="text-xs">{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

// =====================================================================
// Printable form — mirrors the paper Alheib leave request form
// =====================================================================
const Line = ({ label, value, w = "auto" }: any) => (
  <div className="flex items-end gap-1" style={{ flex: w === "auto" ? 1 : "none", width: w }}>
    <span className="font-semibold whitespace-nowrap">{label}</span>
    <span className="flex-1 border-b border-dotted border-slate-700 px-1 min-h-[1.2em]">{value || ""}</span>
  </div>
);

const Checkbox = ({ checked, label }: any) => (
  <span className="inline-flex items-center gap-1 mr-3">
    <span className="inline-block w-3 h-3 border border-slate-800 align-middle text-center text-[10px] leading-3">
      {checked ? "✓" : ""}
    </span>
    <span>{label}</span>
  </span>
);

const PrintableLeaveForm = ({ row }: { row: any }) => {
  const t = row.leave_type;
  return (
    <div className="print-form max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-black tracking-wide">ALHEIB SOCIAL WELFARE CENTRE</h1>
        <p className="text-sm">P.O BOX 2891, KAMPALA</p>
        <h2 className="mt-3 text-base font-black underline">ALHEIB STAFF LEAVE REQUEST FORM</h2>
        <p className="text-[10pt] mt-1">Reference: <strong>{row.form_ref}</strong></p>
      </div>

      {/* Employee Information */}
      <p className="font-bold mt-3 mb-1">EMPLOYEE INFORMATION</p>
      <ul className="space-y-1.5 ml-4">
        <li><Line label="Full Name:" value={row.employee_full_name} /></li>
        <li className="flex gap-4">
          <Line label="Department:" value={row.employee_department} />
          <Line label="Position/Job Title:" value={row.employee_position} />
        </li>
        <li><Line label="Phone Number:" value={row.employee_phone} /></li>
      </ul>

      {/* Leave Details */}
      <p className="font-bold mt-4 mb-1">1. LEAVE DETAILS</p>
      <div className="ml-4 space-y-1.5">
        <div>
          <span className="font-semibold mr-2">Type of Leave (Tick one):</span>
          <Checkbox checked={t === "annual"} label="Annual Leave" />
          <Checkbox checked={t === "emergency"} label="Emergency Leave" />
          <Checkbox checked={t === "maternity"} label="Maternity Leave" />
          <Checkbox checked={t === "other"} label={`Other${row.leave_type_other ? `: ${row.leave_type_other}` : ""}`} />
        </div>
        <div className="flex gap-4">
          <Line label="Leave Start Date:" value={row.start_date} />
          <Line label="Leave End Date:" value={row.end_date} />
          <Line label="Days ( ):" value={row.days_count} w="120px" />
        </div>
      </div>

      <p className="font-bold mt-3 mb-1">2. REASON FOR LEAVE</p>
      <p className="ml-4 border-b border-dotted border-slate-700 min-h-[3em] whitespace-pre-wrap">{row.reason}</p>

      {/* Declaration by Employee */}
      <p className="font-bold mt-4 mb-1">3. DECLARATION BY EMPLOYEE</p>
      <p className="ml-4 italic">
        I hereby confirm that the above information is true and accurate, and I agree to comply with the organisation's leave policy.
      </p>
      <div className="ml-4 flex gap-4 mt-2">
        <Line label="Employee Signature:" value={row.employee_signature_name} />
        <Line label="Date:" value={row.employee_signed_at ? new Date(row.employee_signed_at).toLocaleDateString() : ""} w="180px" />
      </div>

      {/* Handover */}
      <p className="font-bold mt-4 mb-1">4. HANDOVER / ASSIGNED RESPONSIBILITY</p>
      <ul className="ml-4 space-y-1.5">
        <li><Line label="Name of Staff Covering Duties:" value={row.covering_staff_name} /></li>
        <li className="flex gap-4">
          <Line label="Position:" value={row.covering_staff_position} />
          <Line label="Job Title:" value={row.covering_staff_job_title} />
        </li>
        <li><Line label="Department:" value={row.covering_staff_department} /></li>
      </ul>

      <p className="font-bold mt-3 mb-1">5. SUMMARY OF RESPONSIBILITIES TO BE COVERED:</p>
      <p className="ml-4 border-b border-dotted border-slate-700 min-h-[3em] whitespace-pre-wrap">{row.responsibilities_summary}</p>

      {/* Declaration by Covering Staff */}
      <p className="font-bold mt-4 mb-1">6. DECLARATION BY COVERING STAFF</p>
      <p className="ml-4 italic">
        I hereby agree to take on the responsibilities assigned to me during the absence of the above-mentioned staff member.
        I confirm that I understand the duties delegated to me and commit to them responsibly and in accordance with school policies.
      </p>
      <div className="ml-4 flex gap-4 mt-2">
        <Line label="Signature:" value={row.covering_staff_signature_name} />
        <Line label="Date:" value={row.covering_staff_signed_at ? new Date(row.covering_staff_signed_at).toLocaleDateString() : ""} w="180px" />
      </div>

      {/* For Official Use Only */}
      <p className="font-bold mt-5 mb-1 underline">FOR OFFICIAL USE ONLY</p>

      <p className="font-semibold mt-2">Supervisor / Head of Department</p>
      <ul className="ml-4 space-y-1.5">
        <li className="flex gap-4">
          <Line label="Name:" value={row.supervisor_name} />
          <span><Checkbox checked={row.supervisor_decision === "approved"} label="Approved" /><Checkbox checked={row.supervisor_decision === "not_approved"} label="Not Approved" /></span>
        </li>
        <li className="flex gap-4">
          <Line label="Signature:" value={row.supervisor_name} />
          <Line label="Date:" value={row.supervisor_signed_at ? new Date(row.supervisor_signed_at).toLocaleDateString() : ""} w="180px" />
        </li>
      </ul>

      <p className="font-semibold mt-3">Administration</p>
      <ul className="ml-4 space-y-1.5">
        <li className="flex gap-4">
          <Line label="Name:" value={row.admin_name} />
          <span><Checkbox checked={row.admin_decision === "approved"} label="Approved" /><Checkbox checked={row.admin_decision === "not_approved"} label="Not Approved" /></span>
        </li>
        <li className="flex gap-4">
          <Line label="Signature:" value={row.admin_name} />
          <Line label="Date:" value={row.admin_signed_at ? new Date(row.admin_signed_at).toLocaleDateString() : ""} w="180px" />
        </li>
        <li><Line label="Comments:" value={row.admin_comments} /></li>
      </ul>
    </div>
  );
};

export default TeacherRequests;
