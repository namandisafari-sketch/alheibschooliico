// @ts-nocheck
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ClipboardList, BookOpenCheck } from "lucide-react";

const TeacherMyClasses = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get classes where teacher is the main class teacher
      const { data: leadClasses } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id);
      
      // Get classes where teacher is assigned to any subject
      const { data: assigned } = await supabase
        .from("teacher_assignments")
        .select("class_id, classes(*)")
        .eq("teacher_id", user.id);

      const allClassMap = new Map();
      (leadClasses || []).forEach(c => allClassMap.set(c.id, c));
      (assigned || []).forEach(a => {
        if (a.classes) allClassMap.set(a.class_id, a.classes);
      });

      const uniqueClasses = Array.from(allClassMap.values());
      setRows(uniqueClasses);

      if (uniqueClasses.length) {
        const ids = uniqueClasses.map((c: any) => c.id);
        const { data: ls } = await supabase
          .from("learners")
          .select("id, class_id")
          .in("class_id", ids);
        const map: Record<string, number> = {};
        (ls || []).forEach((l: any) => {
          map[l.class_id] = (map[l.class_id] || 0) + 1;
        });
        setCounts(map);
      }
    })();
  }, [user?.id]);

  return (
    <FeaturePageShell
      title="My Classes"
      subtitle="Classes assigned to you only"
      icon={BookOpen}
      features={[
        "See only your assigned classes",
        "Quick links to attendance & gradebook",
        "Live learner count per class",
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((c: any) => (
          <Card key={c.id} className="hover:shadow-md transition">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Level {c.level} {c.room ? `• Room ${c.room}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary text-sm font-bold">
                  <Users className="h-4 w-4" />
                  {counts[c.id] || 0}
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1 gap-1">
                  <Link to="/attendance">
                    <ClipboardList className="h-3.5 w-3.5" /> Attendance
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1 gap-1">
                  <Link to="/teacher/gradebook">
                    <BookOpenCheck className="h-3.5 w-3.5" /> Marks
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!rows.length && (
          <p className="text-sm text-muted-foreground col-span-full">
            No classes assigned to you yet. Ask the DOS to assign.
          </p>
        )}
      </div>
    </FeaturePageShell>
  );
};

export default TeacherMyClasses;
