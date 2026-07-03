ALTER TABLE public.exam_timetable
  ADD COLUMN IF NOT EXISTS end_time TIME;

-- Backfill end_time for existing rows based on start_time + duration_minutes
UPDATE public.exam_timetable
SET end_time = (start_time + (duration_minutes || ' minutes')::INTERVAL)::TIME
WHERE end_time IS NULL;
