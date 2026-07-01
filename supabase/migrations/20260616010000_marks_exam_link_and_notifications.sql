-- Link marks to exam scheduling
ALTER TABLE public.term_results
  ADD COLUMN IF NOT EXISTS exam_slot_id UUID REFERENCES public.exam_timetable(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_term_results_exam_slot ON public.term_results (exam_slot_id);

-- Function to auto-populate dormitory_residents from learners.dormitory text field
-- This runs when dormitory_residents is empty for a learner who has a dormitory name
CREATE OR REPLACE FUNCTION public.auto_assign_dormitory_residents()
RETURNS TRIGGER AS $$
DECLARE
  dorm_id UUID;
BEGIN
  IF NEW.dormitory IS NOT NULL AND NEW.dormitory != '' THEN
    -- Try to find matching dormitory by name (case-insensitive)
    SELECT id INTO dorm_id FROM public.dormitories
      WHERE LOWER(name) = LOWER(TRIM(NEW.dormitory))
      LIMIT 1;
    IF dorm_id IS NOT NULL THEN
      -- Only insert if no active residency exists
      IF NOT EXISTS (
        SELECT 1 FROM public.dormitory_residents
        WHERE learner_id = NEW.id AND is_active = true
      ) THEN
        INSERT INTO public.dormitory_residents (dormitory_id, learner_id)
        VALUES (dorm_id, NEW.id)
        ON CONFLICT (learner_id) WHERE is_active = true DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_assign_dormitory ON public.learners;
CREATE TRIGGER tr_auto_assign_dormitory
  AFTER INSERT OR UPDATE OF dormitory ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_dormitory_residents();

-- Run a one-time backfill for existing learners with dormitory text set
DO $$
DECLARE
  rec RECORD;
  dorm_id UUID;
BEGIN
  FOR rec IN SELECT id, dormitory FROM public.learners
    WHERE dormitory IS NOT NULL AND dormitory != ''
      AND NOT EXISTS (SELECT 1 FROM public.dormitory_residents WHERE learner_id = learners.id AND is_active = true)
  LOOP
    SELECT id INTO dorm_id FROM public.dormitories
      WHERE LOWER(name) = LOWER(TRIM(rec.dormitory))
      LIMIT 1;
    IF dorm_id IS NOT NULL THEN
      INSERT INTO public.dormitory_residents (dormitory_id, learner_id)
      VALUES (dorm_id, rec.id)
      ON CONFLICT (learner_id) WHERE is_active = true DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Create a function to check timetable and send teacher reminders
-- This is called by the cron job every 5 minutes
CREATE OR REPLACE FUNCTION public.notify_teachers_for_upcoming_classes()
RETURNS TABLE(teacher_id UUID, teacher_name TEXT, subject_name TEXT, class_name TEXT, start_time TEXT, day_of_week INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.teacher_id,
    p.full_name AS teacher_name,
    s.name AS subject_name,
    c.name AS class_name,
    ct.start_time::text,
    ct.day_of_week
  FROM public.class_timetables ct
  JOIN public.profiles p ON p.id = ct.teacher_id
  JOIN public.subjects s ON s.id = ct.subject_id
  JOIN public.classes c ON c.id = ct.class_id
  WHERE ct.day_of_week = EXTRACT(DOW FROM NOW())::int
    AND ct.start_time::time BETWEEN (NOW()::time - INTERVAL '5 minutes') AND (NOW()::time + INTERVAL '10 minutes')
    AND ct.teacher_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;
