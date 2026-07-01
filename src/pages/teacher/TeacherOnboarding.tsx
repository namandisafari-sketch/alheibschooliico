import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubjects } from "@/hooks/useSubjects";
import { useClasses } from "@/hooks/useClasses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, GraduationCap, BookOpen, Users, Sparkles, Loader2, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "subjects", title: "Subjects" },
  { id: "class-teacher", title: "Class Teacher" },
  { id: "review", title: "Review" },
];

export default function TeacherOnboarding() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: classes, isLoading: classesLoading } = useClasses();

  const [step, setStep] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isClassTeacher, setIsClassTeacher] = useState<boolean | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [animateIn, setAnimateIn] = useState(true);

  useEffect(() => {
    setAnimateIn(true);
    const timer = setTimeout(() => setAnimateIn(false), 500);
    return () => clearTimeout(timer);
  }, [step]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return selectedSubjects.length > 0;
      case 2: return isClassTeacher === false || (isClassTeacher === true && !!selectedClassId);
      case 3: return true;
      default: return false;
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const currentYear = new Date().getFullYear();
      const termMap = ["term_1", "term_2", "term_3"];
      const month = new Date().getMonth();
      const currentTerm = termMap[month < 4 ? 0 : month < 8 ? 1 : 2];

      if (isClassTeacher && selectedClassId) {
        const { error: classError } = await supabase
          .from("classes")
          .update({ teacher_id: user.id })
          .eq("id", selectedClassId);
        if (classError) throw classError;
      }

      if (selectedSubjects.length > 0) {
        const assignments = selectedSubjects.map((subjectId) => ({
          teacher_id: user.id,
          subject_id: subjectId,
          term: currentTerm,
          academic_year: currentYear,
        }));

        const { error: assignError } = await supabase
          .from("teacher_assignments")
          .upsert(assignments, {
            onConflict: "teacher_id,subject_id,academic_year",
            ignoreDuplicates: false,
          });
        if (assignError) throw assignError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (profileError) throw profileError;

      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-schedule-today"] });

      toast.success("Workspace set up successfully!", {
        description: "Welcome aboard! You can now access your full dashboard.",
      });

      navigate(role === "theology_teacher" ? "/teacher/theology" : "/teacher", { replace: true });
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Set Up Your Workspace
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Let's get your teaching environment ready in a few steps
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, idx) => {
            const isCompleted = idx < step;
            const isCurrent = idx === step;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                      isCompleted && "border-blue-600 bg-blue-600 text-white",
                      isCurrent && "border-blue-600 text-blue-600 ring-4 ring-blue-100",
                      !isCompleted && !isCurrent && "border-slate-200 text-slate-400 bg-white"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-[11px] font-bold uppercase tracking-wider",
                      isCompleted && "text-blue-600",
                      isCurrent && "text-slate-900",
                      !isCompleted && !isCurrent && "text-slate-400"
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-16 sm:w-24 mx-3 mb-6 transition-colors duration-300",
                      idx < step ? "bg-blue-600" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-slate-900">
              {STEPS[step].title}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {step === 0 && "Quick setup to personalise your teaching workspace"}
              {step === 1 && "Select the subjects you currently teach"}
              {step === 2 && "Let us know if you are a class teacher"}
              {step === 3 && "Review your selections before finishing"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className={cn(
              "transition-all duration-300",
              animateIn ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}>
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Welcome, Teacher!
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      We are excited to have you on board. In the next few steps, we will help you set up your workspace so you can hit the ground running.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { icon: BookOpen, label: "Your Subjects", desc: "Tell us which subjects you teach" },
                      { icon: Users, label: "Class Teacher", desc: "Indicate if you manage a class" },
                      { icon: School, label: "Ready to Go", desc: "Confirm and start teaching" },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-slate-100">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                          <item.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900">{item.label}</h4>
                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-sm text-amber-800 font-medium">
                      <strong>Tip:</strong> You can always update these settings later from your profile or by contacting your DOS.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Select Subjects */}
              {step === 1 && (
                <div className="space-y-4">
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 font-medium mb-4">
                        Select all the subjects you teach ({selectedSubjects.length} selected)
                      </p>
                      {subjects && subjects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                          <p className="text-slate-500 font-bold">No subjects have been set up yet.</p>
                          <p className="text-xs text-slate-400 mt-2">Contact the DOS to add subjects first.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                          {subjects?.map((subject) => {
                            const selected = selectedSubjects.includes(subject.id);
                            return (
                              <button
                                key={subject.id}
                                type="button"
                                onClick={() => toggleSubject(subject.id)}
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200",
                                  selected
                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                                    selected
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-slate-300"
                                  )}
                                >
                                  {selected && <Check className="h-3 w-3" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {subject.name}
                                  </p>
                                  {subject.code && (
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      {subject.code}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Class Teacher */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <h3 className="text-lg font-black text-slate-900 mb-2">Are you a Class Teacher?</h3>
                    <p className="text-sm text-slate-600">
                      A class teacher oversees a specific class — taking attendance, managing discipline, and acting as the primary point of contact for parents.
                    </p>
                  </div>

                  <RadioGroup
                    value={isClassTeacher === null ? "" : isClassTeacher ? "yes" : "no"}
                    onValueChange={(value) => {
                      setIsClassTeacher(value === "yes");
                      if (value === "no") setSelectedClassId("");
                    }}
                    className="gap-4"
                  >
                    <Label
                      htmlFor="ct-yes"
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                        isClassTeacher === true
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      <RadioGroupItem value="yes" id="ct-yes" />
                      <div>
                        <p className="font-black text-slate-900">Yes, I am a Class Teacher</p>
                        <p className="text-xs text-slate-500">I oversee a specific class</p>
                      </div>
                    </Label>

                    <Label
                      htmlFor="ct-no"
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                        isClassTeacher === false
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      <RadioGroupItem value="no" id="ct-no" />
                      <div>
                        <p className="font-black text-slate-900">No, I am a Subject Teacher</p>
                        <p className="text-xs text-slate-500">I only teach specific subjects</p>
                      </div>
                    </Label>
                  </RadioGroup>

                  {isClassTeacher === true && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <Label htmlFor="class-select" className="text-sm font-bold text-slate-700">
                        Select your class
                      </Label>
                      {classesLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-slate-500">Loading classes...</span>
                        </div>
                      ) : (
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                          <SelectTrigger id="class-select" className="rounded-2xl border-2 border-slate-200 h-12">
                            <SelectValue placeholder="Choose a class..." />
                          </SelectTrigger>
                          <SelectContent>
                            {classes?.filter((c) => !c.teacher_id || c.teacher_id === user?.id).map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} {cls.teacher_id ? "(currently assigned to you)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Sparkles className="h-5 w-5" />
                      <p className="text-sm font-bold">Almost done! Please review your selections.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                        Subjects You Teach
                      </h4>
                      {selectedSubjects.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No subjects selected</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {subjects
                            ?.filter((s) => selectedSubjects.includes(s.id))
                            .map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold"
                              >
                                <BookOpen className="h-3 w-3" />
                                {s.name}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                        Class Teacher
                      </h4>
                      {isClassTeacher ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 text-sm font-bold">
                          <Users className="h-4 w-4" />
                          {classes?.find((c) => c.id === selectedClassId)?.name || "Assigned Class"}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 font-medium">Subject Teacher only</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Footer Navigation */}
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0 || saving}
              className="gap-1 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    i === step ? "bg-blue-600 w-6" : i < step ? "bg-blue-400" : "bg-slate-200"
                  )}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-1 rounded-xl min-w-[100px]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="gap-2 rounded-xl min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Skip Link */}
        <div className="text-center mt-6">
          <button
            onClick={handleComplete}
            disabled={saving}
            className="text-sm text-slate-400 hover:text-slate-600 font-medium underline underline-offset-4 transition-colors"
          >
            Skip setup for now — I will do this later
          </button>
        </div>
      </div>
    </div>
  );
}
