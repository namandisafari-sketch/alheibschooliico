-- Academic linking: assessment types, scheme-lesson-mark linkage, notification email

-- 1. Add notification_email to profiles for system emails
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- 2. Add assessment_type to term_results (exam, test, activity, exercise, homework)
ALTER TABLE public.term_results ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'exam'
  CHECK (assessment_type IN ('exam', 'test', 'activity', 'exercise', 'homework'));

-- 3. Add scheme_of_work_id to lesson_plans for direct linking
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS scheme_of_work_id UUID
  REFERENCES public.scheme_of_work(id) ON DELETE SET NULL;

-- 4. Add lesson_plan_id and scheme_of_work_id to term_results for mark traceability
ALTER TABLE public.term_results ADD COLUMN IF NOT EXISTS lesson_plan_id UUID
  REFERENCES public.lesson_plans(id) ON DELETE SET NULL;
ALTER TABLE public.term_results ADD COLUMN IF NOT EXISTS scheme_of_work_id UUID
  REFERENCES public.scheme_of_work(id) ON DELETE SET NULL;

-- 5. Update unique constraint to include assessment_type
-- Postgres auto-names inline UNIQUE constraints as: tablename_col1_col2_col3_key
-- Drop old, add new
ALTER TABLE public.term_results DROP CONSTRAINT IF EXISTS term_results_learner_id_subject_id_term_academic_year_key;
ALTER TABLE public.term_results ADD CONSTRAINT term_results_learner_subject_term_year_assessment_key
  UNIQUE(learner_id, subject_id, term, academic_year, assessment_type);

-- 6. Add index on assessment_type for faster queries
CREATE INDEX IF NOT EXISTS idx_term_results_assessment_type ON public.term_results (assessment_type);
CREATE INDEX IF NOT EXISTS idx_term_results_lesson_plan ON public.term_results (lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_term_results_scheme_of_work ON public.term_results (scheme_of_work_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_scheme_of_work ON public.lesson_plans (scheme_of_work_id);

-- 7. Allow back-dating: remove any column-level CHECK constraints that restrict dates
-- (no date CHECK constraints exist on these tables, so this is just documentation)
-- The key is to NOT add min/max restrictions in frontend forms.

-- 8. Enable RLS for new columns (existing policies cover all columns)
COMMENT ON COLUMN public.profiles.notification_email IS 'Secondary email for receiving system notifications';
COMMENT ON COLUMN public.term_results.assessment_type IS 'Type of assessment: exam, test, activity, exercise, homework';
COMMENT ON COLUMN public.term_results.lesson_plan_id IS 'Links this mark to the originating lesson plan';
COMMENT ON COLUMN public.term_results.scheme_of_work_id IS 'Links this mark to the originating scheme of work entry';
