import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassWithDetails {
  id: string;
  name: string;
  level: number;
  capacity: number | null;
  room: string | null;
  academic_year: number | null;
  teacher_id: string | null;
  teacher_name?: string | null;
  student_count: number;
}

export const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data: classes, error } = await supabase
        .from("classes")
        .select("*")
        .order("level");

      if (error) throw error;

      // Fetch teacher names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name");

      // Fetch student counts per class
      const { data: learners } = await supabase
        .from("learners")
        .select("class_id");

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      
      const studentCounts = learners?.reduce((acc, learner) => {
        if (learner.class_id) {
          acc[learner.class_id] = (acc[learner.class_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return classes.map((cls) => ({
        ...cls,
        teacher_name: cls.teacher_id ? profileMap.get(cls.teacher_id) : null,
        student_count: studentCounts[cls.id] || 0,
      })) as ClassWithDetails[];
    },
  });
};
