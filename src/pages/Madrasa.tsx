// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Star, UserCheck, Calendar, BookMarked,
  Users, Award, Clock, Sparkles, ExternalLink,
  LayoutDashboard, Stethoscope, GraduationCap, PenLine,
} from "lucide-react";
import { QuranTrackingTab } from "@/components/madrasa/QuranTrackingTab";
import { SalahAttendanceTab } from "@/components/madrasa/SalahAttendanceTab";
import { AkhlaaqReportingTab } from "@/components/madrasa/AkhlaaqReportingTab";
import { MadrasaTimetableTab } from "@/components/madrasa/MadrasaTimetableTab";
import { useMadrasaStats } from "@/hooks/useMadrasa";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const madrasaNavLinks = [
  { icon: BookOpen, label: "Quran & Hifdh", path: "/madrasa", tab: "quran" },
  { icon: UserCheck, label: "Salah Attendance", path: "/madrasa", tab: "salah" },
  { icon: Star, label: "Akhlaaq (Conduct)", path: "/madrasa", tab: "akhlaaq" },
  { icon: Calendar, label: "Timetable", path: "/madrasa", tab: "timetable" },
];

const systemLinks = [
  { icon: GraduationCap, label: "Learners", path: "/students", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: PenLine, label: "Islamic Marks", path: "/marks", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: BookMarked, label: "Subjects", path: "/dos/subjects", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Stethoscope, label: "Health Center", path: "/health", color: "text-rose-600", bg: "bg-rose-50" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/", color: "text-slate-600", bg: "bg-slate-50" },
];

const Madrasa = () => {
  const { data: stats } = useMadrasaStats();

  return (
    <DashboardLayout title="Islamic Education Suite" subtitle="Quran, Salah, Akhlaaq, and Madrasa administration">
      <div className="space-y-6">
        {/* System Links */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {systemLinks.map(l => (
            <Button key={l.path} asChild variant="outline" size="sm" className="h-8 gap-1.5 text-[10px] font-bold rounded-xl whitespace-nowrap border-slate-200">
              <Link to={l.path}>
                <l.icon className={cn("h-3.5 w-3.5", l.color)} />
                {l.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Quran Records", value: stats?.totalQuranRecords || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Active Hufadh", value: stats?.activeQuranLearners || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Avg Akhlaaq", value: stats?.averageAkhlaaq || 0, icon: Star, color: "text-amber-600", bg: "bg-amber-50", suffix: "/5" },
            { label: "Salah Today", value: stats?.todaySalahEntries || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Milestones", value: stats?.totalMilestones || 0, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(s => (
            <Card key={s.label} className="border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-black">{s.value}{s.suffix || ""}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Nav */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {madrasaNavLinks.map(l => (
            <Button
              key={l.tab}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold rounded-xl whitespace-nowrap border-slate-200 hover:border-primary/40"
            >
              <l.icon className="h-3.5 w-3.5" />
              {l.label}
            </Button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quran" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto bg-card border shadow-sm">
            <TabsTrigger value="quran" className="gap-2 py-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <BookOpen className="h-4 w-4" /> Quran & Hifdh
            </TabsTrigger>
            <TabsTrigger value="salah" className="gap-2 py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <UserCheck className="h-4 w-4" /> Salah Attendance
            </TabsTrigger>
            <TabsTrigger value="akhlaaq" className="gap-2 py-3 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
              <Star className="h-4 w-4" /> Akhlaaq (Conduct)
            </TabsTrigger>
            <TabsTrigger value="timetable" className="gap-2 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Calendar className="h-4 w-4" /> Madrasa Timetable
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quran" className="mt-6">
            <QuranTrackingTab />
          </TabsContent>
          <TabsContent value="salah" className="mt-6">
            <SalahAttendanceTab />
          </TabsContent>
          <TabsContent value="akhlaaq" className="mt-6">
            <AkhlaaqReportingTab />
          </TabsContent>
          <TabsContent value="timetable" className="mt-6">
            <MadrasaTimetableTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Madrasa;
