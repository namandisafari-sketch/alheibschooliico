
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Star, Moon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const IslamicProgress = () => {
  const { t } = useLanguage();

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
          <p className="text-xl font-black text-emerald-600">92%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{t("Avg. Progress")}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="h-3 w-3 text-emerald-500" /> {t("Quran & Hifdh Completion")}
            </span>
            <span className="font-black text-emerald-600">85%</span>
          </div>
          <Progress value={85} className="h-2 bg-emerald-50" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Star className="h-3 w-3 text-amber-500" /> {t("Student Character (Akhlaaq)")}
            </span>
            <span className="font-black text-amber-600">4.8 / 5.0</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 flex-1 bg-amber-400 rounded-full" />
            ))}
            <div className="h-2 flex-1 bg-amber-100 rounded-full" />
          </div>
        </div>
        
        <div className="pt-4 border-t border-dashed">
          <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
             <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase">{t("Today's Highlights")}</p>
                <p className="text-xs font-medium text-emerald-700">3 students completed Juz' 30 today!</p>
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
