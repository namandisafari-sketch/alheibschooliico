import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClasses } from "@/hooks/useClasses";
import { useLearners } from "@/hooks/useLearners";
import {
  useTermResults,
  useSubjects,
  useReportCards,
  useUpsertReportCards,
  useSetReportStatus,
  ReportCardUpsert,
} from "@/hooks/useTermResults";
import {
  Loader2,
  Printer,
  FileText,
  Eye,
  Send,
  Lock,
  Unlock,
  Download,
} from "lucide-react";
import { ReportCard } from "@/components/reports/ReportCard";
import { TermlyCircular } from "@/components/reports/TermlyCircular";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetSizeControls } from "@/components/settings/AssetSizeControls";
import { Database } from "@/integrations/supabase/types";
import { computeAggregate } from "@/lib/grading";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const termLabel: Record<string, string> = { term1: "Term 1", term2: "Term 2", term3: "Term 3" };

type TermType = Database["public"]["Enums"]["term_type"];

const terms: { value: TermType; label: string }[] = [
  { value: "term_1", label: "Term 1" },
  { value: "term_2", label: "Term 2" },
  { value: "term_3", label: "Term 3" },
];

const Reports = () => {
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get("class") || "");
  const [selectedTerm, setSelectedTerm] = useState<TermType>(
    (searchParams.get("term") as TermType) || "term_1",
  );
  const [academicYear, setAcademicYear] = useState<number>(
    parseInt(searchParams.get("year") || String(currentYear)),
  );
  const [reportType, setReportType] = useState<"report-cards" | "circulars" | "emis">("report-cards");
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [previewLearnerId, setPreviewLearnerId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "publish" | "unlock">(null);

  const { data: classes = [] } = useClasses();
  const { data: allLearners = [] } = useLearners();
  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const { data: subjects = [] } = useSubjects(selectedClassData?.level);
  const { data: termResults = [], isLoading } = useTermResults(
    selectedClass,
    selectedTerm,
    academicYear,
  );
  const { data: reportCards = [] } = useReportCards(
    selectedClass,
    selectedTerm,
    academicYear,
  );
  const upsertReports = useUpsertReportCards();
  const setStatus = useSetReportStatus();

  const classLearners = useMemo(
    () => selectedClass === "all" ? allLearners : allLearners.filter((l) => l.class_id === selectedClass),
    [allLearners, selectedClass],
  );

  // Auto-compute & upsert positions/totals when results change (silent)
  useEffect(() => {
    if (!selectedClass || classLearners.length === 0 || termResults.length === 0) return;
    const academicSubjects = subjects.filter((s) => s.category === "academic");
    const islamicSubjects = subjects.filter((s) => s.category === "islamic");

    const academicByLearner = classLearners.map((l) => {
      const scores = academicSubjects
        .map(
          (s) => termResults.find((r) => r.learner_id === l.id && r.subject_id === s.id)?.score,
        )
        .filter((v): v is number => v != null);
      const { total, average } = computeAggregate(scores);
      return { id: l.id, total, average };
    });
    const islamicByLearner = classLearners.map((l) => {
      const scores = islamicSubjects
        .map(
          (s) => termResults.find((r) => r.learner_id === l.id && r.subject_id === s.id)?.score,
        )
        .filter((v): v is number => v != null);
      const { total } = computeAggregate(scores);
      return { id: l.id, total };
    });

    const acRanked = [...academicByLearner].sort((a, b) => b.total - a.total);
    const isRanked = [...islamicByLearner].sort((a, b) => b.total - a.total);

    const rows: ReportCardUpsert[] = classLearners.map((l) => {
      const ac = academicByLearner.find((x) => x.id === l.id)!;
      const acPos = acRanked.findIndex((x) => x.id === l.id) + 1;
      const isPos = isRanked.findIndex((x) => x.id === l.id) + 1;
      const existing = reportCards.find((r) => r.learner_id === l.id);
      // Don't overwrite if already locked/published
      if (existing && existing.status !== "draft") return null as any;
      return {
        learner_id: l.id,
        class_id: selectedClass,
        term: selectedTerm,
        academic_year: academicYear,
        academic_total: ac.total || null,
        academic_average: ac.average || null,
        academic_position: ac.total ? acPos : null,
        islamic_position: isRanked.find((x) => x.id === l.id)?.total ? isPos : null,
        class_size: classLearners.length,
        status: "draft",
      };
    }).filter(Boolean) as ReportCardUpsert[];

    if (rows.length > 0) {
      upsertReports.mutate(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedTerm, academicYear, termResults.length, subjects.length]);

  const toggleLearner = (id: string) =>
    setSelectedLearners((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const selectAll = () => setSelectedLearners(classLearners.map((l) => l.id));
  const deselectAll = () => setSelectedLearners([]);

  const getLearnerResults = (id: string) => termResults.filter((r) => r.learner_id === id);
  const getMeta = (id: string) => reportCards.find((r) => r.learner_id === id) ?? null;

  // ─── Publish / lock ───────────────────────────────────────────────────────
  const handlePublish = async (scope: "selected" | "class") => {
    const ids =
      scope === "selected"
        ? reportCards.filter((r) => selectedLearners.includes(r.learner_id)).map((r) => r.id)
        : reportCards.map((r) => r.id);
    if (ids.length === 0) {
      toast({ title: "Nothing to publish", description: "No reports found for selection." });
      return;
    }
    if (reportType === "emis") {
      const { data, error } = await (supabase as any)
        .from("learners")
        .select(`
          admission_number,
          first_name,
          last_name,
          gender,
          date_of_birth,
          nin,
          lin,
          parent_nin,
          religion,
          home_region,
          home_district,
          home_sub_county,
          home_parish,
          schools(
            name, 
            center_number, 
            license_number, 
            registration_status, 
            ownership_type, 
            academic_level, 
            year_founded, 
            urban_rural, 
            distance_to_district_hq, 
            distance_to_health_facility, 
            distance_to_bank
          ),
          classes(name)
        `);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      // Generate CSV
      const headers = [
        "ADM NO", "First Name", "Last Name", "Gender", "DOB", "NIN", "LIN", "Parent NIN", 
        "Religion", "Region", "District", "Sub-County", "Parish", "Class", 
        "School Name", "Center No", "License No", "Status", "Ownership", "Level", 
        "Year Founded", "Urban/Rural", "Dist to HQ", "Dist to Health", "Dist to Bank"
      ];
      
      const rows = data.map(l => {
        const s = (l as any).schools || {};
        return [
          l.admission_number,
          l.first_name,
          l.last_name,
          l.gender,
          l.date_of_birth,
          l.nin || "",
          l.lin || "",
          l.parent_nin || "",
          l.religion || "Islam",
          l.home_region || "",
          l.home_district || "",
          l.home_sub_county || "",
          l.home_parish || "",
          (l as any).classes?.name || "Unassigned",
          s.name || "",
          s.center_number || "",
          s.license_number || "",
          s.registration_status || "",
          s.ownership_type || "",
          s.academic_level || "",
          s.year_founded || "",
          s.urban_rural || "",
          s.distance_to_district_hq || "",
          s.distance_to_health_facility || "",
          s.distance_to_bank || ""
        ];
      });
      
      const csvContent = [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `EMIS_Official_Export_${format(new Date(), "yyyy_MM_dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "EMIS Data Exported", description: "Official CSV file generated for Ministry submission." });
      return;
    }
    await setStatus.mutateAsync({ ids, status: "locked" });
    toast({
      title: "Published & locked",
      description: `${ids.length} report${ids.length === 1 ? "" : "s"} are now read-only.`,
    });
  };

  const handleUnlock = async () => {
    const ids = reportCards
      .filter((r) => selectedLearners.includes(r.learner_id))
      .map((r) => r.id);
    if (ids.length === 0) return;
    await setStatus.mutateAsync({ ids, status: "draft" });
    toast({ title: "Unlocked", description: `${ids.length} reports back to draft.` });
  };

  // ─── PDF export ───────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    const cards = printRef.current?.querySelectorAll<HTMLElement>(
      reportType === "report-cards" ? ".report-card" : ".circular-card"
    );
    if (!cards || cards.length === 0) {
      toast({ title: "Select learners first", variant: "destructive" });
      return;
    }
    toast({ title: "Generating PDF…", description: `${cards.length} report(s)` });
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const w = 210;
      for (let i = 0; i < cards.length; i++) {
        const dataUrl = await toPng(cards[i], { quality: 0.95, pixelRatio: 2, backgroundColor: "#ffffff" });
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = dataUrl;
        });
        const h = (img.height * w) / img.width;
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
      }
      pdf.save(`reports-${selectedClassData?.name}-${selectedTerm}-${academicYear}.pdf`);
      toast({ title: "PDF ready", description: "Download started." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  const handleExportZIP = async () => {
    const cards = printRef.current?.querySelectorAll<HTMLElement>(
      reportType === "report-cards" ? ".report-card" : ".circular-card"
    );
    if (!cards || cards.length === 0) return;
    const zip = new JSZip();
    toast({ title: "Generating images…" });
    for (let i = 0; i < cards.length; i++) {
      const dataUrl = await toPng(cards[i], { quality: 0.95, pixelRatio: 2, backgroundColor: "#ffffff" });
      const base64 = dataUrl.split(",")[1];
      const learnerName =
        cards[i].getAttribute("data-learner") || `learner-${i + 1}`;
      zip.file(`${learnerName}.png`, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${selectedClassData?.name}-${selectedTerm}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;

    // Copy all <style> and <link rel="stylesheet"> tags from the current doc
    // so Tailwind utility classes (flex, grid, borders, etc.) render in the
    // print window exactly like the live preview.
    const headStyles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((n) => n.outerHTML)
      .join("\n");

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Report Cards</title>
    ${headStyles}
    <style>
      @page { size: A4; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Each report card is exactly one A4 page — no overflow allowed */
      .report-card {
        width: 210mm;
        height: 297mm;
        margin: 0 auto;
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid;
        break-inside: avoid;
        overflow: hidden;
      }
      .report-card > * {
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
      }
      .report-card:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      img { max-width: 100%; }
    </style>
  </head>
  <body>${printRef.current.innerHTML}</body>
</html>`);
    win.document.close();

    // Wait for stylesheets + images in the new window to load before printing,
    // otherwise Chrome prints an unstyled / image-less page.
    const triggerPrint = () => {
      const imgs = Array.from(win.document.images);
      if (imgs.length === 0) {
        win.focus();
        win.print();
        return;
      }
      let remaining = imgs.length;
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) {
          win.focus();
          win.print();
        }
      };
      imgs.forEach((img) => {
        if (img.complete) {
          done();
        } else {
          img.addEventListener("load", done);
          img.addEventListener("error", done);
        }
      });
    };

    if (win.document.readyState === "complete") {
      setTimeout(triggerPrint, 100);
    } else {
      win.addEventListener("load", () => setTimeout(triggerPrint, 100));
    }
  };

  const previewLearner = previewLearnerId
    ? classLearners.find((l) => l.id === previewLearnerId)
    : null;

  return (
    <DashboardLayout title="Reports & Documents" subtitle="Generate, preview, publish & export school documents">
      <Tabs value={reportType} onValueChange={(v: any) => setReportType(v)} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
          <TabsTrigger value="circulars">Termly Circulars</TabsTrigger>
          <TabsTrigger value="emis">EMIS Data</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Generate</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Entire School (All Classes)</SelectItem>
                  {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Term</Label>
              <Select value={selectedTerm} onValueChange={(v) => setSelectedTerm(v as TermType)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Year</Label>
              <Select value={String(academicYear)} onValueChange={(v) => setAcademicYear(parseInt(v))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="h-9 w-full justify-center">
                {selectedLearners.length} selected
              </Badge>
            </div>
          </div>

          {/* Action bar */}
          {selectedClass && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Button size="sm" variant="outline" onClick={handlePrint} disabled={selectedLearners.length === 0}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={selectedLearners.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportZIP} disabled={selectedLearners.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />PNG ZIP
              </Button>
              <Button size="sm" onClick={() => setConfirmAction("publish")} disabled={selectedLearners.length === 0}>
                <Send className="mr-1.5 h-3.5 w-3.5" />Publish & Lock
              </Button>
              <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePublish("class")}>
                <Send className="mr-1.5 h-3.5 w-3.5" />Publish whole class
              </Button>
              {isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => setConfirmAction("unlock")} disabled={selectedLearners.length === 0}>
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />Unlock
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learner list */}
      {selectedClass && (
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <CardTitle className="text-base sm:text-lg">{selectedClassData?.name} — Learners</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="h-8">Select all</Button>
              <Button variant="outline" size="sm" onClick={deselectAll} className="h-8">Clear</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : classLearners.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No learners in this class.</p>
            ) : (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {classLearners.map((l) => {
                  const results = getLearnerResults(l.id);
                  const meta = getMeta(l.id);
                  const has = reportType === "circulars" ? true : results.length > 0;
                  const isSel = selectedLearners.includes(l.id);
                  return (
                    <div
                      key={l.id}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                        isSel ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={() => toggleLearner(l.id)}
                        disabled={reportType === "report-cards" && !has}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{l.full_name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {reportType === "report-cards" 
                              ? (has ? `${results.length} subjects` : "No marks")
                              : "Document Ready"}
                          </span>
                          {reportType === "report-cards" && meta?.academic_position && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              #{meta.academic_position}
                            </Badge>
                          )}
                          {meta?.status === "locked" && (
                            <Badge className="text-[10px] h-4 px-1 bg-emerald-600">
                              <Lock className="h-2.5 w-2.5 mr-0.5" />locked
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setPreviewLearnerId(l.id)}
                        disabled={!has}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden print container */}
      <div ref={printRef} className="absolute -left-[9999px] top-0">
        {selectedLearners.map((id) => {
          const learner = classLearners.find((l) => l.id === id);
          if (!learner) return null;
          return (
            <div key={id} className={reportType === "report-cards" ? "report-card" : "circular-card"} data-learner={learner.full_name.replace(/\s+/g, "_")}>
              {reportType === "report-cards" ? (
                <ReportCard
                  learner={learner}
                  results={getLearnerResults(id)}
                  subjects={subjects}
                  className={selectedClassData?.name || ""}
                  classLevel={selectedClassData?.level}
                  term={selectedTerm}
                  academicYear={academicYear}
                  teacherName={selectedClassData?.teacher_name || ""}
                  meta={getMeta(id)}
                />
              ) : (
                <TermlyCircular learner={learner} term={termLabel[selectedTerm]} year={academicYear} />
              )}
            </div>
          );
        })}
      </div>

      {/* Preview dialog with live size controls */}
      <Dialog open={!!previewLearner} onOpenChange={(o) => !o && setPreviewLearnerId(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[92vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Preview — {previewLearner?.full_name}</DialogTitle>
          </DialogHeader>
          {previewLearner && (
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div ref={previewRef} className="overflow-auto bg-muted/20 p-2 rounded-md flex justify-center">
                <div style={{ transform: "scale(0.72)", transformOrigin: "top center", width: "210mm" }}>
                  {reportType === "report-cards" ? (
                    <ReportCard
                      learner={previewLearner}
                      results={getLearnerResults(previewLearner.id)}
                      subjects={subjects}
                      className={selectedClassData?.name || ""}
                      classLevel={selectedClassData?.level}
                      term={selectedTerm}
                      academicYear={academicYear}
                      teacherName={selectedClassData?.teacher_name || ""}
                      meta={getMeta(previewLearner.id)}
                    />
                  ) : (
                    <TermlyCircular learner={previewLearner} term={termLabel[selectedTerm]} year={academicYear} />
                  )}
                </div>
              </div>
              <div className="lg:sticky lg:top-0 self-start space-y-3">
                <AssetSizeControls surface="report" title="Report sizes" />
                <p className="text-xs text-muted-foreground px-1">
                  Changes apply instantly to all report cards and PDF exports.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialogs */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "publish" ? "Publish & lock reports?" : "Unlock reports?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "publish"
                ? `This will lock ${selectedLearners.length} report(s). Teachers will no longer be able to edit them. Only admins can unlock.`
                : `This will revert ${selectedLearners.length} report(s) to draft so teachers can edit them again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === "publish") handlePublish("selected");
                if (confirmAction === "unlock") handleUnlock();
                setConfirmAction(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Reports;
