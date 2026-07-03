// UNEB-style grading utilities — Uganda Primary Standard (D1-F9) for all levels

export interface GradeBand {
  grade: string;
  remark: string;
  /** semantic color token suffix; resolves to `text-grade-*` / `bg-grade-*` */
  tone: "excellent" | "good" | "fair" | "weak" | "fail";
}

export interface GradeBoundaryDB {
  id: string;
  grade: string;
  min_score: number;
  max_score: number;
  remark: string | null;
  color: string | null;
  sort_order: number;
}

export interface GradingScaleDB {
  id: string;
  name: string;
  grading_type: "numeric" | "letter" | "descriptive";
  description: string | null;
  is_default: boolean;
  boundaries: GradeBoundaryDB[];
}

export const PLE_BANDS: { min: number; band: GradeBand }[] = [
  { min: 80, band: { grade: "D1", remark: "Distinction", tone: "excellent" } },
  { min: 75, band: { grade: "D2", remark: "Distinction", tone: "excellent" } },
  { min: 70, band: { grade: "C3", remark: "Credit", tone: "good" } },
  { min: 65, band: { grade: "C4", remark: "Credit", tone: "good" } },
  { min: 60, band: { grade: "C5", remark: "Credit", tone: "good" } },
  { min: 55, band: { grade: "C6", remark: "Credit", tone: "good" } },
  { min: 50, band: { grade: "P7", remark: "Pass", tone: "fair" } },
  { min: 45, band: { grade: "P8", remark: "Pass", tone: "fair" } },
  { min: 0, band: { grade: "F9", remark: "Fail", tone: "fail" } },
];

export const LOWER_BANDS: { min: number; band: GradeBand }[] = [
  { min: 80, band: { grade: "A", remark: "Excellent", tone: "excellent" } },
  { min: 70, band: { grade: "B", remark: "Very Good", tone: "good" } },
  { min: 60, band: { grade: "C", remark: "Good", tone: "good" } },
  { min: 50, band: { grade: "D", remark: "Fair", tone: "fair" } },
  { min: 0, band: { grade: "E", remark: "Needs Improvement", tone: "weak" } },
];

export const ISLAMIC_LETTER_OPTIONS = ["A", "B+", "B", "C+", "C", "D", "E"];

export const calculateGrade = (
  score: number | null | undefined,
  classLevel?: number,
  bands?: { min: number; band: GradeBand }[],
): GradeBand => {
  if (score === null || score === undefined || isNaN(score)) {
    return { grade: "-", remark: "-", tone: "fair" };
  }
  const sorted = bands ?? (classLevel && classLevel >= 5 ? PLE_BANDS : LOWER_BANDS);
  const found = sorted.find((b) => score >= b.min);
  return found?.band ?? { grade: "F9", remark: "Fail", tone: "fail" };
};

const toneForGrade = (grade: string): GradeBand["tone"] => {
  const top = ["D1", "D2", "A", "B+", "Exceeding", "Outstanding"];
  const mid = ["C3", "C4", "C5", "C6", "B", "C+", "Meeting"];
  const low = ["P7", "P8", "C", "D", "Approaching"];
  if (top.includes(grade)) return "excellent";
  if (mid.includes(grade)) return "good";
  if (low.includes(grade)) return "fair";
  if (grade === "E" || grade === "F9" || grade === "Beginning") return "fail";
  return "fair";
};

const toneForRemark = (remark: string | null): GradeBand["tone"] => {
  const r = (remark || "").toLowerCase();
  if (r.includes("distinct") || r.includes("excellent") || r.includes("outstanding")) return "excellent";
  if (r.includes("credit") || r.includes("good") || r.includes("meeting") || r.includes("very")) return "good";
  if (r.includes("pass") || r.includes("fair") || r.includes("average") || r.includes("approach")) return "fair";
  if (r.includes("fail") || r.includes("need") || r.includes("beginning") || r.includes("below")) return "weak";
  return "fair";
};

