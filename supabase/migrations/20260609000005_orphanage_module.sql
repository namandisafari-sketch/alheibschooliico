-- Orphanage Services Tracking Module
-- Comprehensive module for managing orphans, sponsors, and support services

-- 1. SPONSORS (individuals or organizations that sponsor orphans)
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Uganda',
  organization TEXT,
  sponsor_type TEXT NOT NULL DEFAULT 'individual' CHECK (sponsor_type IN ('individual','corporate','ngo','government','foundation')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  tax_id TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read sponsors"
  ON public.sponsors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'director'));
CREATE POLICY "Orphanage staff can insert sponsors"
  ON public.sponsors FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));
CREATE POLICY "Orphanage staff can update sponsors"
  ON public.sponsors FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));
CREATE POLICY "Admins can delete sponsors"
  ON public.sponsors FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. SPONSORSHIPS (linking sponsors to learners/orphans)
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  sponsorship_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('full','partial','educational','medical','emergency')),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_amount NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(sponsor_id, learner_id)
);

ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read sponsorships"
  ON public.sponsorships FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'director'));
CREATE POLICY "Orphanage staff can manage sponsorships"
  ON public.sponsorships FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));
CREATE POLICY "Orphanage staff can update sponsorships"
  ON public.sponsorships FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- 3. SPONSORSHIP PAYMENTS
CREATE TABLE IF NOT EXISTS public.sponsorship_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID NOT NULL REFERENCES public.sponsorships(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'UGX',
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash','bank_transfer','mobile_money','cheque','credit_card','other')),
  reference_number TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.sponsorship_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read sponsorship_payments"
  ON public.sponsorship_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'accountant'));
CREATE POLICY "Orphanage staff can manage sponsorship_payments"
  ON public.sponsorship_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'accountant'));

-- 4. EDUCATIONAL SUPPORT (school fees, supplies, tutoring, performance)
CREATE TABLE IF NOT EXISTS public.orphan_educational_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  school_fees_paid NUMERIC(12,2) DEFAULT 0,
  school_fees_balance NUMERIC(12,2) DEFAULT 0,
  supplies_provided TEXT,
  supplies_cost NUMERIC(12,2) DEFAULT 0,
  tutoring_hours NUMERIC(6,2) DEFAULT 0,
  tutoring_notes TEXT,
  performance_score NUMERIC(5,2),
  performance_grade TEXT,
  attendance_rate NUMERIC(5,2),
  teacher_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(learner_id, term, academic_year)
);

ALTER TABLE public.orphan_educational_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read educational_support"
  ON public.orphan_educational_support FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Orphanage staff can manage educational_support"
  ON public.orphan_educational_support FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- 5. LIVING & HEALTHCARE (health visits, living conditions, counseling)
CREATE TABLE IF NOT EXISTS public.orphan_living_healthcare (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  living_condition_score INTEGER CHECK (living_condition_score BETWEEN 1 AND 5),
  living_condition_notes TEXT,
  health_status TEXT,
  medical_visit_count INTEGER DEFAULT 0,
  last_medical_visit_date DATE,
  counselor_visit_count INTEGER DEFAULT 0,
  last_counselor_visit_date DATE,
  nutrition_status TEXT CHECK (nutrition_status IN ('good','fair','poor')),
  bmi NUMERIC(5,2),
  next_checkup_date DATE,
  notes TEXT,
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orphan_living_healthcare ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read living_healthcare"
  ON public.orphan_living_healthcare FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'nurse'));
CREATE POLICY "Orphanage staff can manage living_healthcare"
  ON public.orphan_living_healthcare FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'nurse'));

-- 6. RELIGIOUS DEVELOPMENT (Quran, Islamic studies, salah, tarbiyah)
CREATE TABLE IF NOT EXISTS public.orphan_religious_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  quran_memorization TEXT,
  quran_pages INTEGER DEFAULT 0,
  islamic_studies_score NUMERIC(5,2),
  salah_attendance_rate NUMERIC(5,2),
  tarbiyah_score NUMERIC(5,2),
  conduct_rating INTEGER CHECK (conduct_rating BETWEEN 1 AND 5),
  madrasa_attendance_rate NUMERIC(5,2),
  teacher_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(learner_id, term, academic_year)
);

