ALTER TABLE public.lesson_register
  ADD COLUMN IF NOT EXISTS term TEXT NOT NULL DEFAULT 'term_1',
  ADD COLUMN IF NOT EXISTS academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW());

CREATE INDEX IF NOT EXISTS idx_lesson_register_term_year ON public.lesson_register(academic_year, term);
