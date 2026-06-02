import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Moon, 
  Star, 
  Sparkles,
  ClipboardCheck,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

export const IslamicDashboard = () => {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  // Sample Madrasa Registry List
  const madrasaGroups = [
    { name: "Group A (Hifz Prep)", level: "Qur'an Memorization", count: 24, instructor: "Sheikh Juma", progress: "94%" },
    { name: "Group B (Tajweed)", level: "Basic Phonology", count: 32, instructor: "Imam Waswa", progress: "88%" },
    { name: "Group C (Hadith)", level: "Spiritual Ethics", count: 18, instructor: "Sheikh Nsubuga", progress: "91%" },
    { name: "Group D (Junior Madrasa)", level: "P1-P3 Arabic Alphabet", count: 45, instructor: "Ustadh Kateregga", progress: "85%" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Islamic spiritual hub header banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/50 via-indigo-50/10 to-transparent p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-50/30 rounded-full -mr-16 -mb-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Moon className="h-6 w-6 text-indigo-600 fill-indigo-100" /> Madrasa & Spiritual Administration
            </h3>
            <p className="text-sm text-slate-500 mt-1">Spiritual Guidance, Qur'an Programs, Memorization Targets, and Islamic Behavior Ledger.</p>
          </div>
          <div className="md:text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="h-3.5 w-3.5" /> Spiritual Center Live
            </span>
            <p className="text-xs text-muted-foreground mt-1.5">{today}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Madrasa Learners</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">119 Active</h3>
              <p className="text-[10px] text-muted-foreground mt-1">P1 to P7 Daily Pupils</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Salah Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">92.4%</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Congregational Prayers</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tajweed Progress</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">88.5%</h3>
              <p className="text-[10px] text-indigo-600 font-medium mt-1">Average Phonetic Score</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Memorization Targets</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">14 Verified</h3>
              <p className="text-[10px] text-indigo-600 font-medium mt-1">Targets met this week</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Madrasa Groups Registry */}
        <Card className="md:col-span-2 shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" /> Madrasa Registry & Hifz Tracking
            </CardTitle>
            <CardDescription>Academic and spiritual development logs across active study circles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border/50">
              {madrasaGroups.map((group, idx) => (
                <div key={idx} className="pb-4 pt-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{group.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{group.level} • Instructor: {group.instructor}</p>
                  </div>
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-xs font-mono font-bold text-indigo-600">{group.progress} Target Met</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{group.count} Students</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      Manage Circles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Qur'an Hifz Targets & assessments Panel */}
        <div className="space-y-6">
          <Card className="shadow-sm border border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="h-4.5 w-4.5 text-indigo-600" /> Memorization Target Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { learner: "Kiiza Ibrahim (P7)", target: "Surah Al-Mulk - Complete Memorization" },
                { learner: "Nakamya Aisha (P5)", target: "Juz' Amma - Tajweed Accent Assessment" },
                { learner: "Sempijja Shakur (P6)", target: "Surah Ya-Sin - Recitation Check" },
              ].map((milestone, idx) => (
                <div key={idx} className="p-3 bg-indigo-50/20 rounded-xl border border-indigo-100/40">
                  <p className="text-xs font-semibold text-slate-900">{milestone.learner}</p>
                  <p className="text-[10px] text-indigo-600 font-medium mt-1">{milestone.target}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="default" size="xs" className="h-6 text-[9px] font-bold bg-indigo-600 hover:bg-indigo-700 px-2 rounded-md">
                      Approve Target
                    </Button>
                    <Button variant="ghost" size="xs" className="h-6 text-[9px] font-bold text-slate-500 px-2">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Spiritual Conduct Checklist */}
          <Card className="shadow-sm border border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Star className="h-4.5 w-4.5 text-amber-500" /> Spiritual Conduct Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "Weekly Salaah Register Audited", status: "completed" },
                { title: "Tajweed Oral Assessments Updated", status: "pending" },
                { title: "Friday Khutbah Schedule Finalized", status: "completed" },
              ].map((task, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 text-xs">
                  <span className="font-medium text-slate-700">{task.title}</span>
                  <Badge variant={task.status === "completed" ? "success" : "warning"} className="text-[9px] uppercase tracking-wider h-5 font-black">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
