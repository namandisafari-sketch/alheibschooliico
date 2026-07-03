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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Save,
  FileText,
  GraduationCap,
  BookOpen,
  Copy,
  CheckCircle2,
  Calendar,
  BarChart3,
  Printer,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import {
  calculateGrade,
  toneToBgClass,
  toneToTextClass,
  ISLAMIC_LETTER_OPTIONS,
  computeAggregate,
  getCompetencyLevel,
  loadGradeBands,
  GradeBand,
} from "@/lib/grading";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/hooks/useAuth";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useExamSeries, useCurriculumPlans } from "@/hooks/useAcademicPlanning";
import { useSchemeOfWork } from "@/hooks/useSyllabusTracking";
import { useLessonPlans } from "@/hooks/useLessonPlans";

type CompetencyLevel = Database["public"]["Enums"]["competency_level"];
type TermType = Database["public"]["Enums"]["term_type"];

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
  const { user, role } = useAuth();
  const { data: academicSettings } = useAcademicSettings();
  const [searchParams] = useSearchParams();
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();

  const terms = (academicSettings?.terms ?? []).map((term: any) => ({
    value: term.id as TermType,
    label: term.name,
  }));

  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get("class") || "");
  const [selectedTerm, setSelectedTerm] = useState<TermType>(() => {
    const savedTerm = academicSettings?.current_term_id;
    return (savedTerm === "term_1" || savedTerm === "term_2" || savedTerm === "term_3") ? savedTerm : "term_1";
  });
  const [academicYear, setAcademicYear] = useState<number>(currentYear);
  const isTheologyRole = role === "theology_teacher" || role === "dos_theology";
  const isSecularTeacher = role === "teacher";
  const defaultTab: "academic" | "islamic" = isTheologyRole ? "islamic" : isSecularTeacher ? "academic" : searchParams.get("tab") === "islamic" ? "islamic" : "academic";
  const [tab, setTab] = useState<"academic" | "islamic">(defaultTab);
  const [learnerSearch, setLearnerSearch] = useState("");
  const [scoreCardLearnerId, setScoreCardLearnerId] = useState<string | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<string>("exam");
  const [selectedExamSeries, setSelectedExamSeries] = useState<string>("");
  const [selectedExamSlot, setSelectedExamSlot] = useState<string>("");
  const [selectedSubjectForLinking, setSelectedSubjectForLinking] = useState<string>("");
  const [selectedSchemeOfWork, setSelectedSchemeOfWork] = useState<string>("");
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<string>("");
  const { data: examSeries = [] } = useExamSeries();
  const { data: examSlots = [] } = useQuery({
    queryKey: ["exam-slots-for-marks", selectedExamSeries, selectedClass],
    queryFn: async () => {
      if (!selectedExamSeries && !selectedClass) return [];
      let q = supabase
        .from("exam_timetable")
        .select("id, exam_date, start_time, subject_id, class_id, subjects!inner(name)")
        .order("exam_date")
        .order("start_time");
      if (selectedExamSeries) q = q.eq("series_id", selectedExamSeries);
      if (selectedClass) q = q.eq("class_id", selectedClass);
      const { data } = await q;
      return data || [];
    },
    enabled: !!selectedExamSeries || !!selectedClass,
  });
  // marks[learnerId][subjectId] = CellData
  const [marks, setMarks] = useState<
    Record<string, Record<string, CellData>>
  >({});
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data: classes = [] } = useClasses();
  const { data: allLearners = [], isError: learnersError, error: learnersQueryError } = useLearners();

  // Roles that see all classes/subjects (unscoped)
  const isUnscoped = ["admin", "dos", "dos_theology", "head_teacher", "center_director"].includes(role);
  // Teacher-scoped class/subject filtering (only for classroom teachers)
  const { data: teacherClassIds = [] } = useQuery({
    queryKey: ["marks-teacher-classes", user?.id],
    queryFn: async () => {
      const [{ data: ta }, { data: lc }] = await Promise.all([
        supabase.from("teacher_assignments").select("class_id").eq("teacher_id", user?.id),
        supabase.from("classes").select("id").eq("teacher_id", user?.id),
      ]);
      const ids = new Set<string>();
      (ta || []).forEach((a: any) => { if (a.class_id) ids.add(a.class_id); });
      (lc || []).forEach((c: any) => ids.add(c.id));
      return [...ids];
    },
    enabled: !isUnscoped && !!user?.id,
  });
  const { data: teacherSubjectIds = [] } = useQuery({
    queryKey: ["marks-teacher-subjects", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_assignments").select("subject_id").eq("teacher_id", user?.id);
      const ids = new Set<string>();
      (data || []).forEach((a: any) => { if (a.subject_id) ids.add(a.subject_id); });
      return [...ids];
    },
    enabled: !isUnscoped && !!user?.id,
  });

  const isScopedTeacher = !isUnscoped && (role === "teacher" || role === "theology_teacher");
  const filteredClasses = isScopedTeacher && teacherClassIds.length > 0
    ? classes.filter((c: any) => teacherClassIds.includes(c.id))
    : classes;

  const selectedClassData = filteredClasses.find((c) => c.id === selectedClass);
  const classLevel = selectedClassData?.level;

  // Load DB-driven grading scale bands
  const { data: gradeBands } = useQuery({
    queryKey: ["grade-bands"],
    queryFn: () => loadGradeBands("numeric"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allSubjects = [] } = useSubjects(classLevel);

  const filteredSubjects = isScopedTeacher && teacherSubjectIds.length > 0
    ? allSubjects.filter((s: any) => teacherSubjectIds.includes(s.id))
    : allSubjects;

  const subjects = filteredSubjects;
  const { data: existingResults = [] } = useTermResults(
    selectedClass,
    selectedTerm,
    academicYear,
  );
  const saveResults = useSaveTermResults();

  const isFormative = ["exercise", "activity", "homework"].includes(assessmentType);

  // For unscoped roles (admin/DOS), don't filter by teacherId so they see all schemes
  const { data: schemesForLinking = [] } = useSchemeOfWork({
    teacherId: isUnscoped ? undefined : user?.id,
    classId: isFormative ? selectedClass : undefined,
    subjectId: selectedSubjectForLinking || undefined,
    term: isFormative ? selectedTerm : undefined,
    academicYear: isFormative ? academicYear : undefined,
  });

  const { data: lessonPlansForLinking = [] } = useLessonPlans({
    teacherId: isUnscoped ? undefined : user?.id,
    classId: isFormative ? selectedClass : undefined,
    subjectId: selectedSubjectForLinking || undefined,
    term: isFormative ? selectedTerm : undefined,
    academicYear: isFormative ? academicYear : undefined,
  });

  const { data: curriculumPlans = [] } = useCurriculumPlans(
    isFormative ? selectedClass : undefined,
    selectedSubjectForLinking || undefined,
    isFormative ? selectedTerm : undefined,
    isFormative ? academicYear : undefined,
  );

  // Merge scheme_of_work + curriculum_plans into a single linking dropdown.
  // Curriculum plans that already have a corresponding scheme_of_work entry
  // are filtered out to avoid duplicates (same topic shown twice).
  const mergedLinkingOptions = useMemo(() => {
    const existingKeys = new Set(
      schemesForLinking.map((s: any) => `${s.class_id}-${s.subject_id}-${s.topic}-${s.week_number}`),
    );
    const fromSchemes = schemesForLinking.map((s: any) => ({
      id: s.id,
      label: `Week ${s.week_number} — ${s.topic}${s.sub_topic ? ` (${s.sub_topic})` : ""}`,
      type: "scheme" as const,
      source: "scheme_of_work" as const,
    }));
    const fromCurriculum = curriculumPlans
      .filter((cp: any) => !existingKeys.has(`${cp.class_id}-${cp.subject_id}-${cp.topic_title}-${cp.sequence_order}`))
      .map((cp: any) => ({
        id: cp.id,
        label: `Curriculum: ${cp.topic_title}`,
        type: "curriculum" as const,
        source: "curriculum_plans" as const,
      }));
    return [...fromSchemes, ...fromCurriculum].sort((a, b) => a.label.localeCompare(b.label));
  }, [schemesForLinking, curriculumPlans]);

  const filteredSchemes = mergedLinkingOptions;
  const filteredLessonPlans = selectedSchemeOfWork
    ? lessonPlansForLinking.filter((lp: any) => lp.scheme_of_work_id === selectedSchemeOfWork)
    : lessonPlansForLinking;


  const classLearners = useMemo(
    () => allLearners.filter((l) => l.class_id === selectedClass),
    [allLearners, selectedClass],
  );

  const filteredLearners = useMemo(
    () =>
      classLearners.filter((l) =>
        l.full_name.toLowerCase().includes(learnerSearch.toLowerCase()),
      ),
    [classLearners, learnerSearch],
  );

  useEffect(() => {
    if (!selectedClass) {
      setSelectedLearner("");
      return;
    }
    if (!filteredLearners.some((l) => l.id === selectedLearner)) {
      setSelectedLearner(filteredLearners[0]?.id || "");
    }
  }, [filteredLearners, selectedClass, selectedLearner]);

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
    existingResults
      .filter((r) => (r as any).assessment_type === assessmentType || !(r as any).assessment_type)
      .forEach((r) => {
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
  }, [existingResults, selectedClass, selectedTerm, academicYear, assessmentType]);

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

        // Derive competency from score for numeric grading, use letter mapping for others
        let competency: CompetencyLevel = "meeting";
        if (cell.score !== "") {
          const s = parseFloat(cell.score);
          competency = getCompetencyLevel(s);
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
          assessment_type: assessmentType,
          exam_slot_id: isFormative ? null : (selectedExamSlot || null),
          scheme_of_work_id: isFormative ? (selectedSchemeOfWork || null) : null,
          lesson_plan_id: isFormative ? (selectedLessonPlan || null) : null,
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

  // Handle scheme/curriculum selection — auto-create scheme_of_work from curriculum plans
  const handleSchemeSelect = async (value: string) => {
    const option = mergedLinkingOptions.find((o: any) => o.id === value);
    if (option?.source === "curriculum_plans") {
      const cp = curriculumPlans.find((c: any) => c.id === value);
      if (cp) {
        const { data: userData } = await supabase.auth.getUser();
        const { data: newScheme } = await supabase
          .from("scheme_of_work")
          .insert({
            teacher_id: userData.user?.id,
            class_id: cp.class_id,
            subject_id: cp.subject_id,
            week_number: cp.sequence_order,
            term: selectedTerm,
            academic_year: academicYear,
            topic: cp.topic_title,
            status: "draft",
          })
          .select()
          .single();
        if (newScheme) {
          setSelectedSchemeOfWork(newScheme.id);
          setSelectedLessonPlan("");
          toast({ title: "Scheme created", description: `Auto-created from curriculum: ${cp.topic_title}` });
          return;
        }
      }
    }
    setSelectedSchemeOfWork(value);
    setSelectedLessonPlan("");
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
          <div className="space-y-2">
            <CardTitle className="text-lg sm:text-xl">Select context</CardTitle>
            <CardDescription>
              Choose the class, term, and academic year before entering grades. You can also pull marks from the previous term for a faster start.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">{t("class")}</Label>
              <SearchableSelect
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                value={selectedClass}
                onValueChange={setSelectedClass}
                placeholder="Pick a class"
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
          {/* Assessment type & linking (exam vs scheme-of-work/lesson-plan) */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm flex items-center gap-1"><BookOpen className="h-3 w-3" /> Assessment Type</Label>
              <Select value={assessmentType} onValueChange={(v) => {
                setAssessmentType(v);
                if (["exercise", "activity", "homework"].includes(v)) {
                  setSelectedExamSeries("");
                  setSelectedExamSlot("");
                } else {
                  setSelectedSubjectForLinking("");
                  setSelectedSchemeOfWork("");
                  setSelectedLessonPlan("");
                }
              }}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="homework">Homework</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFormative ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm flex items-center gap-1"><BookOpen className="h-3 w-3" /> Subject (linking)</Label>
                  <Select value={selectedSubjectForLinking} onValueChange={(v) => { setSelectedSubjectForLinking(v); setSelectedSchemeOfWork(""); setSelectedLessonPlan(""); }}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm flex items-center gap-1"><Calendar className="h-3 w-3" /> Scheme of Work</Label>
                  <Select value={selectedSchemeOfWork} onValueChange={(v) => {
                    if (v === "__no_schemes" || v === selectedSchemeOfWork) return;
                    handleSchemeSelect(v);
                  }}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder={selectedSubjectForLinking ? "Select scheme" : "Pick subject first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSchemes.map((opt: any) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                      {filteredSchemes.length === 0 && selectedSubjectForLinking && (
                        <SelectItem value="__no_schemes" disabled>No schemes or curriculum topics found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm flex items-center gap-1"><BookOpen className="h-3 w-3" /> Lesson Plan</Label>
                  <Select value={selectedLessonPlan} onValueChange={setSelectedLessonPlan}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder={selectedSchemeOfWork ? "Select lesson" : "Pick scheme first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLessonPlans.map((lp: any) => (
                        <SelectItem key={lp.id} value={lp.id}>
                          {lp.title} {lp.date ? `(${lp.date.slice(0, 10)})` : ""}
                        </SelectItem>
                      ))}
                      {filteredLessonPlans.length === 0 && selectedSchemeOfWork && (
                        <SelectItem value="__no_plans" disabled>No lesson plans found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm flex items-center gap-1"><Calendar className="h-3 w-3" /> Exam Series</Label>
                  <Select value={selectedExamSeries} onValueChange={(v) => { setSelectedExamSeries(v === "none" ? "" : v); setSelectedExamSlot(""); }}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="None (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {examSeries.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Exam Slot</Label>
                  <Select value={selectedExamSlot} onValueChange={(v) => setSelectedExamSlot(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="Select slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {examSlots.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.subjects?.name} — {s.exam_date?.slice(0, 10)} {s.start_time?.slice(0, 5)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marks grid */}
      {selectedClass && (
        <Card className="mt-4 sm:mt-6">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Easy mark entry for teachers</div>
              <div className="grid gap-2 sm:grid-cols-3 pt-2">
                <div>1. Confirm class, term, and academic year.</div>
                <div>2. Enter score/grade/note directly in each cell.</div>
                <div>3. Use Enter or arrows to move quickly between fields.</div>
              </div>
            </div>
            <CardHeader className="flex flex-col gap-4 pb-3 sm:pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {selectedClassData?.name} — {selectedTerm.replace("_", " ").toUpperCase()}
                </CardTitle>
                <CardDescription>
                  Enter learner marks for the selected term and academic year. Changes are automatically tracked while you work.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5">
                  {classLearners.length} learners
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5">
                  {visibleSubjects.length} subjects
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5">
                  {academicYear}
                </Badge>
                <Badge variant="outline" className="px-3 py-1.5 text-slate-700">
                  Auto-save enabled
                </Badge>
                {dirty ? (
                  <Badge variant="destructive" className="px-3 py-1.5">
                    Unsaved changes
                  </Badge>
                ) : saveResults.isSuccess ? (
                  <Badge variant="outline" className="px-3 py-1.5 text-emerald-700">
                    <CheckCircle2 className="mr-1 inline-block h-3.5 w-3.5" /> Saved
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
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
              {isFormative && selectedLearner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScoreCardLearnerId(selectedLearner)}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Score Card
                </Button>
              )}
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
            <Tabs
              value={tab}
              onValueChange={(v) => {
                if (isTheologyRole || isSecularTeacher) return;
                setTab(v as any);
              }}
            >
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
                <TabsTrigger value="academic" className="gap-2" disabled={isTheologyRole}>
                  <GraduationCap className="h-4 w-4" />
                  Academic ({academicSubjects.length})
                </TabsTrigger>
                <TabsTrigger value="islamic" className="gap-2" disabled={isSecularTeacher}>
                  <BookOpen className="h-4 w-4" />
                  Islamic ({islamicSubjects.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-4">
                {classLearners.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-muted-foreground text-sm">
                      No learners in this class.
                    </p>
                    {learnersError ? (
                      <div className="mx-auto max-w-md rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                        <p className="font-semibold">Query error:</p>
                        <p className="mt-1 break-all">{(learnersQueryError as any)?.message || "Unknown error"}</p>
                        <p className="mt-1">Try refreshing the page or re-login.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground/60">
                          Total learners loaded: {allLearners.length}
                          {allLearners.length > 0 ? (
                            <span> · Example class_id: {allLearners[0].class_id?.slice(0, 12) || "null"}…</span>
                          ) : " — no data returned"}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          Your class: {selectedClass} ({selectedClassData?.name || "unknown"})
                        </p>
                        {allLearners.length > 0 && selectedClass && (
                          <p className="text-xs text-muted-foreground/60">
                            Learners with this class_id: {allLearners.filter((l: any) => l.class_id === selectedClass).length}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-muted-foreground/60 pt-1">
                      Go to <strong>Academic Control → Learner Management</strong> to assign learners to classes.
                    </p>
                  </div>
                ) : visibleSubjects.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">
                    No subjects configured for this category.
                  </p>
                ) : (
                  <MarksGrid
                    learners={classLearners}
                    filteredLearners={filteredLearners}
                    selectedLearnerId={selectedLearner}
                    onLearnerSelect={setSelectedLearner}
                    learnerSearch={learnerSearch}
                    onSearchChange={setLearnerSearch}
                    subjects={visibleSubjects}
                    marks={marks}
                    onChange={updateCell}
                    onKeyNav={handleKeyNav}
                    classLevel={classLevel}
                    gradeBands={gradeBands}
                    showAggregate={tab === "academic"}
                    aggregateFor={academicTotals}
                  />
                )}
                {isFormative && (
                  <MasteryAnalysis
                    learners={classLearners}
                    subjects={visibleSubjects}
                    marks={marks}
                    onChange={updateCell}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </div>
        </Card>
      )}

      {/* Score Card dialog — only for formative assessments */}
      {isFormative && (
        <Dialog open={!!scoreCardLearnerId} onOpenChange={(o) => !o && setScoreCardLearnerId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Score Card</DialogTitle>
              <DialogDescription>
                {scoreCardLearnerId
                  ? `${classLearners.find((l) => l.id === scoreCardLearnerId)?.full_name} — ${assessmentType} assessment`
                  : "Select a learner to view their score card."}
                {selectedSubjectForLinking && (
                  <span className="block mt-1 text-xs">
                    Linked to: {
                      schemesForLinking.find((s: any) => s.id === selectedSchemeOfWork)
                        ? `Week ${schemesForLinking.find((s: any) => s.id === selectedSchemeOfWork)?.week_number} — ${schemesForLinking.find((s: any) => s.id === selectedSchemeOfWork)?.topic}`
                        : "No scheme linked"
                    }
                    {selectedLessonPlan && ` · Lesson: ${lessonPlansForLinking.find((lp: any) => lp.id === selectedLessonPlan)?.title || ""}`}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {scoreCardLearnerId && (
              <>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Print
                  </Button>
                </div>
                <ScoreCard
                  learner={classLearners.find((l) => l.id === scoreCardLearnerId)!}
                  subjects={visibleSubjects}
                  marks={marks[scoreCardLearnerId] ?? {}}
                  classLevel={classLevel}
                  gradeBands={gradeBands}
                  assessmentType={assessmentType}
                  className={selectedClassData?.name || ""}
                  term={selectedTerm}
                  academicYear={academicYear}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

// ─── Score Card component ───────────────────────────────────────────────────

const ScoreCard = ({
  learner,
  subjects,
  marks,
  classLevel,
  gradeBands = null,
  assessmentType,
  className,
  term,
  academicYear,
}: {
  learner: { id: string; full_name: string; admission_number?: string };
  subjects: Subject[];
  marks: Record<string, CellData>;
  classLevel?: number;
  gradeBands?: { min: number; band: GradeBand }[] | null;
  assessmentType: string;
  className: string;
  term: string;
  academicYear: number;
}) => {
  const termLabel = term.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border print:border-0">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-xl font-bold text-slate-900">Score Card</h2>
        <p className="text-sm text-muted-foreground">{className} — {termLabel} {academicYear}</p>
        <p className="text-sm text-muted-foreground capitalize">Assessment: {assessmentType}</p>
      </div>

      {/* Learner info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold">Learner:</span> {learner.full_name}
        </div>
        <div>
          <span className="font-semibold">ADM:</span> {learner.admission_number || "N/A"}
        </div>
      </div>

      {/* Subject scores */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Grade</TableHead>
            <TableHead className="text-center">Competency</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => {
            const cell = marks[subject.id] ?? blank;
            const hasContent = cell.score !== "" || cell.letter !== "" || cell.remarks !== "" || cell.juz !== "";
            if (!hasContent) return null;

            const score = cell.score !== "" ? parseFloat(cell.score) : null;
            const grade = score !== null && !isNaN(score)
              ? calculateGrade(score, classLevel, gradeBands ?? undefined)
              : null;
            const competency = score !== null && !isNaN(score)
              ? getCompetencyLevel(score)
              : cell.letter
              ? (() => {
                  const l = cell.letter.charAt(0).toUpperCase();
                  return l === "A" ? "exceeding" : l === "B" ? "meeting" : l === "C" ? "approaching" : "beginning";
                })()
              : null;

            return (
              <TableRow key={subject.id}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell className="text-center">
                  {subject.grading_type === "numeric" ? (cell.score || "—") : "—"}
                  {subject.code === "HIFZ" && cell.juz && ` (Juz ${cell.juz})`}
                </TableCell>
                <TableCell className="text-center">
                  {grade ? (
                    <Badge variant="outline" className={toneToTextClass[grade.tone]}>
                      {grade.grade}
                    </Badge>
                  ) : cell.letter ? (
                    <Badge variant="outline">{cell.letter}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {competency ? (
                    <Badge variant="secondary" className="capitalize">{competency}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">
                  {cell.remarks || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        Generated by TennaHub School Management System · {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

// ─── Mastery Analysis component ─────────────────────────────────────────────

const MasteryAnalysis = ({
  learners,
  subjects,
  marks,
}: {
  learners: { id: string; full_name: string }[];
  subjects: Subject[];
  marks: Record<string, Record<string, CellData>>;
  onChange?: (learnerId: string, subjectId: string, field: keyof CellData, value: string) => void;
}) => {
  const analysis = useMemo(() => {
    return subjects.map((subject) => {
      const scores: number[] = [];
      const competencies: Record<string, number> = {
        exceeding: 0,
        meeting: 0,
        approaching: 0,
        beginning: 0,
        no_mark: 0,
      };

      learners.forEach((learner) => {
        const cell = marks[learner.id]?.[subject.id];
        if (!cell || (cell.score === "" && cell.letter === "")) {
          competencies.no_mark++;
          return;
        }
        const score = cell.score !== "" ? parseFloat(cell.score) : null;
        if (score !== null && !isNaN(score)) {
          scores.push(score);
          const level = getCompetencyLevel(score);
          competencies[level]++;
        } else if (cell.letter) {
          const l = cell.letter.charAt(0).toUpperCase();
          const level =
            l === "A" ? "exceeding" :
            l === "B" ? "meeting" :
            l === "C" ? "approaching" : "beginning";
          competencies[level]++;
        }
      });

      const avg = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
      const totalMarked = scores.length;
      const pctMastered = totalMarked > 0
        ? ((competencies.exceeding + competencies.meeting) / totalMarked) * 100
        : 0;
      const pctStruggling = totalMarked > 0
        ? ((competencies.approaching + competencies.beginning) / totalMarked) * 100
        : 0;
      const needsRepeat = totalMarked > 0 && pctStruggling > 40;

      return {
        subject,
        avg,
        scores,
        competencies,
        totalMarked,
        pctMastered: Math.round(pctMastered),
        pctStruggling: Math.round(pctStruggling),
        needsRepeat,
      };
    });
  }, [subjects, marks, learners]);

  const hasData = analysis.some((a) => a.totalMarked > 0);

  if (!hasData) return null;

  return (
    <Card className="mt-6 border-t-2 border-t-amber-400">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Mastery Analysis — Lesson Understanding
        </CardTitle>
        <CardDescription>
          Class-wide performance summary. Use this to decide if a lesson should be repeated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analysis.map((a) => {
            if (a.totalMarked === 0) return null;
            return (
              <div key={a.subject.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{a.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.totalMarked}/{learners.length} learners marked
                      {a.avg !== null ? ` · Class avg: ${a.avg.toFixed(1)}%` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={a.needsRepeat ? "destructive" : "default"}
                    className={a.needsRepeat ? "" : "bg-emerald-600"}
                  >
                    {a.needsRepeat ? "Needs repetition" : "Lesson understood"}
                  </Badge>
                </div>

                {/* Competency bar */}
                <div className="flex h-4 rounded-full overflow-hidden text-[10px] font-medium text-white mb-2">
                  {a.competencies.exceeding > 0 && (
                    <div
                      className="bg-emerald-500 flex items-center justify-center"
                      style={{ width: `${(a.competencies.exceeding / Math.max(a.totalMarked, 1)) * 100}%` }}
                    >
                      {a.competencies.exceeding > 0 && `${a.competencies.exceeding}E`}
                    </div>
                  )}
                  {a.competencies.meeting > 0 && (
                    <div
                      className="bg-blue-500 flex items-center justify-center"
                      style={{ width: `${(a.competencies.meeting / Math.max(a.totalMarked, 1)) * 100}%` }}
                    >
                      {a.competencies.meeting > 0 && `${a.competencies.meeting}M`}
                    </div>
                  )}
                  {a.competencies.approaching > 0 && (
                    <div
                      className="bg-amber-500 flex items-center justify-center"
                      style={{ width: `${(a.competencies.approaching / Math.max(a.totalMarked, 1)) * 100}%` }}
                    >
                      {a.competencies.approaching > 0 && `${a.competencies.approaching}A`}
                    </div>
                  )}
                  {a.competencies.beginning > 0 && (
                    <div
                      className="bg-red-500 flex items-center justify-center"
                      style={{ width: `${(a.competencies.beginning / Math.max(a.totalMarked, 1)) * 100}%` }}
                    >
                      {a.competencies.beginning > 0 && `${a.competencies.beginning}B`}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Exceeding ({a.competencies.exceeding})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Meeting ({a.competencies.meeting})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Approaching ({a.competencies.approaching})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Beginning ({a.competencies.beginning})
                  </span>
                </div>

                {a.needsRepeat && (
                  <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    <strong>Recommendation:</strong> {a.pctStruggling}% of learners are below the "Meeting" threshold.
                    Consider re-teaching this topic before moving on.
                  </div>
                )}
                {!a.needsRepeat && a.totalMarked > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <strong>Recommendation:</strong> {a.pctMastered}% of learners have mastered this topic.
                    Proceed to the next topic in the scheme of work.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Grid component ─────────────────────────────────────────────────────────

interface MarksGridProps {
  learners: { id: string; full_name: string }[];
  filteredLearners: { id: string; full_name: string }[];
  selectedLearnerId: string;
  onLearnerSelect: (learnerId: string) => void;
  learnerSearch: string;
  onSearchChange: (value: string) => void;
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
  gradeBands?: { min: number; band: GradeBand }[] | null;
  showAggregate: boolean;
  aggregateFor: (id: string) => { total: number; average: number };
}

const MarksGrid = ({
  learners,
  filteredLearners,
  selectedLearnerId,
  onLearnerSelect,
  learnerSearch,
  onSearchChange,
  subjects,
  marks,
  onChange,
  onKeyNav,
  classLevel,
  gradeBands = null,
  showAggregate,
  aggregateFor,
}: MarksGridProps) => {
  if (learners.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground text-sm">
        No learners in this class.
      </p>
    );
  }

  if (subjects.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground text-sm">
        No subjects configured for this category.
      </p>
    );
  }

  const visibleLearners = filteredLearners.length > 0 ? filteredLearners : learners;
  const selectedLearner = learners.find((l) => l.id === selectedLearnerId) || visibleLearners[0];
  const learnerMarks = selectedLearner ? marks[selectedLearner.id] ?? {} : {};
  const learnerAggregate =
    selectedLearner && showAggregate ? aggregateFor(selectedLearner.id) : null;
  const overallGrade = learnerAggregate
    ? calculateGrade(learnerAggregate.average, classLevel, gradeBands ?? undefined)
    : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit border border-slate-200/80 bg-card">
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Learners</CardTitle>
            <CardDescription>Search and select a learner to enter marks.</CardDescription>
          </div>
          <Badge variant="outline">
            {visibleLearners.length}/{learners.length}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search learners"
            value={learnerSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10"
          />
          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {visibleLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No learners match your search.
              </p>
            ) : (
              visibleLearners.map((learner, index) => (
                <button
                  type="button"
                  key={learner.id}
                  onClick={() => onLearnerSelect(learner.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    learner.id === selectedLearnerId
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{learner.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {learner.admission_number ? `ADM: ${learner.admission_number}` : "No admission number"}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">#{index + 1}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-card">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedLearner?.full_name || "Select a learner"}
              </CardTitle>
              <CardDescription>
                {selectedLearner ? (
                  <>
                    <span>ADM: {selectedLearner.admission_number || "N/A"}</span>
                    <span className="block mt-1">Enter marks for {selectedLearner.full_name}.</span>
                  </>
                ) : (
                  "Choose a learner from the left list to begin."
                )}
              </CardDescription>
            </div>
            {selectedLearner && showAggregate && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Total {learnerAggregate?.total ?? "—"}
                </Badge>
                <Badge variant="secondary">
                  Avg {learnerAggregate?.average ? learnerAggregate.average.toFixed(1) : "—"}
                </Badge>
                <Badge variant="outline">
                  {overallGrade?.grade ?? "No grade"}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedLearner ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject, rowIdx) => {
                const cell = learnerMarks[subject.id] ?? blank;
                const grade =
                  subject.grading_type === "numeric" && cell.score !== ""
                    ? calculateGrade(parseFloat(cell.score), classLevel, gradeBands ?? undefined)
                    : null;
                return (
                  <div
                    key={subject.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.grading_type === "numeric"
                            ? "Numeric score"
                            : subject.grading_type === "letter"
                            ? "Letter grade"
                            : subject.code === "HIFZ"
                            ? "HIFZ / Juz"
                            : "Notes"}
                        </p>
                      </div>
                      {grade && (
                        <Badge
                          variant="secondary"
                          className={`shrink-0 ${toneToTextClass[grade.tone]}`}
                        >
                          {grade.grade}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2">
                      {subject.grading_type === "numeric" && (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          data-cell={`${rowIdx}-0`}
                          value={cell.score}
                          onChange={(e) =>
                            onChange(selectedLearner.id, subject.id, "score", e.target.value)
                          }
                          onKeyDown={(e) =>
                            onKeyNav(e, rowIdx, 0, subjects.length, 1)
                          }
                          placeholder="Score"
                          className={`h-11 rounded-md border border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                            grade ? toneToBgClass[grade.tone] : ""
                          }`}
                        />
                      )}

                      {subject.grading_type === "letter" && (
                        <SearchableSelect
                          value={cell.letter || undefined}
                          onValueChange={(v) =>
                            onChange(selectedLearner.id, subject.id, "letter", v)
                          }
                          options={ISLAMIC_LETTER_OPTIONS.map((g) => ({ value: g, label: g }))}
                          placeholder="Select grade"
                          className="h-11 w-full text-sm"
                        />
                      )}

                      {subject.grading_type === "descriptive" && (
                        <Input
                          placeholder={subject.code === "HIFZ" ? "Juz completed" : "Add note"}
                          data-cell={`${rowIdx}-0`}
                          value={subject.code === "HIFZ" ? cell.juz : cell.remarks}
                          onChange={(e) =>
                            onChange(
                              selectedLearner.id,
                              subject.id,
                              subject.code === "HIFZ" ? "juz" : "remarks",
                              e.target.value,
                            )
                          }
                          onKeyDown={(e) =>
                            onKeyNav(e, rowIdx, 0, subjects.length, 1)
                          }
                          className="h-11 rounded-md border border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:col-span-2 lg:col-span-3">
                <div className="font-semibold">Quick entry tip</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Use Enter or arrow keys to move between fields. Select another learner to continue quickly.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
              Pick a learner to start entering marks.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarksEntry;