ALTER TABLE public.orphan_religious_development ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read religious_development"
  ON public.orphan_religious_development FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Orphanage staff can manage religious_development"
  ON public.orphan_religious_development FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- 7. SOCIAL & SPORTS (activities, events, participation)
CREATE TABLE IF NOT EXISTS public.orphan_social_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('sports','cultural','club','outreach','competition','recreation','life_skills','community_service')),
  activity_name TEXT NOT NULL,
  activity_date DATE NOT NULL,
  participation_level TEXT CHECK (participation_level IN ('excellent','good','average','poor')),
  achievement TEXT,
  notes TEXT,
  supervised_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orphan_social_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read social_sports"
  ON public.orphan_social_sports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));
CREATE POLICY "Orphanage staff can manage social_sports"
  ON public.orphan_social_sports FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- 8. SPONSOR REPORTS (generated reports for sponsors)
CREATE TABLE IF NOT EXISTS public.sponsor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID NOT NULL REFERENCES public.sponsorships(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly','quarterly','annual','custom')),
  report_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  academic_progress TEXT,
  health_update TEXT,
  religious_progress TEXT,
  social_activities TEXT,
  photo_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final','sent')),
  sent_at TIMESTAMPTZ,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sponsor_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read sponsor_reports"
  ON public.sponsor_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));
CREATE POLICY "Orphanage staff can manage sponsor_reports"
  ON public.sponsor_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- 9. ORPHAN ALERTS (configurable alerts and notifications)
CREATE TABLE IF NOT EXISTS public.orphan_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'health_concern','academic_concern','behavioral_concern','attendance_concern',
    'sponsorship_expiry','sponsorship_payment_due','report_due','checkup_due',
    'birthday','general'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical','high','medium','low','info')),
  title TEXT NOT NULL,
  message TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orphan_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read alerts"
  ON public.orphan_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor') OR public.has_role(auth.uid(), 'director'));
CREATE POLICY "Orphanage staff can manage alerts"
  ON public.orphan_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- 10. ORPHAN CASE NOTES (social worker case notes)
CREATE TABLE IF NOT EXISTS public.orphan_case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('general','home_visit','school_visit','counseling','medical','sponsor_communication','incident')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.orphan_case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orphanage staff can read case_notes"
  ON public.orphan_case_notes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));
CREATE POLICY "Orphanage staff can manage case_notes"
  ON public.orphan_case_notes FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'orphan_supervisor'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_learner ON public.sponsorships(learner_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON public.sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON public.sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_sponsorship ON public.sponsorship_payments(sponsorship_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_date ON public.sponsorship_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_orphan_educational_learner_term ON public.orphan_educational_support(learner_id, term, academic_year);
CREATE INDEX IF NOT EXISTS idx_orphan_living_healthcare_learner ON public.orphan_living_healthcare(learner_id);
CREATE INDEX IF NOT EXISTS idx_orphan_religious_learner_term ON public.orphan_religious_development(learner_id, term, academic_year);
CREATE INDEX IF NOT EXISTS idx_orphan_social_sports_learner ON public.orphan_social_sports(learner_id);
CREATE INDEX IF NOT EXISTS idx_orphan_social_sports_date ON public.orphan_social_sports(activity_date);
CREATE INDEX IF NOT EXISTS idx_sponsor_reports_sponsorship ON public.sponsor_reports(sponsorship_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_reports_date ON public.sponsor_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_orphan_alerts_learner ON public.orphan_alerts(learner_id);
CREATE INDEX IF NOT EXISTS idx_orphan_alerts_resolved ON public.orphan_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_orphan_case_notes_learner ON public.orphan_case_notes(learner_id);

-- Add is_orphan flag to learners table if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learners' AND column_name='is_orphan') THEN
    ALTER TABLE public.learners ADD COLUMN is_orphan BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learners' AND column_name='orphan_status') THEN
    ALTER TABLE public.learners ADD COLUMN orphan_status TEXT DEFAULT 'registered' CHECK (orphan_status IN ('registered','assessed','supported','graduated','transferred'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learners' AND column_name='orphan_notes') THEN
    ALTER TABLE public.learners ADD COLUMN orphan_notes TEXT;
  END IF;
END $$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsorships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsorship_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orphan_alerts;
