
-- Curriculum and Syllabus Tables
CREATE TABLE IF NOT EXISTS public.curriculum_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  planned_weeks INTEGER DEFAULT 1,
  sequence_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending', -- pending, completed
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One entry per plan/teacher combination for simple tracking
  CONSTRAINT uq_plan_teacher UNIQUE (plan_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.exam_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.exam_series(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  invigilator_id UUID REFERENCES public.profiles(id),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  room_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.curriculum_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow auth all curriculum_plans" ON public.curriculum_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all syllabus_coverage" ON public.syllabus_coverage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all exam_timetable" ON public.exam_timetable FOR ALL TO authenticated USING (true);
