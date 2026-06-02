import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  Heart, 
  Star, 
  CheckCircle2, 
  Moon, 
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

export const StudentDashboard = () => {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Student Welcome Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900">Welcome Back, Learner! 👋</h3>
            <p className="text-sm text-slate-500 mt-1">Keep striving for excellence in both your academics and spiritual growth.</p>
          </div>
          <div className="md:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Normal Attendance Status
            </span>
            <p className="text-xs text-muted-foreground mt-1.5">{today}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class Level</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">Primary 7 (P7)</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Candidate Class - PLE Prep</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qur'an Progress</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">Juz' 28 (Al-Mujadila)</h3>
              <p className="text-[10px] text-indigo-600 font-medium mt-1">6/10 Memorization Targets</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Moon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Term 3 Fee Status</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">FULLY PAID</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Receipt Ref: #AL-99824</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Behavior Conduct</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">Excellent (A+)</h3>
              <p className="text-[10px] text-rose-600 font-medium mt-1">Zero Discipline Incidents</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Star className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Academic Marks Progress */}
        <Card className="md:col-span-2 shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Term 3 Cumulative Marks (PLE Formats)
            </CardTitle>
            <CardDescription>Continuous Assessments and Mid-Term Marks Breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { subject: "Mathematics", score: 88, max: 100, division: "D1 (Distinction)" },
                { subject: "English Language", score: 85, max: 100, division: "D1 (Distinction)" },
                { subject: "Social Studies & Religious Education", score: 92, max: 100, division: "D1 (Distinction)" },
                { subject: "Integrated Science", score: 79, max: 100, division: "D2 (Distinction)" },
                { subject: "Islamic Religious Education (I.R.E)", score: 95, max: 100, division: "D1 (Distinction)" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/20 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm">{item.subject}</span>
                    <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.score >= 80 ? "bg-emerald-500" : item.score >= 70 ? "bg-indigo-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500 font-medium">
                    <span>National Standard Assessment</span>
                    <span className="font-bold text-slate-700">{item.division}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Daily Tasks */}
        <div className="space-y-6">
          {/* Daily Timetable */}
          <Card className="shadow-sm border border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" /> Today's Timetable
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {[
                  { time: "08:00 AM - 09:30 AM", title: "Mathematics (PLE Prep)", room: "Room 4A", teacher: "Mr. Kato" },
                  { time: "09:30 AM - 11:00 AM", title: "Integrated Science", room: "Lab B", teacher: "Mrs. Mukasa" },
                  { time: "11:00 AM - 11:30 AM", title: "Break Time", room: "Campus Yard", status: "break" },
                  { time: "11:30 AM - 01:00 PM", title: "Islamic Religious Studies", room: "Prayer Hall", teacher: "Sheikh Juma" },
                ].map((slot, idx) => (
                  <div key={idx} className={`p-4 flex gap-3 ${slot.status === "break" ? "bg-amber-50/20" : ""}`}>
                    <div className="text-xs font-mono text-slate-400 whitespace-nowrap pt-0.5">
                      <Clock className="inline h-3 w-3 mr-1 -mt-0.5" /> {slot.time.split(" ")[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{slot.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {slot.status === "break" ? "Intermission" : `${slot.room} • ${slot.teacher}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Digital Homework */}
          <Card className="shadow-sm border border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold text-slate-900">Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "English Composition (PLE Style)", due: "Tomorrow", priority: "high" },
                { title: "Science: Human Body Systems Lab", due: "Friday", priority: "medium" },
              ].map((hw, idx) => (
                <div key={idx} className="p-3 bg-rose-50/20 rounded-xl border border-rose-100 hover:bg-rose-50/40 transition-colors flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-xs text-slate-900">{hw.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Due: {hw.due}</p>
                  </div>
                  <Badge variant={hw.priority === "high" ? "destructive" : "secondary"} className="text-[9px] uppercase tracking-wider h-5 font-black">
                    {hw.priority}
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
