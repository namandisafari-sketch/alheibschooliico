
-- Academic Planning & Coverage Tracking
CREATE TABLE IF NOT EXISTS public.curriculum_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  term term_type,
  academic_year INTEGER,
  topic_title TEXT NOT NULL,
  planned_weeks INTEGER,
  sequence_order INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_date DATE,
  evidence_url TEXT, -- Link to photo of notes / board
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams & Assessment Scheduling
CREATE TABLE IF NOT EXISTS public.exam_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g. Mid-Term I 2024
  term term_type,
  academic_year INTEGER,
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.exam_series(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  room_id UUID, -- Link to school_infrastructure
  invigilator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.curriculum_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view academic planning" ON public.curriculum_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow DOS and Teachers manage planning" ON public.curriculum_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'teacher', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view coverage" ON public.syllabus_coverage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow DOS and Teachers manage coverage" ON public.syllabus_coverage FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'teacher', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view exams" ON public.exam_series FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow academic managers handle exams" ON public.exam_series FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view exam timetable" ON public.exam_timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow academic managers handle exam timetable" ON public.exam_timetable FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);