export const bandsFromScale = (scale: GradingScaleDB): { min: number; band: GradeBand }[] => {
  return (scale.boundaries || [])
    .sort((a, b) => b.min_score - a.min_score)
    .map((b) => ({
      min: b.min_score,
      band: {
        grade: b.grade,
        remark: b.remark || "",
        tone: toneForRemark(b.remark) || toneForGrade(b.grade),
      },
    }));
};

export const fetchDefaultScale = async (
  gradingType?: string,
): Promise<GradingScaleDB | null> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    let query = supabase
      .from("grading_scales")
      .select("*, boundaries:grade_boundaries(*)")
      .eq("is_active", true)
      .order("name");

    if (gradingType) {
      query = query.eq("grading_type", gradingType);
    }

    const { data } = await query.limit(1).single();
    return data;
  } catch {
    return null;
  }
};

export const loadGradeBands = async (gradingType?: string): Promise<{ min: number; band: GradeBand }[] | null> => {
  const scale = await fetchDefaultScale(gradingType);
  if (scale && scale.boundaries?.length) {
    return bandsFromScale(scale);
  }
  return null;
};

export const toneToTextClass: Record<GradeBand["tone"], string> = {
  excellent: "text-emerald-600 dark:text-emerald-400 font-bold",
  good: "text-emerald-700 dark:text-emerald-300 font-semibold",
  fair: "text-amber-600 dark:text-amber-400 font-medium",
  weak: "text-orange-600 dark:text-orange-400 font-medium",
  fail: "text-red-600 dark:text-red-400 font-bold",
};

export const toneToBgClass: Record<GradeBand["tone"], string> = {
  excellent: "bg-emerald-50 dark:bg-emerald-950/40",
  good: "bg-emerald-50/60 dark:bg-emerald-950/20",
  fair: "bg-amber-50/60 dark:bg-amber-950/20",
  weak: "bg-orange-50/60 dark:bg-orange-950/20",
  fail: "bg-red-50/60 dark:bg-red-950/20",
};

export const computeAggregate = (scores: number[]) => {
  if (scores.length === 0) return { total: 0, average: 0 };
  const total = scores.reduce((a, b) => a + b, 0);
  return { total, average: total / scores.length };
};

// Competency thresholds used to derive competency ratings from numeric scores.
// These mirror common thresholds used in primary assessments and can be
// adjusted to match specific curricula (e.g., Uganda Primary Curriculum).
export const COMPETENCY_THRESHOLDS = {
  exceeding: 75,
  meeting: 60,
  approaching: 45,
};

export const getCompetencyLevel = (
  score: number | null | undefined,
): "exceeding" | "meeting" | "approaching" | "beginning" => {
  if (score === null || score === undefined || isNaN(score)) return "meeting";
  if (score >= COMPETENCY_THRESHOLDS.exceeding) return "exceeding";
  if (score >= COMPETENCY_THRESHOLDS.meeting) return "meeting";
  if (score >= COMPETENCY_THRESHOLDS.approaching) return "approaching";
  return "beginning";
};

export const getPLEPoint = (score: number | null): number => {
  if (score === null || isNaN(score)) return 9;
  if (score >= 80) return 1; // D1
  if (score >= 75) return 2; // D2
  if (score >= 70) return 3; // C3
  if (score >= 65) return 4; // C4
  if (score >= 60) return 5; // C5
  if (score >= 55) return 6; // C6
  if (score >= 50) return 7; // P7
  if (score >= 45) return 8; // P8
  return 9; // F9
};

export const getDivision = (aggregate: number): string => {
  if (aggregate <= 12) return "I";
  if (aggregate <= 23) return "II";
  if (aggregate <= 29) return "III";
  if (aggregate <= 33) return "IV";
  return "U";
};

export const overallRemark = (avg: number): string => {
  if (avg >= 80) return "Excellent performance — keep it up!";
  if (avg >= 70) return "Very good work this term.";
  if (avg >= 60) return "Good effort — aim higher next term.";
  if (avg >= 50) return "Fair performance — more focus required.";
  if (avg >= 40) return "Below average — needs serious attention.";
  return "Poor performance — urgent improvement required.";
};
