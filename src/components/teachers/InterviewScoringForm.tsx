// @ts-nocheck
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { INTERVIEW_CRITERIA, type TeacherApplicant, type InterviewScore } from "@/hooks/useTeacherApplicants";
import { Loader2, ClipboardList } from "lucide-react";

interface InterviewScoringFormProps {
  applicant: TeacherApplicant;
  onSave: (scores: InterviewScore[], remarks: string) => Promise<void>;
  isSaving?: boolean;
}

export function InterviewScoringForm({ applicant, onSave, isSaving }: InterviewScoringFormProps) {
  const existing = applicant.interview_scores || [];
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of INTERVIEW_CRITERIA) {
      const found = existing.find((e) => e.criteria === c.key);
      init[c.key] = found ? String(found.score) : "";
    }
    return init;
  });
  const [scoreNotes, setScoreNotes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of INTERVIEW_CRITERIA) {
      const found = existing.find((e) => e.criteria === c.key);
      init[c.key] = found?.notes || "";
    }
    return init;
  });
  const [remarks, setRemarks] = useState(applicant.interviewer_remarks || "");

  const total = useMemo(() => {
    let sum = 0;
    for (const c of INTERVIEW_CRITERIA) {
      const val = parseInt(scores[c.key] || "0", 10);
      if (!isNaN(val)) sum += Math.min(val, c.maxScore);
    }
    return sum;
  }, [scores]);

  const maxTotal = INTERVIEW_CRITERIA.reduce((s, c) => s + c.maxScore, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const interviewScores: InterviewScore[] = INTERVIEW_CRITERIA.map((c) => ({
      criteria: c.key,
      score: Math.min(parseInt(scores[c.key] || "0", 10), c.maxScore),
      max_score: c.maxScore,
      notes: scoreNotes[c.key] || "",
    }));
    await onSave(interviewScores, remarks);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b pb-2">
        <ClipboardList className="h-4 w-4" />
        Interview Scorecard — {applicant.full_name}
      </div>

      <div className="grid gap-4">
        {INTERVIEW_CRITERIA.map((c) => (
          <Card key={c.key} className="border border-slate-200 p-4 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700">{c.label}</Label>
                <p className="text-[10px] text-muted-foreground">Max score: {c.maxScore}</p>
              </div>
              <div className="w-20 shrink-0">
                <Input
                  type="number"
                  min={0}
                  max={c.maxScore}
                  value={scores[c.key]}
                  onChange={(e) => setScores({ ...scores, [c.key]: e.target.value })}
                  className="h-10 text-center font-bold text-lg"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="mt-2">
              <Textarea
                rows={1}
                value={scoreNotes[c.key]}
                onChange={(e) => setScoreNotes({ ...scoreNotes, [c.key]: e.target.value })}
                placeholder="Notes for this criterion..."
                className="text-xs resize-none"
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
        <span className="text-sm font-bold text-slate-700">Total Score</span>
        <span className="text-2xl font-black text-primary">
          {total} <span className="text-base text-muted-foreground">/ {maxTotal}</span>
        </span>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interviewer Remarks</Label>
        <Textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Overall observations, strengths, areas for improvement..."
        />
      </div>

      <Button type="submit" disabled={isSaving} className="w-full">
        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Scores...</> : "Save Scores"}
      </Button>
    </form>
  );
}
