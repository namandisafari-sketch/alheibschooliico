
-- Fix timetable UNIQUE constraint to include term
-- Previously: UNIQUE (class_id, day_of_week, start_time) — prevented same slot in different terms

ALTER TABLE public.class_timetables
  DROP CONSTRAINT IF EXISTS uq_class_slot;

ALTER TABLE public.class_timetables
  ADD CONSTRAINT uq_class_slot UNIQUE (class_id, day_of_week, start_time, term);
