// UNEB-style grading utilities — auto by class level
// P1-P4 = Lower Primary (A-E), P5-P7 = Upper Primary (D1-F9)

export interface GradeBand {
  grade: string;
  remark: string;
  /** semantic color token suffix; resolves to `text-grade-*` / `bg-grade-*` */
  tone: "excellent" | "good" | "fair" | "weak" | "fail";
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
  classLevel: number | undefined,
): GradeBand => {
  if (score === null || score === undefined || isNaN(score)) {
    return { grade: "-", remark: "-", tone: "fair" };
  }
  const bands = (classLevel ?? 1) >= 5 ? PLE_BANDS : LOWER_BANDS;
  const found = bands.find((b) => score >= b.min);
  return found?.band ?? { grade: "F", remark: "Fail", tone: "fail" };
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

export const overallRemark = (avg: number): string => {
  if (avg >= 80) return "Excellent performance — keep it up!";
  if (avg >= 70) return "Very good work this term.";
  if (avg >= 60) return "Good effort — aim higher next term.";
  if (avg >= 50) return "Fair performance — more focus required.";
  if (avg >= 40) return "Below average — needs serious attention.";
  return "Poor performance — urgent improvement required.";
};
