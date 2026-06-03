-- Holiday arrival clearance workflow for learners returning from holidays
CREATE TABLE IF NOT EXISTS public.holiday_arrival_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  arrival_date DATE NOT NULL,
  holiday_type TEXT,
  guardian_name TEXT,
  relative_relationship TEXT,
  phone_number TEXT,
  dormitory_number TEXT,
  proposed_dormitory TEXT,
  weight TEXT,
  height TEXT,
  chronic_disease_history TEXT,
  health_status TEXT,
  health_signature TEXT,
  school_uniforms INTEGER NOT NULL DEFAULT 0,
  sports_wear INTEGER NOT NULL DEFAULT 0,
  sweater INTEGER NOT NULL DEFAULT 0,
  track_suits INTEGER NOT NULL DEFAULT 0,
  shoes INTEGER NOT NULL DEFAULT 0,
  kanzu_hijab INTEGER NOT NULL DEFAULT 0,
  vests INTEGER NOT NULL DEFAULT 0,
  casual_wears INTEGER NOT NULL DEFAULT 0,
  cap_veils INTEGER NOT NULL DEFAULT 0,
  stockings INTEGER NOT NULL DEFAULT 0,
  underwear_pants INTEGER NOT NULL DEFAULT 0,
  matron_status TEXT NOT NULL DEFAULT 'pending',
  head_teacher_status TEXT NOT NULL DEFAULT 'pending',
  internal_supervisor_status TEXT NOT NULL DEFAULT 'pending',
  centre_director_status TEXT NOT NULL DEFAULT 'pending',
  matron_notes TEXT,
  head_teacher_notes TEXT,
  internal_supervisor_notes TEXT,
  centre_director_notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.holiday_arrival_clearances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow auth manage holiday_arrival_clearances" ON public.holiday_arrival_clearances;
CREATE POLICY "Allow auth manage holiday_arrival_clearances" ON public.holiday_arrival_clearances FOR ALL TO authenticated USING (true);
