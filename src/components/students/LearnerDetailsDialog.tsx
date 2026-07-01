// @ts-nocheck

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  Wallet,
  ClipboardCheck,
  IdCard,
  Shield,
  School,
  HeartPulse,
  Globe,
  Users,
  FileText,
  Building2,
  Hash,
  Hand,
  Award,
  Badge
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLearnerDossier, DossierFilter } from "@/hooks/useLearnerDossier";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { PackageOpen, Clock, AlertCircle, History as HistoryIcon, Loader2, Scale, Printer, Pencil } from "lucide-react";
import { formatUGX } from "@/hooks/useFees";
import { EditLearnerDialog } from "./EditLearnerDialog";

interface LearnerDetailsDialogProps {
  student: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LearnerDetailsDialog({ student: basicStudent, open, onOpenChange }: LearnerDetailsDialogProps) {
  const { data: academicSettings } = useAcademicSettings();
  const [selectedYear, setSelectedYear] = useState<string>(String(academicSettings?.current_year || new Date().getFullYear()));
  const [selectedTerm, setSelectedTerm] = useState<string>(academicSettings?.current_term_id || "term_1");
  const [filterAll, setFilterAll] = useState(false);

  const filter: DossierFilter | undefined = filterAll ? undefined : {
    academicYear: parseInt(selectedYear),
    termId: selectedTerm,
  };

  const { data: dossier, isLoading } = useLearnerDossier(open ? basicStudent?.id : undefined, filter);
  const [showEdit, setShowEdit] = useState(false);

  if (!basicStudent) return null;
  const student = dossier?.learner || basicStudent;

  const availableYears = dossier?.learner?.enrollment_date
    ? Array.from({ length: new Date().getFullYear() - new Date(dossier.learner.enrollment_date).getFullYear() + 1 }, (_, i) =>
        String(new Date(dossier.learner.enrollment_date).getFullYear() + i))
    : [String(new Date().getFullYear())];

  const termLabel = (t: string) => {
    const map: Record<string, string> = { term_1: "Term I", term_2: "Term II", term_3: "Term III" };
    return map[t] || t;
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const fmt = (d: any) => d && !isNaN(new Date(d).getTime()) ? format(new Date(d), "PPP") : "—";
    const a = dossier?.attendance || [];
    const ms = dossier?.monthlySummary || [];
    const present = a.filter((x: any) => x.status === "present").length;
    const absent = a.filter((x: any) => x.status === "absent").length;
    const late = a.filter((x: any) => x.status === "late").length;
    const excused = a.filter((x: any) => x.status === "excused").length;
    const pct = a.length ? Math.round((present / a.length) * 100) : 0;
    const filterLabel = filterAll ? "All Terms" : `${selectedYear} - ${termLabel(selectedTerm)}`;
    w.document.write(`<html><head><title>Dossier - ${student.full_name}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:32px;color:#0f172a;}
        h1{font-size:22px;margin:0 0 4px;text-transform:uppercase;}
        h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin:24px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;}
        .row{font-size:13px;}
        .label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;}
        .val{font-weight:600;}
        .header{border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:8px;}
        .meta{font-size:11px;color:#64748b;margin-top:4px;}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;}
        th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#64748b;}
        td{padding:8px 10px;border-bottom:1px solid #e2e8f0;}
        .footer{margin-top:32px;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px;}
        .summary{display:flex;gap:16px;margin-top:8px;}
        .summary-item{flex:1;padding:12px;border-radius:8px;text-align:center;}
        .summary-item.present{background:#f0fdf4;color:#166534;}
        .summary-item.absent{background:#fef2f2;color:#991b1b;}
        .summary-item.late{background:#fffbeb;color:#92400e;}
        .summary-item.excused{background:#f0f9ff;color:#075985;}
        .summary-num{font-size:24px;font-weight:900;}
        .summary-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;}
      </style></head><body>
      <div class="header">
        <h1>${student.full_name}${student.arabic_name ? ' — ' + student.arabic_name : ''}</h1>
        <div class="meta">ADM: ${student.admission_number || 'PENDING'} • ${student.class_name || 'Unassigned'} • ${student.religion || 'Islam'} • Status: ${student.status || 'Active'} • Period: ${filterLabel}</div>
      </div>
      <h2>Personal Information</h2>
      <div class="grid">
        <div class="row"><div class="label">Arabic Name</div><div class="val">${student.arabic_name || '—'}</div></div>
        <div class="row"><div class="label">Gender</div><div class="val">${student.gender || '—'}</div></div>
        <div class="row"><div class="label">Date of Birth</div><div class="val">${fmt(student.date_of_birth)}</div></div>
        <div class="row"><div class="label">Enrollment Date</div><div class="val">${fmt(student.enrollment_date)}</div></div>
        <div class="row"><div class="label">Religion</div><div class="val">${student.religion || '—'}</div></div>
        <div class="row"><div class="label">Dormitory</div><div class="val">${student.dormitory || student.house || '—'}</div></div>
        <div class="row"><div class="label">Area</div><div class="val">${student.area || '—'}</div></div>
        <div class="row"><div class="label">District</div><div class="val">${student.district || student.home_district || '—'}</div></div>
        <div class="row"><div class="label">Pupil Status</div><div class="val">${student.pupil_status || '—'}</div></div>
      </div>
      <h2>Guardian / Parental Info</h2>
      <div class="grid">
        <div class="row"><div class="label">Guardian Name</div><div class="val">${student.guardian_name || student.parent_name || '—'}</div></div>
        <div class="row"><div class="label">Phone</div><div class="val">${student.parent_phone || student.guardian_phone || '—'}</div></div>
        <div class="row"><div class="label">Relationship</div><div class="val">${student.guardian_relationship || '—'}</div></div>
        <div class="row"><div class="label">Father's Name</div><div class="val">${student.father_name || '—'}</div></div>
        <div class="row"><div class="label">Mother's Name</div><div class="val">${student.mother_name || '—'}</div></div>
      </div>
      <h2>Sponsorship</h2>
      <div class="grid">
        <div class="row"><div class="label">Sponsorship No.</div><div class="val">${student.sponsorship_number || '—'}</div></div>
        <div class="row"><div class="label">Type</div><div class="val">${student.sponsorship_type || '—'}</div></div>
        <div class="row"><div class="label">Agency</div><div class="val">${student.sponsorship_agency || '—'}</div></div>
        <div class="row"><div class="label">NIRA Document</div><div class="val">${student.nira_document_type || '—'}</div></div>
      </div>
      <h2>Attendance (${filterLabel})</h2>
      <div class="summary">
        <div class="summary-item present"><div class="summary-num">${present}</div><div class="summary-label">Present</div></div>
        <div class="summary-item absent"><div class="summary-num">${absent}</div><div class="summary-label">Absent</div></div>
        <div class="summary-item late"><div class="summary-num">${late}</div><div class="summary-label">Late</div></div>
        <div class="summary-item excused"><div class="summary-num">${excused}</div><div class="summary-label">Excused</div></div>
        <div class="summary-item" style="background:#f1f5f9;color:#0f172a;"><div class="summary-num">${pct}%</div><div class="summary-label">Rate</div></div>
      </div>
      ${ms.length > 0 ? `
      <h2>Monthly Breakdown</h2>
      <table>
        <thead><tr><th>Month</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Total</th></tr></thead>
        <tbody>
          ${ms.map((m: any) => {
            const tot = m.present + m.absent + m.late + m.excused;
            return `<tr><td>${m.month}</td><td>${m.present}</td><td>${m.absent}</td><td>${m.late}</td><td>${m.excused}</td><td>${tot}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
      ` : ''}
      ${(dossier?.discipline || []).length > 0 ? `
      <h2>Discipline Cases (${filterLabel})</h2>
      ${dossier.discipline.map((c: any) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:8px;">
        <p style="font-weight:700;font-size:13px;">${c.incident_type} — ${c.severity}</p>
        <p style="font-size:11px;color:#64748b;">${fmt(c.incident_date)}</p>
        <p style="font-size:12px;margin-top:4px;">${c.description || ''}</p>
        <p style="font-size:11px;margin-top:4px;"><strong>Action:</strong> ${c.action_taken || 'Pending'}</p>
      </div>`).join('')}
      ` : ''}
      <h2>Finance Summary (${filterLabel})</h2>
      <div class="grid">
        <div class="row"><div class="label">Total Fees</div><div class="val">${formatUGX(dossier?.financials?.totalFees || 0)}</div></div>
        <div class="row"><div class="label">Total Paid</div><div class="val">${formatUGX(dossier?.financials?.totalPaid || 0)}</div></div>
        <div class="row"><div class="label">Balance</div><div class="val">${formatUGX(dossier?.financials?.balance || 0)}</div></div>
      </div>
      <div class="footer">Property of Alheib Mixed Day & Boarding School • Generated ${format(new Date(), "PPP p")} • Period: ${filterLabel}</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="h-20 w-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.full_name} className="h-full w-full object-cover rounded-2xl" />
              ) : (
                <User className="h-10 w-10 text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight truncate">
                  {student.full_name}
                </DialogTitle>
                <Badge className="bg-emerald-500 text-white border-none uppercase text-[10px] font-black">
                  {student.status || "Active"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                  <School className="h-3.5 w-3.5" />
                  {student.class_name || "Unassigned"}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                  <IdCard className="h-3.5 w-3.5" />
                  ADM: {student.admission_number || "PENDING"}
                </div>
              </div>
              {/* Period Filter */}
              <div className="flex items-center gap-2 mt-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-7 w-28 bg-white/10 border-white/20 text-white text-[10px] font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                    <SelectItem value="all">All Years</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAll ? "all" : selectedTerm} onValueChange={(v) => { if (v === "all") { setFilterAll(true); } else { setFilterAll(false); setSelectedTerm(v); } }}>
                  <SelectTrigger className="h-7 w-28 bg-white/10 border-white/20 text-white text-[10px] font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_1">Term I</SelectItem>
                    <SelectItem value="term_2">Term II</SelectItem>
                    <SelectItem value="term_3">Term III</SelectItem>
                    <SelectItem value="all">All Terms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="bio" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-slate-50">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
              <TabsTrigger value="bio" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <User className="h-3.5 w-3.5" /> Bio-Data
              </TabsTrigger>
              <TabsTrigger value="academics" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <BookOpen className="h-3.5 w-3.5" /> Academics
              </TabsTrigger>
              <TabsTrigger value="finance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <Wallet className="h-3.5 w-3.5" /> Finance
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <ClipboardCheck className="h-3.5 w-3.5" /> Attendance
              </TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <PackageOpen className="h-3.5 w-3.5" /> Items Issued
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <HistoryIcon className="h-3.5 w-3.5" /> History
              </TabsTrigger>
              <TabsTrigger value="discipline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <Shield className="h-3.5 w-3.5" /> Discipline
              </TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <HeartPulse className="h-3.5 w-3.5" /> Health
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
            <>
            <TabsContent value="bio" className="mt-0 space-y-8">
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Personal Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoItem label="Arabic Name" value={student.arabic_name} icon={Globe} />
                  <InfoItem label="Gender" value={student.gender} icon={User} />
                  <InfoItem label="Date of Birth" value={student.date_of_birth && !isNaN(new Date(student.date_of_birth).getTime()) ? format(new Date(student.date_of_birth), "PPP") : "Not Set"} icon={Calendar} />
                  <InfoItem label="Religion" value={student.religion} icon={Shield} />
                  <InfoItem label="Enrollment Date" value={student.enrollment_date && !isNaN(new Date(student.enrollment_date).getTime()) ? format(new Date(student.enrollment_date), "PPP") : "Not Set"} icon={Calendar} />
                  <InfoItem label="Pupil Status" value={student.pupil_status} icon={Badge} />
                  <InfoItem label="Dormitory" value={student.dormitory} icon={Building2} />
                  <InfoItem label="Area" value={student.area} icon={MapPin} />
                  <InfoItem label="Home District" value={student.home_district} icon={MapPin} />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Guardian / Parental Info</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-[9px] font-bold uppercase text-slate-400">Guardian</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Guardian Name" value={student.guardian_name || student.parent_name} icon={User} />
                      <InfoItem label="Phone Number" value={student.parent_phone || student.guardian_phone} icon={Phone} />
                      <InfoItem label="Relationship" value={student.guardian_relationship || "Parent"} icon={Shield} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[9px] font-bold uppercase text-slate-400">Parents</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Father's Name" value={student.father_name} icon={User} />
                      <InfoItem label="Mother's Name" value={student.mother_name} icon={User} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Sponsorship Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem label="Sponsorship No." value={student.sponsorship_number} icon={Hash} />
                  <InfoItem label="Sponsorship Type" value={student.sponsorship_type} icon={Hand} />
                  <InfoItem label="Sponsorship Agency" value={student.sponsorship_agency} icon={Award} />
                  <InfoItem label="NIRA Document" value={student.nira_document_type} icon={FileText} />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="academics" className="mt-0 space-y-6">
               <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                  <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                  <h5 className="font-black uppercase tracking-widest text-slate-900">Academic Records</h5>
                  <p className="text-sm mt-1 max-w-xs">Detailed termly assessments and competency progress will appear here.</p>
               </div>
            </TabsContent>

            <TabsContent value="finance" className="mt-0 space-y-6">
               <div className="flex items-center justify-between">
                 <div className="grid grid-cols-3 gap-4 flex-1">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Total Fees</p>
                      <p className="text-lg font-black text-slate-900">{formatUGX(dossier?.financials?.totalFees || 0)}</p>
                   </div>
                   <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Total Paid</p>
                      <p className="text-lg font-black text-emerald-700">{formatUGX(dossier?.financials?.totalPaid || 0)}</p>
                   </div>
                   <div className={cn(
                     "p-4 rounded-2xl border",
                     (dossier?.financials?.balance || 0) > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                   )}>
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Balance</p>
                      <p className={cn("text-lg font-black", (dossier?.financials?.balance || 0) > 0 ? "text-red-600" : "text-emerald-700")}>
                         {formatUGX(dossier?.financials?.balance || 0)}
                      </p>
                   </div>
                 </div>
               </div>
               {!filterAll && (
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   Showing payments for {selectedYear} - {termLabel(selectedTerm)}
                 </p>
               )}

               {dossier?.learner?.status !== 'active' && (
                 <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-4">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                    <div>
                       <p className="text-sm font-black text-orange-900 uppercase">Exit Summary</p>
                       <p className="text-xs text-orange-700">
                         Learner left the school on {dossier?.exitDate ? format(new Date(dossier.exitDate), "PPP") : "Unknown Date"} with a
                         balance of {formatUGX(dossier?.financials?.balance || 0)}.
                       </p>
                    </div>
                 </div>
               )}

               <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment History</h5>
                  {dossier?.financials?.payments?.length ? (
                    <div className="border rounded-xl overflow-hidden">
                       <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b">
                             <tr className="text-left font-black uppercase text-[9px] tracking-widest text-slate-500">
                                <th className="p-3">Date</th>
                                <th className="p-3">Receipt</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Method</th>
                             </tr>
                          </thead>
                          <tbody>
                             {dossier.financials.payments.map((p: any) => (
                               <tr key={p.id} className="border-b last:border-0">
                                  <td className="p-3 font-medium">{format(new Date(p.payment_date), "dd MMM yyyy")}</td>
                                  <td className="p-3 font-mono text-slate-400">{p.receipt_number}</td>
                                  <td className="p-3 font-bold">{formatUGX(p.amount)}</td>
                                  <td className="p-3 uppercase text-[10px] font-black text-slate-400">{p.payment_method}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed rounded-3xl text-center text-slate-400">
                       No payments recorded for this period.
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="inventory" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items Currently Issued</h5>
                  {dossier?.issuedItems?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {dossier.issuedItems.map((trans: any) => (
                         <div key={trans.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-slate-600" />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-900">{trans.item?.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {trans.quantity} {trans.item?.unit} • Issued {format(new Date(trans.transaction_date), "dd MMM yyyy")}
                                  </p>
                               </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">Tracked</Badge>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                       <PackageOpen className="h-12 w-12 mb-4 opacity-20" />
                       <p className="text-sm font-bold uppercase tracking-widest">No School Property Issued</p>
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Journey & Enrollment History</h5>
                  {dossier?.history?.length ? (
                    <div className="space-y-2">
                       {dossier.history.map((h: string, i: number) => (
                         <div key={i} className="flex items-center gap-4 group">
                            <div className="h-12 w-1 h-full bg-slate-100 group-hover:bg-slate-900 transition-colors rounded-full" />
                            <div className="flex-1 p-4 bg-slate-50 group-hover:bg-slate-100 rounded-2xl transition-colors flex items-center justify-between">
                               <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{h}</p>
                               <Clock className="h-4 w-4 text-slate-300" />
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                       <Clock className="h-12 w-12 mb-4 opacity-20" />
                       <p className="text-sm font-bold uppercase tracking-widest">Initial Enrollment: {student.enrollment_date ? format(new Date(student.enrollment_date), "yyyy") : "Unknown"}</p>
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-0 space-y-6">
              {dossier?.attendance?.length > 0 ? (
                <div className="space-y-6">
                  {/* Attendance Summary Cards */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-emerald-700">{dossier.attendanceSummary.present}</p>
                      <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Present</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                      <p className="text-2xl font-black text-red-700">{dossier.attendanceSummary.absent}</p>
                      <p className="text-[9px] font-black uppercase text-red-600 tracking-widest">Absent</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                      <p className="text-2xl font-black text-amber-700">{dossier.attendanceSummary.late}</p>
                      <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Late</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                      <p className="text-2xl font-black text-blue-700">{dossier.attendanceSummary.excused}</p>
                      <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Excused</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <p className="text-2xl font-black text-slate-700">
                        {dossier.attendance.length > 0
                          ? Math.round((dossier.attendanceSummary.present / dossier.attendanceSummary.total) * 100) + '%'
                          : '—'}
                      </p>
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Rate</p>
                    </div>
                  </div>
                  {!filterAll && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing attendance for {selectedYear} - {termLabel(selectedTerm)}
                    </p>
                  )}
                  {/* Monthly Summary Table */}
                  {dossier.monthlySummary?.length > 0 && (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b">
                          <tr className="text-left font-black uppercase text-[9px] tracking-widest text-slate-500">
                            <th className="p-3">Month</th>
                            <th className="p-3">Present</th>
                            <th className="p-3">Absent</th>
                            <th className="p-3">Late</th>
                            <th className="p-3">Excused</th>
                            <th className="p-3">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dossier.monthlySummary.map((m: any) => {
                            const tot = m.present + m.absent + m.late + m.excused;
                            return (
                              <tr key={m.month} className="border-b last:border-0">
                                <td className="p-3 font-bold">{format(new Date(m.month + '-01'), 'MMM yyyy')}</td>
                                <td className="p-3 text-emerald-700 font-bold">{m.present}</td>
                                <td className="p-3 text-red-700 font-bold">{m.absent}</td>
                                <td className="p-3 text-amber-700 font-bold">{m.late}</td>
                                <td className="p-3 text-blue-700 font-bold">{m.excused}</td>
                                <td className="p-3 font-bold text-slate-700">{tot}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                  <ClipboardCheck className="h-12 w-12 mb-4 opacity-20" />
                  <h5 className="font-black uppercase tracking-widest text-slate-900">No Attendance Records</h5>
                  <p className="text-sm mt-1 max-w-xs">
                    {filterAll
                      ? "No attendance records found for this learner."
                      : `No attendance records for ${selectedYear} - ${termLabel(selectedTerm)}. Try selecting "All Terms".`}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="discipline" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conduct & Discipline Incidents</h5>
                  {!filterAll && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing cases for {selectedYear} - {termLabel(selectedTerm)}
                    </p>
                  )}
                  {dossier?.discipline?.length ? (
                    <div className="space-y-4">
                       {dossier.discipline.map((case_item: any) => (
                         <div key={case_item.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden group">
                            <div className={cn(
                              "absolute top-0 left-0 bottom-0 w-1.5",
                              case_item.severity === 'critical' ? 'bg-red-600' :
                              case_item.severity === 'major' ? 'bg-orange-600' :
                              case_item.severity === 'moderate' ? 'bg-yellow-600' : 'bg-slate-400'
                            )} />
                            <div className="flex items-start justify-between mb-2">
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{case_item.incident_type}</p>
                                     <Badge className={cn(
                                       "text-[8px] font-black uppercase px-1.5 h-4 border-none",
                                       case_item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                       case_item.severity === 'major' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                                     )}>
                                       {case_item.severity}
                                     </Badge>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {format(new Date(case_item.incident_date), "dd MMM yyyy")} • Reported by Admin
                                  </p>
                               </div>
                               <Badge variant="outline" className={cn(
                                 "text-[9px] font-black uppercase",
                                 case_item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500'
                               )}>
                                 {case_item.status}
                               </Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">{case_item.description}</p>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Action Taken</p>
                               <p className="text-xs font-bold text-slate-800">{case_item.action_taken || "Pending investigation"}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                       <Shield className="h-12 w-12 mb-4 opacity-20 text-emerald-500" />
                       <p className="text-sm font-black uppercase tracking-widest text-slate-900">Exemplary Conduct</p>
                       <p className="text-xs mt-1">
                         {filterAll
                           ? "No discipline cases found for this learner."
                           : `No discipline cases for ${selectedYear} - ${termLabel(selectedTerm)}.`}
                       </p>
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="health" className="mt-0 space-y-6">
               <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                  <HeartPulse className="h-12 w-12 mb-4 opacity-20" />
                  <h5 className="font-black uppercase tracking-widest text-slate-900">Medical History</h5>
                  <p className="text-sm mt-1 max-w-xs">Infirmary visits, allergies, and health notes will appear here.</p>
               </div>
            </TabsContent>
            </>
            )}
          </ScrollArea>
        </Tabs>

        <div className="p-4 bg-slate-50 border-t flex items-center justify-between shrink-0">
           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
             Property of Alheib Mixed Day & Boarding School
           </p>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-[10px] font-black uppercase tracking-widest border-slate-200 gap-1.5">
               <Printer className="h-3 w-3" /> Print Dossier
             </Button>
             <Button size="sm" onClick={() => setShowEdit(true)} className="h-8 text-[10px] font-black uppercase tracking-widest bg-slate-900 gap-1.5">
               <Pencil className="h-3 w-3" /> Edit Learner
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
    {student?.id && (
      <EditLearnerDialog learner={student} open={showEdit} onOpenChange={setShowEdit} />
    )}
    </>
  );
}

function InfoItem({ label, value, icon: Icon, className }: { label: string, value: string, icon: any, className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-3 w-3" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 truncate">
        {value || "Not Provided"}
      </p>
    </div>
  );
}
