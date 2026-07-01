import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QUICK_LINKS = [
  { icon: BookMarked, label: "IPLE Management", path: "/dos/iple", desc: "Manage IPLE candidates, oral exams & results", color: "emerald" },
  { icon: BookOpen, label: "Islamic Subjects", path: "/dos/subjects", desc: "Manage Quran, Fiqh, Arabic & Tarbia subjects", color: "blue" },
  { icon: Users, label: "Madrasa & Islamic", path: "/madrasa", desc: "Quran tracking, Salah, Akhlaaq reports", color: "purple" },
  { icon: ScrollText, label: "Islamic Marks Entry", path: "/marks?tab=islamic", desc: "Enter scores for Islamic subjects", color: "indigo" },
  { icon: Mic, label: "Oral Assessments", path: "/dos/iple?tab=oral", desc: "Recitation fluency & comprehension tests", color: "amber" },
  { icon: GraduationCap, label: "Scheme of Work", path: "/dos/scheme-of-work", desc: "Plan theology curriculum coverage", color: "rose" },
];

const DosTheologyHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dos-theology-stats"],
    queryFn: async () => {
      const [candidatesRes, subjectsRes, oralRes] = await Promise.all([
        supabase.from("iple_candidates").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("subjects").select("id", { count: "exact", head: true }).eq("category", "islamic"),
        supabase.from("iple_oral_examinations").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      ]);
      return {
        candidates: candidatesRes.count || 0,
        subjects: subjectsRes.count || 0,
        pendingOral: oralRes.count || 0,
      };
    },
  });

  return (
    <DashboardLayout title="DOS Theology" subtitle="Director of Studies — Islamic & IPLE Division">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-8 shadow-xl shadow-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Assalamu Alaikum, {user?.user_metadata?.full_name?.split(" ")[0] || "Theology DOS"}!</h1>
              <p className="text-emerald-100 text-sm font-medium">Islamic Curriculum & IPLE Examination Management</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-3xl font-black">{stats?.candidates || 0}</p>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mt-1">IPLE Candidates</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-3xl font-black">{stats?.subjects || 0}</p>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mt-1">Islamic Subjects</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-3xl font-black">{stats?.pendingOral || 0}</p>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mt-1">Pending Oral Exams</p>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div>
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

        {/* IPLE Four Core Subjects Reference */}
        <Card className="rounded-2xl border-2 border-slate-100">
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

export default DosTheologyHome;
