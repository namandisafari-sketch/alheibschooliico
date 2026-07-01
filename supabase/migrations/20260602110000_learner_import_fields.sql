-- Add columns for learner import from sponsorship database
ALTER TABLE public.learners
  ADD COLUMN IF NOT EXISTS sponsorship_number TEXT,
  ADD COLUMN IF NOT EXISTS sponsorship_agency TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;

CREATE INDEX IF NOT EXISTS idx_learners_sponsorship_number ON public.learners (sponsorship_number);
