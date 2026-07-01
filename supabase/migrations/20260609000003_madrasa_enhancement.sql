-- Madrasa Enhancement
-- 1. Add columns to quran_progress for detailed tracking
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS surah_number INTEGER;
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS juz_number INTEGER;
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS ayat_covered INTEGER;
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS juz_from INTEGER;
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS juz_to INTEGER;
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS makhraj_score INTEGER CHECK (makhraj_score BETWEEN 1 AND 10);
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS hifdh_strength INTEGER CHECK (hifdh_strength BETWEEN 1 AND 10);
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE public.quran_progress ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id);

-- 2. Fix learner_milestones constraint to accept 'quran' milestone type
ALTER TABLE public.learner_milestones DROP CONSTRAINT IF EXISTS learner_milestones_milestone_type_check;
ALTER TABLE public.learner_milestones ADD CONSTRAINT learner_milestones_milestone_type_check
  CHECK (milestone_type IN ('academic', 'sports', 'behavioral', 'attendance', 'extracurricular', 'islamic', 'quran', 'other'));

-- 3. Add akhlaaq_reports insert/update triggers
ALTER TABLE public.akhlaaq_reports ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.akhlaaq_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_akhlaaq_reports_updated_at ON public.akhlaaq_reports;
CREATE TRIGGER update_akhlaaq_reports_updated_at BEFORE UPDATE ON public.akhlaaq_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable realtime for madrasa tables (safe re-runnable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'quran_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quran_progress;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'akhlaaq_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.akhlaaq_reports;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'salah_attendance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salah_attendance;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'learner_milestones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.learner_milestones;
  END IF;
END $$;

-- 5. Add RLS for akhlaaq_reports if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'akhlaaq_reports_read') THEN
    CREATE POLICY "akhlaaq_reports_read" ON public.akhlaaq_reports
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'akhlaaq_reports_write') THEN
    CREATE POLICY "akhlaaq_reports_write" ON public.akhlaaq_reports
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'head_teacher', 'nurse', 'dos', 'islamic_coordinator')))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'head_teacher', 'nurse', 'dos', 'islamic_coordinator')));
  END IF;
END $$;
