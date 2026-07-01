-- Syllabus Tracking, Scheme of Work & Lesson Register Enhancement

-- 1. curriculum_topics - sub-topics and expected lessons under each curriculum plan topic
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_plan_id UUID REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sub_topics JSONB DEFAULT '[]'::jsonb,
  expected_lessons INTEGER DEFAULT 1,
  sequence_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curriculum_topics read" ON public.curriculum_topics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "curriculum_topics write" ON public.curriculum_topics
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher', 'deputy_head_teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher', 'deputy_head_teacher')));

DROP TRIGGER IF EXISTS update_curriculum_topics_updated_at ON public.curriculum_topics;
CREATE TRIGGER update_curriculum_topics_updated_at BEFORE UPDATE ON public.curriculum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. scheme_of_work - teacher weekly plans
CREATE TABLE IF NOT EXISTS public.scheme_of_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  term TEXT DEFAULT 'term_1',
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  topic TEXT NOT NULL,
  sub_topic TEXT,
  planned_lessons INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  source_term TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id, week_number, term, academic_year)
);

ALTER TABLE public.scheme_of_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheme_of_work read own" ON public.scheme_of_work
  FOR SELECT TO authenticated USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher', 'deputy_head_teacher'))
  );

CREATE POLICY "scheme_of_work write own" ON public.scheme_of_work
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP TRIGGER IF EXISTS update_scheme_of_work_updated_at ON public.scheme_of_work;
CREATE TRIGGER update_scheme_of_work_updated_at BEFORE UPDATE ON public.scheme_of_work
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. lesson_register - taught status tracking per lesson plan
CREATE TABLE IF NOT EXISTS public.lesson_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic TEXT,
  taught_status TEXT NOT NULL DEFAULT 'not_taught' CHECK (taught_status IN ('taught', 'partially_taught', 'not_taught')),
  challenges TEXT,
  learner_participation TEXT,
  follow_up TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lesson_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_register read" ON public.lesson_register
  FOR SELECT TO authenticated USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher', 'deputy_head_teacher'))
  );

CREATE POLICY "lesson_register write own" ON public.lesson_register
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP TRIGGER IF EXISTS update_lesson_register_updated_at ON public.lesson_register;
CREATE TRIGGER update_lesson_register_updated_at BEFORE UPDATE ON public.lesson_register
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add missing columns to lesson_plans if not present
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS activities TEXT;
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS homework TEXT;
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());

-- 5. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.curriculum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheme_of_work;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_register;
