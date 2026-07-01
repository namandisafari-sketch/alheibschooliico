import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Star, Moon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const IslamicProgress = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: quranData } = useQuery({
    queryKey: ["teacher-quran-progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("quran_progress")
        .select("tajweed_score, hifdh_type")
        .eq("teacher_id", user?.id);
      if (!data || data.length === 0) return null;
      const tajweedScores = data.filter((r: any) => r.tajweed_score != null).map((r: any) => r.tajweed_score);
      const avgTajweed = tajweedScores.length > 0
        ? Math.round(tajweedScores.reduce((a: number, b: number) => a + b, 0) / tajweedScores.length * 10)
        : null;
      return { avgTajweed, totalRecords: data.length };
    },
    enabled: !!user?.id
  });

  const { data: akhlaaqData } = useQuery({
    queryKey: ["teacher-akhlaaq-avg", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("akhlaaq_reports")
        .select("rating")
        .eq("teacher_id", user?.id)
        .not("rating", "is", null);
      if (!data || data.length === 0) return null;
      const avg = data.reduce((a: number, r: any) => a + (parseFloat(r.rating) || 0), 0) / data.length;
      return parseFloat(avg.toFixed(1));
    },
    enabled: !!user?.id
  });

  const { data: todayHighlights } = useQuery({
    queryKey: ["teacher-quran-today", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("quran_progress")
        .select("id, learner_id")
        .eq("teacher_id", user?.id)
        .gte("recorded_at", today);
      return data?.length || 0;
    },
    enabled: !!user?.id
  });

  const avgProgress = quranData?.avgTajweed ?? null;
  const hifdhPct = quranData?.totalRecords ? Math.min(quranData.totalRecords * 5, 100) : null;
  const akhlaaqAvg = akhlaaqData ?? null;

  return (
    <Card className="border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 leading-tight">{t("Islamic Studies Progress")}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Madrasa Module")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-emerald-600">{avgProgress != null ? `${avgProgress}%` : "—"}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{t("Avg. Tajweed")}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="h-3 w-3 text-emerald-500" /> {t("Quran & Hifdh Records")}
            </span>
            <span className="font-black text-emerald-600">{hifdhPct != null ? `${hifdhPct}%` : "—"}</span>
          </div>
          <Progress value={hifdhPct ?? 0} className="h-2 bg-emerald-50" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Star className="h-3 w-3 text-amber-500" /> {t("Student Character (Akhlaaq)")}
            </span>
            <span className="font-black text-amber-600">{akhlaaqAvg != null ? `${akhlaaqAvg} / 5.0` : "—"}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${akhlaaqAvg != null && i <= Math.round(akhlaaqAvg) ? "bg-amber-400" : "bg-amber-100"}`}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-dashed">
          <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
             <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase">{t("Today's Highlights")}</p>
                <p className="text-xs font-medium text-emerald-700">
                  {todayHighlights != null
                    ? `${todayHighlights} student${todayHighlights === 1 ? "" : "s"} recorded today`
                    : t("No records today")}
                </p>
             </div>
             <button className="text-[10px] font-black text-emerald-600 uppercase hover:underline">
                {t("Details")}
             </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
