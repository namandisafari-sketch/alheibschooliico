
-- DOS: Lesson Plans & Academic Warnings

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  term term_type,
  week_number INTEGER,
  title TEXT NOT NULL,
  content TEXT, -- Markdown or JSON for the plan details
  objectives TEXT,
  resources TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewed')),
  dos_feedback TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id),
  reason TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  issued_by UUID REFERENCES public.profiles(id),
  term term_type,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  parent_notified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_warnings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view lesson plans" ON public.lesson_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers and DOS manage lesson plans" ON public.lesson_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'teacher', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view academic warnings" ON public.academic_warnings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow DOS and admin manage warnings" ON public.academic_warnings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);
