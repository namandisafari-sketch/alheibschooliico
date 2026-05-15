
-- Extended Discipline Filing (Victims & Evidence)
-- Adds support for victims and evidence photos to discipline files

-- 1. Add victims and evidence_photos columns
ALTER TABLE public.discipline_cases 
ADD COLUMN IF NOT EXISTS victims TEXT, -- Comma separated names or JSON
ADD COLUMN IF NOT EXISTS evidence_photos TEXT[]; -- Array of URLs
