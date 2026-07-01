-- Add comprehensive planning columns to scheme_of_work
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS day TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS subtheme TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS competences TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS methods TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS activities TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS life_skills TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS learning_aids TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS references TEXT;
ALTER TABLE public.scheme_of_work ADD COLUMN IF NOT EXISTS remarks TEXT;
