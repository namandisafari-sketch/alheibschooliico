
-- Migration to add recurrence to school_calendar
ALTER TABLE public.school_calendar 
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' 
CHECK (recurrence IN ('none', 'weekly', 'monthly', 'annually', 'termly'));

-- Comment to explain values
COMMENT ON COLUMN public.school_calendar.recurrence IS 'Recurrence pattern: none, weekly, monthly, annually, termly';
