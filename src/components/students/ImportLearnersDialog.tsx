// @ts-nocheck
import { useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FileSpreadsheet, AlertTriangle, CheckCircle2, Download, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// ------ helpers --------------------------------------------------------------

const norm = (s: any) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/[._]/g, " ")
    .trim()
    .toUpperCase();

// Map of normalized header → learner column
const HEADER_MAP: Record<string, string> = {
  "STUDENT NAME": "full_name",
  "NAME": "full_name",
  "FULL NAME": "full_name",
  "STUDENT NO": "admission_number",
  "STUDENT NUMBER": "admission_number",
  "ADM": "admission_number",
  "ADM NO": "admission_number",
  "ADMISSION NUMBER": "admission_number",
  "GENDER": "gender",
  "SEX": "gender",
  "CLASS": "_class",
  "DISTRICT": "home_district",
  "AREA": "home_village",
  "SPONSORSHIP NO": "sponsorship_number",
  "SPONSORSHIP NUMBER": "sponsorship_number",
  "TYPE OF SPONSORSHIP": "sponsorship_type",
  "SPONSORSHIP AGENCY": "sponsorship_agency",
  "ARABIC NAME": "arabic_name",
  "ARABIC": "arabic_name",
  "FATHER": "father_name",
  "MOTHER": "mother_name",
  "DORMITORY": "dormitory",
  "DOMITORY": "dormitory",
  "HOUSE": "house",
  "SECTION": "_boarding",
  "STAY": "_boarding",
  "GUARDIAN": "parent_name",
  "CONTACT": "parent_phone",
  "PHONE": "parent_phone",
  "DATE OF BIRTH": "date_of_birth",
  "DOB": "date_of_birth",
  "RELATIONSHIP": "_relationship",
  "NIRA DOC": "nin",
  "NIRA  DOC": "nin",
};

const CLASS_PATTERNS: Array<[RegExp, string]> = [
  [/\bP\.?\s*1\b|PRIMARY\s*1/i, "Primary 1 (P1)"],
  [/\bP\.?\s*2\b|PRIMARY\s*2/i, "Primary 2 (P2)"],
  [/\bP\.?\s*3\b|PRIMARY\s*3/i, "Primary 3 (P3)"],
  [/\bP\.?\s*4\b|PRIMARY\s*4/i, "Primary 4 (P4)"],
  [/\bP\.?\s*5\b|PRIMARY\s*5/i, "Primary 5 (P5)"],
  [/\bP\.?\s*6\b|PRIMARY\s*6/i, "Primary 6 (P6)"],
  [/\bP\.?\s*7\b|PRIMARY\s*7/i, "Primary 7 (P7)"],
];

const detectClassName = (raw: any): string | null => {
  if (raw == null) return null;
  const s = String(raw);
  for (const [re, name] of CLASS_PATTERNS) if (re.test(s)) return name;
  return null;
};

const detectGender = (raw: any): "male" | "female" | null => {
  const s = norm(raw);
  if (s.startsWith("M")) return "male";
  if (s.startsWith("F")) return "female";
  return null;
};

const SHEET_PUPIL_STATUS: Record<string, string> = {
  ORPHANS: "Orphan",
  PAYING: "Paying",
  "STAFF CHILDREN": "Teacher's Child",
  "STAFF & OUTSIDERS": "Teacher's Child",
  COMMUNITY: "Community",
  REFUGEES: "Other",
};

const SKIP_SHEETS = new Set(["SUMMARY", "REGISTER", "TOTAL", "STATISTICS"]);

// Detect the header row: first row that contains "NAME" and >= 3 non-null cells.
const findHeaderRow = (rows: any[][]) => {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = rows[i] || [];
    const cells = r.map(norm);
    const nonNull = cells.filter(Boolean).length;
    if (nonNull < 3) continue;
    if (cells.some((c) => c === "NAME" || c === "STUDENT NAME" || c === "FULL NAME")) {
      return i;
    }
  }
  return -1;
};

const buildColumnIndex = (header: any[]) => {
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = norm(h);
    if (!n) return;
    const key = HEADER_MAP[n];
    if (key && idx[key] === undefined) idx[key] = i;
  });
  return idx;
};

// Convert excel date serial or string → ISO YYYY-MM-DD
const toIsoDate = (v: any): string | null => {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
};

const cleanPhone = (v: any) => {
  if (v == null) return null;
  const s = String(v).replace(/\D/g, "");
  return s || null;
};

interface ParsedRow {
  sheet: string;
  full_name: string;
  admission_number: string | null;
  gender: "male" | "female" | null;
  className: string | null;
  pupil_status: string | null;
  house: string | null;
  dormitory: string | null;
  home_district: string | null;
  home_village: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  date_of_birth: string | null;
  nin: string | null;
  arabic_name: string | null;
  sponsorship_number: string | null;
  sponsorship_type: string | null;
  sponsorship_agency: string | null;
  father_name: string | null;
  mother_name: string | null;
  _warnings: string[];
}

