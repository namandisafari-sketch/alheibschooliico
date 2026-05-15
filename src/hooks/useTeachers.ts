import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  role: string | null;
  created_at: string | null;
  assigned_class?: string | null;
}

export const useTeachers = () => {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("full_name");

      if (error) throw error;

      // Get class assignments for teachers
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, teacher_id");

      const classMap = new Map(
        classes?.map((c) => [c.teacher_id, c.name]) || []
      );

      return profiles.map((profile) => ({
        ...profile,
        assigned_class: classMap.get(profile.id) || null,
      })) as Teacher[];
    },
  });
};
