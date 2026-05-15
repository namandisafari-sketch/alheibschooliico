// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, Save } from "lucide-react";

const TeacherGradebook = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("term_1");
  const [learners, setLearners] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { score: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get classes where teacher is lead
      const { data: leadCls } = await supabase
        .from("classes")
        .select("id, name, level")
        .eq("teacher_id", user.id);
      
      // Get classes where teacher is assigned to any subject
      const { data: assigned } = await supabase
        .from("teacher_assignments")
        .select("class_id, classes(id, name, level)")
        .eq("teacher_id", user.id);

      const allClassMap = new Map();
      (leadCls || []).forEach(c => allClassMap.set(c.id, c));
      (assigned || []).forEach(a => {
        if (a.classes) allClassMap.set(a.class_id, a.classes);
      });

      setClasses(Array.from(allClassMap.values()));

      const { data: subs } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      setSubjects(subs || []);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const { data: ls } = await supabase
        .from("learners")
        .select("id, full_name, admission_number")
        .eq("class_id", classId)
        .order("full_name");
      setLearners(ls || []);
      if (subjectId) {
        const { data: existing } = await supabase
          .from("term_results")
          .select("learner_id, score, teacher_remarks")
          .eq("class_id", classId)
          .eq("subject_id", subjectId)
          .eq("term", term);
        const m: any = {};
        (existing || []).forEach((r: any) => {
          m[r.learner_id] = { score: r.score?.toString() || "", remarks: r.teacher_remarks || "" };
        });
        setMarks(m);
      }
    })();
  }, [classId, subjectId, term]);

  const saveAll = async () => {
    if (!classId || !subjectId) {
      toast({ title: "Pick a class and subject first", variant: "destructive" });
      return;
    }
    setSaving(true);
    const rows = learners
      .filter((l) => marks[l.id]?.score)
      .map((l) => {
        const score = Number(marks[l.id].score);
        let competency = "developing";
        if (score >= 80) competency = "outstanding";
        else if (score >= 65) competency = "proficient";
        else if (score >= 50) competency = "developing";
        else competency = "beginning";
        return {
          learner_id: l.id,
          class_id: classId,
          subject_id: subjectId,
          term,
          academic_year: new Date().getFullYear(),
          score,
          teacher_remarks: marks[l.id].remarks || null,
          competency_rating: competency,
          recorded_by: user.id,
        };
      });
    if (!rows.length) {
      toast({ title: "Nothing to save" });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("term_results").upsert(rows, {
      onConflict: "learner_id,subject_id,term,academic_year",
    } as any);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: `Saved marks for ${rows.length} learners` });
  };

  const avg = useMemo(() => {
    const scores = Object.values(marks).map((m) => Number(m.score)).filter((n) => !isNaN(n) && n > 0);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
  }, [marks]);

  return (
    <FeaturePageShell
      title="Gradebook"
      subtitle="Per-class continuous assessment register"
      icon={BookOpenCheck}
      badge="Teacher"
      features={[
        "Filter by class, subject, term",
        "Inline score & remarks editing",
        "Automatic competency rating",
        "Saves to term results",
      ]}
    >
      <Card>
        <CardContent className="p-5 grid gap-3 sm:grid-cols-3">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="term_1">Term 1</SelectItem>
              <SelectItem value="term_2">Term 2</SelectItem>
              <SelectItem value="term_3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!!learners.length && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Class average</p>
                <p className="text-2xl font-black">{avg}%</p>
              </div>
              <Button onClick={saveAll} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save all"}
              </Button>
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {learners.map((l) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-2">
                  <div className="col-span-5">
                    <p className="text-sm font-semibold">{l.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.admission_number}</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Score"
                    className="col-span-2"
                    value={marks[l.id]?.score || ""}
                    onChange={(e) =>
                      setMarks((m) => ({ ...m, [l.id]: { score: e.target.value, remarks: m[l.id]?.remarks || "" } }))
                    }
                  />
                  <Textarea
                    placeholder="Remarks"
                    rows={1}
                    className="col-span-5 min-h-[2.25rem]"
                    value={marks[l.id]?.remarks || ""}
                    onChange={(e) =>
                      setMarks((m) => ({ ...m, [l.id]: { score: m[l.id]?.score || "", remarks: e.target.value } }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {classId && !learners.length && (
        <p className="text-sm text-muted-foreground">No learners in this class yet.</p>
      )}
    </FeaturePageShell>
  );
};

export default TeacherGradebook;