const parseWorkbook = (wb: XLSX.WorkBook): ParsedRow[] => {
  const out: ParsedRow[] = [];
  for (const sheetName of wb.SheetNames) {
    const upperName = norm(sheetName);
    if (SKIP_SHEETS.has(upperName)) continue;
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: true,
    });
    const headerIdx = findHeaderRow(rows);
    if (headerIdx < 0) continue;
    const header = rows[headerIdx];
    const cols = buildColumnIndex(header);
    if (cols.full_name === undefined) continue;

    const sheetStatus = SHEET_PUPIL_STATUS[upperName] || null;

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const get = (k: string) => (cols[k] === undefined ? null : r[cols[k]]);
      const rawName = get("full_name");
      const fullName = String(rawName ?? "").trim();
      if (!fullName) continue;
      if (/^total|^grand\s*total/i.test(fullName)) continue;
      if (fullName.length < 3) continue;

      const warnings: string[] = [];
      const gender = detectGender(get("gender"));
      if (!gender) warnings.push("missing gender");
      const className = detectClassName(get("_class"));
      if (!className) warnings.push("unknown class");

      const admRaw = get("admission_number");
      const admission_number =
        admRaw == null || admRaw === "" || /^new$/i.test(String(admRaw))
          ? null
          : String(admRaw).trim();

      out.push({
        sheet: sheetName,
        full_name: fullName.replace(/\s+/g, " "),
        admission_number,
        gender,
        className,
        pupil_status: sheetStatus,
        house: get("house") ? String(get("house")).trim() : null,
        dormitory: get("dormitory") ? String(get("dormitory")).trim() : null,
        home_district: get("home_district") ? String(get("home_district")).trim() : null,
        home_village: get("home_village") ? String(get("home_village")).trim() : null,
        parent_name: get("parent_name")
          ? String(get("parent_name")).trim()
          : get("father_name")
          ? String(get("father_name")).trim()
          : get("mother_name")
          ? String(get("mother_name")).trim()
          : null,
        parent_phone: cleanPhone(get("parent_phone")),
        date_of_birth: toIsoDate(get("date_of_birth")),
        nin: get("nin") ? String(get("nin")).trim() : null,
        arabic_name: get("arabic_name") ? String(get("arabic_name")).trim() : null,
        sponsorship_number: get("sponsorship_number") ? String(get("sponsorship_number")).trim() : null,
        sponsorship_type: get("sponsorship_type") ? String(get("sponsorship_type")).trim() : null,
        sponsorship_agency: get("sponsorship_agency") ? String(get("sponsorship_agency")).trim() : null,
        father_name: get("father_name") ? String(get("father_name")).trim() : null,
        mother_name: get("mother_name") ? String(get("mother_name")).trim() : null,
        _warnings: warnings,
      });
    }
  }
  return out;
};

// ---------- component --------------------------------------------------------

