
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, ClipboardCheck, GraduationCap, Star } from "lucide-react";

const stats = [
  {
    label: "Assigned Students",
    value: "142",
    icon: Users,
    color: "blue",
    trend: "+3 this week"
  },
  {
    label: "Today's Attendance",
    value: "96%",
    icon: ClipboardCheck,
    color: "emerald",
    trend: "2 students absent"
  },
  {
    label: "Grading Status",
    value: "88%",
    icon: GraduationCap,
    color: "indigo",
    trend: "12 pending marks"
  },
  {
    label: "Avg. Akhlaaq Score",
    value: "4.2",
    icon: Star,
    color: "amber",
    trend: "Above school avg"
  }
];

export const TeacherStats = () => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="group overflow-hidden border-2 border-slate-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-3xl p-5">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t(stat.label)}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            <p className={`text-[10px] font-bold mt-1 text-${stat.color}-600`}>{t(stat.trend)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
