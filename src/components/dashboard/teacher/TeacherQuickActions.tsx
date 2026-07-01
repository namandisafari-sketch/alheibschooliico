
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ClipboardCheck,
  PenLine,
  BookOpen,
  Users,
  Calendar,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TeacherQuickActions = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: isClassTeacher = false } = useQuery({
    queryKey: ["class-teacher-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count } = await supabase
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", user.id);
      return (count || 0) > 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const actions = [
    ...(isClassTeacher
      ? [{ label: "Attendance", icon: ClipboardCheck, path: "/attendance", color: "blue" }]
      : [{ label: "Lesson Register", icon: ClipboardList, path: "/teacher/lesson-register", color: "blue" }]),
    { label: "Marks Entry", icon: PenLine, path: "/marks", color: "indigo" },
    { label: "Lesson Plans", icon: BookOpen, path: "/homework", color: "emerald" },
    { label: "My Students", icon: Users, path: "/teacher/my-students", color: "purple" },
    { label: "Schedule", icon: Calendar, path: "/schedule", color: "amber" },
    { label: "Notices", icon: MessageSquare, path: "/notifications", color: "rose" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => navigate(action.path)}
          className="group flex flex-col items-center justify-center p-4 rounded-3xl bg-white border-2 border-slate-50 hover:border-blue-100 hover:shadow-lg transition-all duration-300"
        >
          <div className={`p-3 rounded-2xl bg-${action.color}-50 text-${action.color}-600 group-hover:scale-110 transition-transform mb-2`}>
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">
            {t(action.label)}
          </span>
        </button>
      ))}
    </div>
  );
};
