-- Add recurrence support to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly'));
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_end_at TIMESTAMPTZ;
