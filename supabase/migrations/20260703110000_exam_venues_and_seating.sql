-- Exam Venues and Seating Management
-- Allows schools to use classrooms as exam venues and auto-generate seating patterns

-- Venues for exam sessions (links exam_timetable to rooms/classrooms)
CREATE TABLE IF NOT EXISTS public.exam_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_timetable_id UUID REFERENCES public.exam_timetable(id) ON DELETE CASCADE,
  venue_name TEXT NOT NULL,
  venue_type TEXT NOT NULL DEFAULT 'classroom' CHECK (venue_type IN ('classroom', 'exam_hall', 'lab', 'library', 'other')),
  infrastructure_id UUID REFERENCES public.school_infrastructure(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  hosted_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seating plan configuration per venue
CREATE TABLE IF NOT EXISTS public.exam_seating_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_venue_id UUID REFERENCES public.exam_venues(id) ON DELETE CASCADE UNIQUE,
  pattern_type TEXT NOT NULL DEFAULT 'shift' CHECK (pattern_type IN ('shift', 'random', 'admission_number', 'reverse_admission', 'alphabetical')),
  shift_amount INTEGER DEFAULT 1,
  total_sessions INTEGER NOT NULL DEFAULT 1,
  is_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual learner seat assignments
CREATE TABLE IF NOT EXISTS public.exam_seat_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seating_plan_id UUID REFERENCES public.exam_seating_plans(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  desk_number INTEGER NOT NULL,
  session_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seating_plan_id, desk_number, session_number),
  UNIQUE(seating_plan_id, learner_id, session_number)
);

-- Enable RLS
ALTER TABLE public.exam_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_seating_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_seat_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view exam venues" ON public.exam_venues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage exam venues" ON public.exam_venues
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view seating plans" ON public.exam_seating_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage seating plans" ON public.exam_seating_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view seat assignments" ON public.exam_seat_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage seat assignments" ON public.exam_seat_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_venues_timetable ON public.exam_venues (exam_timetable_id);
CREATE INDEX IF NOT EXISTS idx_exam_seat_assignments_plan ON public.exam_seat_assignments (seating_plan_id);
CREATE INDEX IF NOT EXISTS idx_exam_seat_assignments_session ON public.exam_seat_assignments (seating_plan_id, session_number);
