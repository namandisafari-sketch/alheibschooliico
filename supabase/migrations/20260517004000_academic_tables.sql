
-- Academic Support Tables
CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  week_number INTEGER,
  term TEXT,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate', -- low, moderate, high, critical
  status TEXT DEFAULT 'active', -- active, resolved, closed
  issued_by UUID REFERENCES public.profiles(id),
  parent_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  term TEXT,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'scheduled', -- scheduled, ongoing, completed, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lesson_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  observed_by UUID REFERENCES public.profiles(id),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  observation_date DATE DEFAULT CURRENT_DATE,
  score INTEGER CHECK (score BETWEEN 1 AND 100),
  strengths TEXT,
  improvements TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_observations ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for authenticated users (can be hardened later)
CREATE POLICY "Allow all to authenticated - lesson_plans" ON public.lesson_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated - academic_warnings" ON public.academic_warnings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated - exam_series" ON public.exam_series FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated - lesson_observations" ON public.lesson_observations FOR ALL TO authenticated USING (true);
