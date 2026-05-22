// @ts-nocheck
import { useState, useMemo, useEffect, useRef, KeyboardEvent } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useClasses } from "@/hooks/useClasses";
import { useLearners } from "@/hooks/useLearners";
import {
  useSubjects,
  useSaveTermResults,
  useTermResults,
  TermResultInput,
  Subject,
} from "@/hooks/useTermResults";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  FileText,
  GraduationCap,
  BookOpen,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import {
  calculateGrade,
  toneToBgClass,
  toneToTextClass,
  ISLAMIC_LETTER_OPTIONS,
  computeAggregate,
} from "@/lib/grading";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";

type CompetencyLevel = Database["public"]["Enums"]["competency_level"];
type TermType = Database["public"]["Enums"]["term_type"];

const terms: { value: TermType; label: string }[] = [
  { value: "term_1", label: "Term 1" },
  { value: "term_2", label: "Term 2" },
  { value: "term_3", label: "Term 3" },
];

interface CellData {
  score: string;
  letter: string;
  remarks: string;
  juz: string;
}

const blank: CellData = { score: "", letter: "", remarks: "", juz: "" };

const MarksEntry = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<TermType>("term_1");
  const [academicYear, setAcademicYear] = useState<number>(currentYear);
  const [tab, setTab] = useState<"academic" | "islamic">("academic");
  // marks[learnerId][subjectId] = CellData
  const [marks, setMarks] = useState<
    Record<string, Record<string, CellData>>
  >({});
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data: classes = [] } = useClasses();
  const { data: allLearners = [] } = useLearners();
  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const classLevel = selectedClassData?.level;
  const { data: subjects = [] } = useSubjects(classLevel);
  const { data: existingResults = [] } = useTermResults(
    selectedClass,
    selectedTerm,
    academicYear,
  );
  const saveResults = useSaveTermResults();

  const classLearners = useMemo(
    () => allLearners.filter((l) => l.class_id === selectedClass),
    [allLearners, selectedClass],
  );

  const academicSubjects = useMemo(
    () => subjects.filter((s) => s.category === "academic"),
    [subjects],
  );
  const islamicSubjects = useMemo(
    () => subjects.filter((s) => s.category === "islamic"),
    [subjects],
  );
  const visibleSubjects = tab === "academic" ? academicSubjects : islamicSubjects;

  // Hydrate marks from existing results when filters change
  useEffect(() => {
    if (!selectedClass) return;
    const next: Record<string, Record<string, CellData>> = {};
    existingResults.forEach((r) => {
      if (!next[r.learner_id]) next[r.learner_id] = {};
      next[r.learner_id][r.subject_id] = {
        score: r.score?.toString() ?? "",
        letter: r.letter_grade ?? "",
        remarks: r.teacher_remarks ?? "",
        juz: r.juz_completed?.toString() ?? "",
      };
    });
    setMarks(next);
    setDirty(false);
  }, [existingResults, selectedClass, selectedTerm, academicYear]);

  const updateCell = (
    learnerId: string,
    subjectId: string,
    field: keyof CellData,
    value: string,
  ) => {
    // validation: numeric subjects 0-100
    if (field === "score" && value !== "") {
      const n = parseFloat(value);
      if (isNaN(n) || n < 0 || n > 100) {
        toast({
          title: "Invalid mark",
          description: "Score must be between 0 and 100",
          variant: "destructive",
        });
        return;
      }
    }
    setMarks((prev) => {
      const learner = { ...(prev[learnerId] || {}) };
      learner[subjectId] = {
        ...(learner[subjectId] || blank),
        [field]: value,
      };
      return { ...prev, [learnerId]: learner };
    });
    setDirty(true);
  };

  const buildPayload = (): TermResultInput[] => {
    const out: TermResultInput[] = [];
    Object.entries(marks).forEach(([learnerId, perSub]) => {
      Object.entries(perSub).forEach(([subjectId, cell]) => {
        const subj = subjects.find((s) => s.id === subjectId);
        if (!subj) return;
        const hasContent =
          cell.score !== "" || cell.letter !== "" || cell.remarks !== "" || cell.juz !== "";
        if (!hasContent) return;

        // Derive competency from score for academic, from letter for islamic
        let competency: CompetencyLevel = "meeting";
        if (cell.score !== "") {
          const s = parseFloat(cell.score);
          if (s >= 75) competency = "exceeding";
          else if (s >= 60) competency = "meeting";
          else if (s >= 45) competency = "approaching";
          else competency = "beginning";
        } else if (cell.letter) {
          const l = cell.letter.charAt(0).toUpperCase();
          competency =
            l === "A" ? "exceeding" :
            l === "B" ? "meeting" :
            l === "C" ? "approaching" : "beginning";
        }

        out.push({
          learner_id: learnerId,
          subject_id: subjectId,
          class_id: selectedClass,
          term: selectedTerm,
          academic_year: academicYear,
          score: cell.score !== "" ? parseFloat(cell.score) : null,
          letter_grade: cell.letter || null,
          juz_completed: cell.juz !== "" ? parseFloat(cell.juz) : null,
          competency_rating: competency,
          teacher_remarks: cell.remarks || null,
        });
      });
    });
    return out;
  };

  const handleSave = async (silent = false) => {
    if (!selectedClass) return;
    const payload = buildPayload();
    if (payload.length === 0) {
      if (!silent)
        toast({ title: "Nothing to save", description: "Enter marks first." });
      return;
    }
    try {
      await saveResults.mutateAsync(payload);
      setDirty(false);
      if (!silent)
        toast({
          title: "Saved",
          description: `${payload.length} marks recorded.`,
        });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Auto-save (debounced) when dirty
  useEffect(() => {
    if (!dirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => handleSave(true), 4000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, dirty]);

  // Excel-like keyboard navigation
  const handleKeyNav = (
    e: KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number,
    totalRows: number,
    totalCols: number,
  ) => {
    let nextRow = rowIdx;
    let nextCol = colIdx;
    if (e.key === "Enter" || e.key === "ArrowDown") {
      nextRow = Math.min(totalRows - 1, rowIdx + 1);
    } else if (e.key === "ArrowUp") {
      nextRow = Math.max(0, rowIdx - 1);
    } else if (e.key === "ArrowRight" && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
      nextCol = Math.min(totalCols - 1, colIdx + 1);
    } else if (e.key === "ArrowLeft" && (e.target as HTMLInputElement).selectionStart === 0) {
      nextCol = Math.max(0, colIdx - 1);
    } else {
      return;
    }
    e.preventDefault();
    const el = document.querySelector<HTMLInputElement>(
      `[data-cell="${nextRow}-${nextCol}"]`,
    );
    el?.focus();
    el?.select();
  };

  // Copy previous term
  const handleCopyPrevious = async () => {
    if (!selectedClass) return;
    const order: TermType[] = ["term_1", "term_2", "term_3"];
    const idx = order.indexOf(selectedTerm);
    if (idx <= 0) {
      toast({
        title: "No previous term",
        description: "This is the first term of the year.",
      });
      return;
    }
    const prev = order[idx - 1];
    const { data, error } = await supabase
      .from("term_results")
      .select("*")
      .eq("class_id", selectedClass)
      .eq("term", prev)
      .eq("academic_year", academicYear);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const next: Record<string, Record<string, CellData>> = { ...marks };
    (data || []).forEach((r: any) => {
      if (!next[r.learner_id]) next[r.learner_id] = {};
      // Don't overwrite if already filled
      if (next[r.learner_id][r.subject_id]?.score) return;
      next[r.learner_id][r.subject_id] = {
        score: r.score?.toString() ?? "",
        letter: r.letter_grade ?? "",
        remarks: r.teacher_remarks ?? "",
        juz: r.juz_completed?.toString() ?? "",
      };
    });
    setMarks(next);
    setDirty(true);
    toast({ title: "Copied", description: `Pulled marks from ${prev.replace("_", " ")}.` });
  };

  // Per-learner academic totals (for inline display)
  const academicTotals = (learnerId: string) => {
    const scores: number[] = [];
    academicSubjects.forEach((s) => {
      const v = marks[learnerId]?.[s.id]?.score;
      if (v !== undefined && v !== "") {
        const n = parseFloat(v);
        if (!isNaN(n)) scores.push(n);
      }
    });
    return computeAggregate(scores);
  };

  return (
    <DashboardLayout
      title={t("marksEntry")}
      subtitle="Academic & Islamic studies — Uganda New Curriculum"
    >
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Select context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">{t("class")}</Label>
              <SearchableSelect
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                value={selectedClass}
                onValueChange={setSelectedClass}
                placeholder="Select class"
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">{t("term")}</Label>
              <SearchableSelect
                value={selectedTerm}
                onValueChange={(v) => setSelectedTerm(v as TermType)}
                options={terms}
                placeholder="Select term"
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">{t("academicYear")}</Label>
              <Input
                type="number"
                value={academicYear}
                onChange={(e) => setAcademicYear(parseInt(e.target.value) || currentYear)}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={handleCopyPrevious}
                disabled={!selectedClass}
                className="h-9 sm:h-10 flex-1"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy previous term</span>
                <span className="sm:hidden">Copy prev</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks grid */}
      {selectedClass && (
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-6">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {selectedClassData?.name} —{" "}
                {selectedTerm.replace("_", " ").toUpperCase()}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {classLearners.length} learners · {visibleSubjects.length} subjects
                {dirty && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    · unsaved changes
                  </span>
                )}
                {!dirty && saveResults.isSuccess && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> auto-saved
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/reports?class=${selectedClass}&term=${selectedTerm}&year=${academicYear}`,
                  )
                }
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Reports
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saveResults.isPending}
              >
                {saveResults.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
                <TabsTrigger value="academic" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic ({academicSubjects.length})
                </TabsTrigger>
                <TabsTrigger value="islamic" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Islamic ({islamicSubjects.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-4">
                {classLearners.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">
                    No learners in this class.
                  </p>
                ) : visibleSubjects.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">
                    No subjects configured for this category.
                  </p>
                ) : (
                  <MarksGrid
                    learners={classLearners}
                    subjects={visibleSubjects}
                    marks={marks}
                    onChange={updateCell}
                    onKeyNav={handleKeyNav}
                    classLevel={classLevel}
                    showAggregate={tab === "academic"}
                    aggregateFor={academicTotals}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

// ─── Grid component ─────────────────────────────────────────────────────────

interface MarksGridProps {
  learners: { id: string; full_name: string }[];
  subjects: Subject[];
  marks: Record<string, Record<string, CellData>>;
  onChange: (l: string, s: string, f: keyof CellData, v: string) => void;
  onKeyNav: (
    e: KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number,
    tr: number,
    tc: number,
  ) => void;
  classLevel?: number;
  showAggregate: boolean;
  aggregateFor: (id: string) => { total: number; average: number };
}

const MarksGrid = ({
  learners,
  subjects,
  marks,
  onChange,
  onKeyNav,
  classLevel,
  showAggregate,
  aggregateFor,
}: MarksGridProps) => {
  // columns per subject: numeric→1 (score), letter→1 (letter), descriptive→1 (remarks)
  const subjCols = subjects.length;
  const totalCols = subjCols + 1; // + remarks at end

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
      <Table className="text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card z-10 w-[50px]">#</TableHead>
            <TableHead className="sticky left-[50px] bg-card z-10 min-w-[160px]">
              Learner
            </TableHead>
            {subjects.map((s) => (
              <TableHead key={s.id} className="text-center min-w-[100px]">
                <div className="flex flex-col items-center">
                  <span>{s.name}</span>
                  <Badge variant="outline" className="mt-0.5 text-[10px]">
                    {s.grading_type === "numeric"
                      ? "0-100"
                      : s.grading_type === "letter"
                      ? "Grade"
                      : "Comment"}
                  </Badge>
                </div>
              </TableHead>
            ))}
            {showAggregate && (
              <>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Avg</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </>
            )}
            <TableHead className="min-w-[180px]">Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {learners.map((l, rowIdx) => {
            const agg = showAggregate ? aggregateFor(l.id) : null;
            const overallGrade = agg ? calculateGrade(agg.average, classLevel) : null;
            return (
              <TableRow key={l.id}>
                <TableCell className="sticky left-0 bg-card font-medium">{rowIdx + 1}</TableCell>
                <TableCell className="sticky left-[50px] bg-card font-medium whitespace-nowrap">
                  {l.full_name}
                </TableCell>
                {subjects.map((s, colIdx) => {
                  const cell = marks[l.id]?.[s.id] ?? blank;
                  const grade =
                    s.grading_type === "numeric" && cell.score !== ""
                      ? calculateGrade(parseFloat(cell.score), classLevel)
                      : null;
                  return (
                    <TableCell key={s.id} className="p-1.5">
                      {s.grading_type === "numeric" && (
                        <div className="flex flex-col items-center gap-0.5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            data-cell={`${rowIdx}-${colIdx}`}
                            value={cell.score}
                            onChange={(e) =>
                              onChange(l.id, s.id, "score", e.target.value)
                            }
                            onKeyDown={(e) =>
                              onKeyNav(e, rowIdx, colIdx, learners.length, totalCols)
                            }
                            className={`h-8 w-16 text-center text-sm ${
                              grade ? toneToBgClass[grade.tone] : ""
                            }`}
                          />
                          {grade && (
                            <span className={`text-[10px] ${toneToTextClass[grade.tone]}`}>
                              {grade.grade}
                            </span>
                          )}
                        </div>
                      )}
                      {s.grading_type === "letter" && (
                        <SearchableSelect
                          value={cell.letter || undefined}
                          onValueChange={(v) => onChange(l.id, s.id, "letter", v)}
                          options={ISLAMIC_LETTER_OPTIONS.map(g => ({ value: g, label: g }))}
                          placeholder="—"
                          className="h-8 w-20 text-sm"
                        />
                      )}
                      {s.grading_type === "descriptive" && (
                        <Input
                          placeholder={s.code === "HIFZ" ? "Juz" : "Note"}
                          data-cell={`${rowIdx}-${colIdx}`}
                          value={s.code === "HIFZ" ? cell.juz : cell.remarks}
                          onChange={(e) =>
                            onChange(
                              l.id,
                              s.id,
                              s.code === "HIFZ" ? "juz" : "remarks",
                              e.target.value,
                            )
                          }
                          onKeyDown={(e) =>
                            onKeyNav(e, rowIdx, colIdx, learners.length, totalCols)
                          }
                          className="h-8 w-24 text-sm"
                        />
                      )}
                    </TableCell>
                  );
                })}
                {showAggregate && agg && (
                  <>
                    <TableCell className="text-center font-medium">
                      {agg.total || "—"}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {agg.average ? agg.average.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-center ${
                        overallGrade ? toneToTextClass[overallGrade.tone] : ""
                      }`}
                    >
                      {overallGrade?.grade ?? "—"}
                    </TableCell>
                  </>
                )}
                <TableCell className="p-1.5">
                  <Input
                    placeholder="Teacher remarks…"
                    value={marks[l.id]?.[subjects[0]?.id]?.remarks ?? ""}
                    onChange={(e) =>
                      subjects[0] &&
                      onChange(l.id, subjects[0].id, "remarks", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MarksEntry;
