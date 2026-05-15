-- 1. Subject category & grading type
DO $$ BEGIN
  CREATE TYPE public.subject_category AS ENUM ('academic', 'islamic', 'behavior');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.grading_type AS ENUM ('numeric', 'letter', 'descriptive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('draft', 'published', 'locked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS category public.subject_category NOT NULL DEFAULT 'academic',
  ADD COLUMN IF NOT EXISTS grading_type public.grading_type NOT NULL DEFAULT 'numeric',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 100;

-- 2. Term results: letter grades + Juz tracking
ALTER TABLE public.term_results
  ADD COLUMN IF NOT EXISTS letter_grade text,
  ADD COLUMN IF NOT EXISTS juz_completed numeric;

-- 3. Report cards: positions, attendance, Islamic remarks, behavior, publish state
ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS academic_position integer,
  ADD COLUMN IF NOT EXISTS islamic_position integer,
  ADD COLUMN IF NOT EXISTS class_size integer,
  ADD COLUMN IF NOT EXISTS days_present integer,
  ADD COLUMN IF NOT EXISTS days_absent integer,
  ADD COLUMN IF NOT EXISTS islamic_teacher_remarks text,
  ADD COLUMN IF NOT EXISTS discipline_rating text,
  ADD COLUMN IF NOT EXISTS participation_rating text,
  ADD COLUMN IF NOT EXISTS cleanliness_rating text,
  ADD COLUMN IF NOT EXISTS academic_total numeric,
  ADD COLUMN IF NOT EXISTS academic_average numeric,
  ADD COLUMN IF NOT EXISTS status public.report_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS report_cards_unique_idx
  ON public.report_cards (learner_id, class_id, term, academic_year);

-- 4. Tighten RLS on report_cards: teachers cannot modify locked/published reports
DROP POLICY IF EXISTS "Authenticated users can manage report cards" ON public.report_cards;

CREATE POLICY "Admins manage all report cards"
ON public.report_cards
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Teachers manage draft report cards"
ON public.report_cards
FOR ALL
TO authenticated
USING (status = 'draft' AND (public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)))
WITH CHECK (status = 'draft' AND (public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));

-- 5. Seed Islamic subjects (extended set)
INSERT INTO public.subjects (name, code, is_core, category, grading_type, min_class_level, max_class_level, display_order)
VALUES
  ('Qur''an (Tilawah)', 'QURAN', true, 'islamic', 'letter', 1, 7, 200),
  ('Hifz (Memorization)', 'HIFZ', true, 'islamic', 'descriptive', 1, 7, 201),
  ('Fiqh', 'FIQH', true, 'islamic', 'letter', 1, 7, 202),
  ('Hadith', 'HADITH', true, 'islamic', 'letter', 1, 7, 203),
  ('Aqeedah', 'AQEED', true, 'islamic', 'letter', 1, 7, 204),
  ('Arabic Language', 'ARAB', true, 'islamic', 'numeric', 1, 7, 205),
  ('Akhlaq (Character)', 'AKHL', true, 'islamic', 'descriptive', 1, 7, 206),
  ('Seerah', 'SEER', true, 'islamic', 'letter', 1, 7, 207)
ON CONFLICT DO NOTHING;

-- 6. Mark existing curriculum subjects as academic with sensible order
UPDATE public.subjects
SET category = 'academic', grading_type = 'numeric'
WHERE category IS NULL OR category = 'academic';