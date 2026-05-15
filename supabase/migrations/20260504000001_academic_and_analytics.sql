
-- Academic Tools and Staff Analytics Modules

-- 1. Digital Homework & Learning Materials
CREATE TABLE IF NOT EXISTS public.digital_homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT, -- Link to photo or document in storage
  due_date DATE,
  is_holiday_work BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff Performance Tracking
-- Tracks various metrics like attendance, grading speed, and curriculum coverage
CREATE TABLE IF NOT EXISTS public.staff_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'attendance', 'grading_speed', 'lesson_plan_completion'
  metric_value DECIMAL(10,2),
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  term term_type,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Student Progress Analytics View (Materialized for performance)
-- This will aggregate scores, attendance, and akhlaaq for holistic view
-- For now, we'll just create a table to store processed snapshots
CREATE TABLE IF NOT EXISTS public.student_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  academic_score_avg DECIMAL(5,2),
  attendance_percentage DECIMAL(5,2),
  akhlaaq_avg DECIMAL(5,2),
  salah_completion_rate DECIMAL(5,2),
  quran_progress_summary TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.digital_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow auth manage digital_homework" ON public.digital_homework FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage staff_performance_logs" ON public.staff_performance_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth view student_progress_snapshots" ON public.student_progress_snapshots FOR SELECT TO authenticated USING (true);
