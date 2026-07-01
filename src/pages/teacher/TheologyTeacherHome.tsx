import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  GraduationCap,
  Mic,
  ScrollText,
  Star,
  ArrowRight,
  Loader2,
  Sparkles,
  BookMarked,
  PenLine,
  Clock,
  Quran,
} from "lucide-react";

const QUICK_LINKS = [
  { icon: PenLine, label: "Islamic Marks Entry", path: "/marks?tab=islamic", desc: "Enter scores for Quran, Fiqh, Arabic & Tarbia", color: "emerald" },
  { icon: Users, label: "Madrasa & Islamic", path: "/madrasa", desc: "Quran tracking, Salah, Akhlaaq reports", color: "purple" },
  { icon: Mic, label: "Oral Assessments", path: "/dos/iple?tab=oral", desc: "Recitation fluency & comprehension tests", color: "amber" },
  { icon: ScrollText, label: "My Subjects", path: "/teacher/my-classes", desc: "View assigned Islamic subjects & classes", color: "blue" },
  { icon: GraduationCap, label: "IPLE Candidates", path: "/dos/iple", desc: "Registered IPLE candidate list", color: "indigo" },
  { icon: BookMarked, label: "Lesson Planning", path: "/teacher/lesson-planner", desc: "Plan Quran, Fiqh & Tarbia lessons", color: "rose" },
];

const TheologyTeacherHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const checkOnboarding = async () => {
      try {
        const { data } = await supabase.from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && data && !data.onboarding_completed) {
          navigate("/teacher/onboarding", { replace: true });
        } else {
          setChecking(false);
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    };
    checkOnboarding();
    return () => { cancelled = true; };
  }, [user?.id, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["theology-teacher-stats"],
    queryFn: async () => {
      const [myAssignments, ipleCandidates, oralPending, subjectsCount] = await Promise.all([
        supabase.from("teacher_assignments")
          .select("subject_id, classes(name)")
          .eq("teacher_id", user?.id)
          .in("subject_id", supabase.from("subjects").select("id").eq("category", "islamic")),
        supabase.from("iple_candidates").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("iple_oral_examinations").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      ]);
      return {
        assignments: myAssignments.data || [],
        candidates: ipleCandidates.count || 0,
        pendingOral: oralPending.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Theology Teacher" subtitle="Islamic Studies & IPLE Division">
      <div className="space-y-8">
        {/* Welcome */}
        <div id="theology-welcome" className="rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-8 shadow-xl shadow-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Assalamu Alaikum, {user?.user_metadata?.full_name?.split(" ")[0] || "Theology Teacher"}!
              </h1>
              <p className="text-emerald-100 text-sm font-medium">
                Islamic Studies & IPLE Curriculum
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-3xl font-black">{stats?.assignments.length || 0}</p>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mt-1">My Subjects</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-3xl font-black">{stats?.candidates || 0}</p>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mt-1">IPLE Candidates</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-3xl font-black">{stats?.pendingOral || 0}</p>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mt-1">Pending Oral Exams</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div id="theology-quick-links">
          <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="group text-left p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg transition-all duration-200"
              >
                <div className={`h-10 w-10 rounded-xl bg-${link.color}-100 flex items-center justify-center mb-3`}>
                  <link.icon className={`h-5 w-5 text-${link.color}-600`} />
                </div>
                <h3 className="font-black text-slate-900 text-sm">{link.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{link.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* My Assigned Subjects */}
        <Card className="rounded-2xl border-2 border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              My Islamic Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.assignments.length === 0 ? (
              <p className="text-sm text-slate-500">No subjects assigned yet. Contact the Theology DOS.</p>
            ) : (
              <div className="space-y-2">
                {stats?.assignments.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{a.subject_id}</p>
                      <p className="text-xs text-slate-500">{a.classes?.name || "Unassigned class"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* IPLE Four Core Subjects Reference */}
        <Card id="theology-iple-subjects" className="rounded-2xl border-2 border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-500" />
              IPLE Core Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Holy Quran", focus: "Tajweed, Hifz, Tafseer", icon: BookOpen, color: "emerald" },
                { name: "Al Fiqh", focus: "Salah, Rituals, Family Law", icon: BookMarked, color: "blue" },
                { name: "Arabic Language", focus: "Nahw, Sarf, Comprehension", icon: GraduationCap, color: "purple" },
                { name: "Tarbia", focus: "Seerah, Ethics, Leadership", icon: Star, color: "amber" },
              ].map((subj) => (
                <div key={subj.name} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className={`h-8 w-8 rounded-lg bg-${subj.color}-100 flex items-center justify-center mb-2`}>
                    <subj.icon className={`h-4 w-4 text-${subj.color}-600`} />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">{subj.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{subj.focus}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TheologyTeacherHome;
