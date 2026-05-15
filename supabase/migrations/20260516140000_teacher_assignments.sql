
-- DOS: Teacher Assignments to Classes and Subjects
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  term term_type,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_lead_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id, academic_year)
);

-- Enable RLS
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view assignments" ON public.teacher_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow academic managers handle assignments" ON public.teacher_assignments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);
