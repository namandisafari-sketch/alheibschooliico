// @ts-nocheck
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { INTERVIEW_CRITERIA, type TeacherApplicant } from "@/hooks/useTeacherApplicants";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface InterviewReportProps {
  applicant: TeacherApplicant;
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  interviewed: "bg-blue-100 text-blue-800 border-blue-200",
  hired: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  withdrawn: "bg-slate-100 text-slate-800 border-slate-200",
};

export function InterviewReport({ applicant }: InterviewReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const scores = applicant.interview_scores || [];
  const total = scores.reduce((s, sc) => s + sc.score, 0);
  const maxTotal = scores.reduce((s, sc) => s + sc.max_score, 0);
  const percentage = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : "0";

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const w = 190;
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const h = (img.height * w) / img.width;
      const pages = Math.ceil(h / 277);
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        const sy = (i * 277) / (img.height / w);
        const sh = Math.min(277 / w, img.height / w - sy);
        pdf.addImage(dataUrl, "PNG", 10, 10, w, sh * w, undefined, undefined, sy);
      }
      pdf.save(`Interview_Report_${applicant.full_name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} className="gap-2">
          <FileText className="h-4 w-4" /> Export PDF Report
        </Button>
      </div>

      <div ref={reportRef} className="bg-white p-8 rounded-xl border shadow-sm space-y-6 max-w-[210mm] mx-auto">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Interview Assessment Report</h1>
          <p className="text-sm text-muted-foreground">Teacher Recruitment — Al Heib School</p>
        </div>

        {/* Applicant Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
            <p className="font-bold text-slate-900">{applicant.full_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Position</p>
            <p className="font-bold text-slate-900">{applicant.position}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
            <p className="text-slate-700">{applicant.email || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
            <p className="text-slate-700">{applicant.phone || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualifications</p>
            <p className="text-slate-700">{applicant.qualifications || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</p>
            <p className="text-slate-700">{applicant.experience_years} years</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
            <Badge variant="outline" className={statusColor[applicant.status] || ""}>
              {applicant.status.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Date</p>
            <p className="text-slate-700">
              {applicant.decision_date ? format(new Date(applicant.decision_date), "dd/MM/yyyy") : format(new Date(applicant.created_at), "dd/MM/yyyy")}
            </p>
          </div>
        </div>

        <Separator />

        {/* Score Breakdown */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Score Breakdown</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-2">Criterion</th>
                <th className="pb-2 text-center">Score</th>
                <th className="pb-2 text-center">Max</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {INTERVIEW_CRITERIA.map((c) => {
                const sc = scores.find((s) => s.criteria === c.key);
                return (
                  <tr key={c.key} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-700">{c.label}</td>
                    <td className="py-2 text-center font-bold">{sc?.score ?? 0}</td>
                    <td className="py-2 text-center text-slate-400">{c.maxScore}</td>
                    <td className="py-2 text-xs text-slate-500">{sc?.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300">
                <td className="pt-2 font-bold text-slate-900">Total</td>
                <td className="pt-2 text-center font-black text-lg text-primary">{total}</td>
                <td className="pt-2 text-center font-bold text-slate-500">{maxTotal}</td>
                <td className="pt-2 text-xs text-slate-500">&nbsp;</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Percentage */}
        <div className="bg-slate-50 p-3 rounded-lg text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</p>
          <p className="text-3xl font-black text-primary">{percentage}%</p>
        </div>

        {/* Remarks */}
        {applicant.interviewer_remarks && (
          <>
            <Separator />
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Interviewer Remarks</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{applicant.interviewer_remarks}</p>
            </div>
          </>
        )}

        {/* Decision */}
        {applicant.decision && (
          <>
            <Separator />
            <div className="text-center p-4 rounded-xl border-2 border-dashed"
              style={{
                borderColor: applicant.decision === "hire" ? "#059669" : applicant.decision === "reject" ? "#e11d48" : "#d97706",
              }}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Decision</p>
              <p className="text-2xl font-black uppercase tracking-wide"
                style={{
                  color: applicant.decision === "hire" ? "#059669" : applicant.decision === "reject" ? "#e11d48" : "#d97706",
                }}
              >
                {applicant.decision}
              </p>
              {applicant.decision_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Decided on {format(new Date(applicant.decision_date), "dd/MM/yyyy")}
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-[9px] text-slate-400 pt-4 border-t">
          <p>Al Heib School — Teacher Recruitment Portal</p>
          <p>Generated on {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>
    </div>
  );
}