export const ImportLearnersDialog = ({ children }: { children: React.ReactNode }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [classMap, setClassMap] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    const total = parsed.length;
    const withClass = parsed.filter((p) => p.className).length;
    const withGender = parsed.filter((p) => p.gender).length;
    const withAdm = parsed.filter((p) => p.admission_number).length;
    return { total, withClass, withGender, withAdm };
  }, [parsed]);

  const handleFile = async (file: File) => {
    setParsing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const rows = parseWorkbook(wb);
      if (rows.length === 0) {
        toast({
          title: "No rows detected",
          description: "Could not find a header row with NAME / STUDENT NAME.",
          variant: "destructive",
        });
      }
      setParsed(rows);

      // Load classes for mapping
      const { data: classes } = await supabase.from("classes").select("id, name");
      const map = new Map<string, string>();
      (classes || []).forEach((c: any) => map.set(c.name, c.id));
      setClassMap(map);
    } catch (e: any) {
      toast({ title: "Failed to read file", description: e.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsed.length) return;
    setImporting(true);
    setProgress("Preparing data…");

    // Map parsed rows to the server payload, resolving class_id from classMap
    const learners = parsed.map((p) => ({
      full_name: p.full_name,
      admission_number: p.admission_number,
      gender: p.gender || "male",
      class_id: p.className ? classMap.get(p.className) || null : null,
      pupil_status: p.pupil_status,
      house: p.house,
      dormitory: p.dormitory,
      home_district: p.home_district,
      home_village: p.home_village,
      date_of_birth: p.date_of_birth,
      nin: p.nin,
      arabic_name: p.arabic_name,
      sponsorship_number: p.sponsorship_number,
      sponsorship_type: p.sponsorship_type,
      sponsorship_agency: p.sponsorship_agency,
      father_name: p.father_name,
      mother_name: p.mother_name,
      parent_name: p.parent_name,
      parent_phone: p.parent_phone,
    }));

    setProgress(`Uploading ${learners.length} learners…`);

    try {
      // Use client-side upsert so audit trigger gets the real auth.uid()
      let inserted = 0;
      let updated = 0;
      let failed = 0;
      let lastError: string | null = null;

      const chunkSize = 500;
      for (let i = 0; i < learners.length; i += chunkSize) {
        const chunk = learners.slice(i, i + chunkSize);
        setProgress(`Importing ${Math.min(i + chunkSize, learners.length)} / ${learners.length}…`);

        const records = chunk.map((p) => {
          const rec: Record<string, any> = {
            full_name: p.full_name,
            gender: p.gender || "male",
            admission_number: p.admission_number || null,
            class_id: p.className ? classMap.get(p.className) || null : null,
            pupil_status: p.pupil_status || null,
            house: p.house || null,
            dormitory: p.dormitory || null,
            home_district: p.home_district || null,
            home_village: p.home_village || null,
            date_of_birth: p.date_of_birth || null,
            nin: p.nin || null,
            arabic_name: p.arabic_name || null,
            sponsorship_number: p.sponsorship_number || null,
            sponsorship_type: p.sponsorship_type || null,
            sponsorship_agency: p.sponsorship_agency || null,
            father_name: p.father_name || null,
            mother_name: p.mother_name || null,
            parent_name: p.parent_name || null,
            parent_phone: p.parent_phone || null,
            status: "active",
          };
          if (rec.nin && !/^[A-Z0-9]{14}$/.test(rec.nin)) rec.nin = null;
          Object.keys(rec).forEach((k) => rec[k] == null && delete rec[k]);
          if (!rec.full_name || !rec.gender) return null;
          return rec;
        }).filter(Boolean);

        if (records.length === 0) continue;

        // PostgREST requires all objects in bulk POST to have identical keys
        const allKeys = [...new Set(records.flatMap((r) => Object.keys(r)))];
        const usedKeys = allKeys.filter((k) => records.some((r: any) => r[k] != null));
        const normalized = records.map((r: any) => {
          const obj: Record<string, any> = {};
          for (const k of usedKeys) obj[k] = r[k] ?? null;
          return obj;
        });

        const { error } = await supabase
          .from("learners")
          .upsert(normalized, { onConflict: "admission_number", ignoreDuplicates: false });

        if (error) {
          failed += chunk.length;
          lastError = error.message;
          console.error("Bulk upsert error:", error);
        } else {
          inserted += chunk.length;
        }
      }

      setImporting(false);
      setProgress("");
      toast({
        title: failed ? "Import completed with errors" : "Import complete",
        description: lastError
          ? `${inserted} added · ${updated} updated · ${failed} failed — ${lastError}`
          : `${inserted} added · ${updated} updated · ${failed} failed`,
        variant: failed ? "destructive" : "default",
      });
    } catch (e: any) {
      setImporting(false);
      setProgress("");
      toast({
        title: "Import failed",
        description: e.message,
        variant: "destructive",
      });
    }

    qc.invalidateQueries({ queryKey: ["learners"] });
    setOpen(false);
    setParsed([]);
    setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Import Learners from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an .xlsx file. The importer auto-detects header rows and maps columns like
            STUDENT NAME, CLASS (P.1–P.7), GENDER, DORMITORY, DISTRICT, GUARDIAN, CONTACT across
            every sheet. Sheets named ORPHANS, PAYING, COMMUNITY, STAFF CHILDREN are tagged
            accordingly. Existing learners (matched by admission number or name) are updated.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {!parsed.length ? (
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm">Drop your Excel file here</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">or click to browse (.xlsx, .xls)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" size="sm">Choose File</Button>
                <a
                  href="/students_import_template.xlsx"
                  download="students_import_template.xlsx"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download template
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{parsed.length} rows parsed</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {parsing && <Loader2 className="h-4 w-4 animate-spin" />}
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setParsed([]); setFileName(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {parsed.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" /> {summary.total} rows
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Class: {summary.withClass}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Gender: {summary.withGender}
                </Badge>
                <Badge variant="outline" className="gap-1">ADM: {summary.withAdm}</Badge>
                {summary.total - summary.withClass > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    No class: {summary.total - summary.withClass}
                  </Badge>
                )}
              </div>

              {summary.total - summary.withClass > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Rows without a recognised class will be imported without a class assignment.
                    You can assign them later from the learner profile.
                  </AlertDescription>
                </Alert>
              )}

              <ScrollArea className="border rounded-md flex-1 max-h-[40vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Sheet</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">ADM</TableHead>
                      <TableHead className="text-xs">Class</TableHead>
                      <TableHead className="text-xs">Gender</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Guardian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.slice(0, 200).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {p.sheet}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{p.full_name}</TableCell>
                        <TableCell className="text-xs">{p.admission_number || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {p.className || (
                            <span className="text-destructive">?</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.gender || <span className="text-destructive">?</span>}
                        </TableCell>
                        <TableCell className="text-xs">{p.pupil_status || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {p.parent_name || "—"}
                          {p.parent_phone ? ` · ${p.parent_phone}` : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsed.length > 200 && (
                  <div className="text-center text-xs text-muted-foreground p-2">
                    Showing first 200 of {parsed.length} rows
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {progress && <span className="text-xs text-muted-foreground mr-auto">{progress}</span>}
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!parsed.length || importing}>
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Import {parsed.length || ""} learners
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
