
-- Remaining System Enhancements: Fees, Health, Archive, Reviews, Error Handling

-- ===================== 1. FEE MANAGEMENT ENHANCEMENTS =====================

-- Fee Discounts
CREATE TABLE IF NOT EXISTS public.fee_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  value NUMERIC(12,2) NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'class', 'learner', 'fee_structure')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fee_discounts read" ON public.fee_discounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "fee_discounts write" ON public.fee_discounts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fee Payment Plans (Installment Schedules)
CREATE TABLE IF NOT EXISTS public.fee_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  installment_amount NUMERIC(12,2) NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'termly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fee_payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fee_payment_plans read" ON public.fee_payment_plans FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));
CREATE POLICY "fee_payment_plans write" ON public.fee_payment_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fee Reporting View
CREATE OR REPLACE VIEW public.fee_summary_view WITH (security_invoker = true) AS
SELECT
  l.id AS learner_id,
  l.full_name AS learner_name,
  c.name AS class_name,
  COALESCE(SUM(fa.custom_amount), 0) AS total_fees,
  COALESCE(SUM(fp.amount), 0) AS total_paid,
  COALESCE(SUM(fa.custom_amount), 0) - COALESCE(SUM(fp.amount), 0) AS balance,
  COUNT(DISTINCT fp.id) AS payment_count
FROM learners l
LEFT JOIN classes c ON l.class_id = c.id
LEFT JOIN fee_assignments fa ON l.id = fa.learner_id
LEFT JOIN fee_payments fp ON l.id = fp.learner_id
WHERE l.status = 'active'
GROUP BY l.id, l.full_name, c.name;

-- ===================== 2. HEALTH MODULE ENHANCEMENTS =====================

-- Add director_notes and audit_log columns to health_visits
ALTER TABLE IF EXISTS public.health_visits
  ADD COLUMN IF NOT EXISTS director_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.medical_incidents
  ADD COLUMN IF NOT EXISTS director_notes TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- ===================== 3. ARCHIVE CATEGORIES =====================

CREATE TABLE IF NOT EXISTS public.archive_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.archive_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "archive_categories read" ON public.archive_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "archive_categories write" ON public.archive_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===================== 4. REVIEWS & RATINGS =====================

CREATE TABLE IF NOT EXISTS public.reviews_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('parent', 'staff', 'teacher', 'visitor')),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('academic', 'discipline', 'facilities', 'teaching', 'administration', 'general')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reviews_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews read approved" ON public.reviews_ratings FOR SELECT TO authenticated
  USING (is_approved = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "reviews insert" ON public.reviews_ratings FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "reviews approve" ON public.reviews_ratings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Rating Aggregation View
CREATE OR REPLACE VIEW public.rating_summary_view WITH (security_invoker = true) AS
SELECT
  category,
  COUNT(*) AS total_reviews,
  ROUND(AVG(rating)::numeric, 1) AS average_rating,
  COUNT(*) FILTER (WHERE rating = 5) AS five_star,
  COUNT(*) FILTER (WHERE rating = 4) AS four_star,
  COUNT(*) FILTER (WHERE rating = 3) AS three_star,
  COUNT(*) FILTER (WHERE rating = 2) AS two_star,
  COUNT(*) FILTER (WHERE rating = 1) AS one_star
FROM public.reviews_ratings
WHERE is_approved = true
GROUP BY category;

-- ===================== 5. MILESTONES & RECORDS =====================

CREATE TABLE IF NOT EXISTS public.learner_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('academic', 'sports', 'behavioral', 'attendance', 'extracurricular', 'islamic', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  achieved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id),
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.learner_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones read" ON public.learner_milestones FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'head_teacher'::app_role) OR has_role(auth.uid(), 'dos'::app_role));
CREATE POLICY "milestones write" ON public.learner_milestones FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- ===================== 6. CENTRALIZED ERROR LOGGING =====================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  url TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  stack_trace TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "error_logs read" ON public.error_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "error_logs insert" ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "error_logs update" ON public.error_logs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===================== 7. SITE SETTINGS ENHANCEMENT =====================

-- Ensure site_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings read" ON public.site_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "site_settings write" ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default settings
INSERT INTO public.site_settings (key, value, category, description)
VALUES
  ('school_name', '"Alheib Mixed Day & Boarding School"', 'general', 'School display name'),
  ('academic_year', '2026', 'academic', 'Current academic year'),
  ('current_term', '"Term 2"', 'academic', 'Current term'),
  ('attendance_radius', '250', 'attendance', 'Geofence radius in meters for staff check-in'),
  ('campus_latitude', '0.3167', 'attendance', 'Campus center latitude'),
  ('campus_longitude', '32.5825', 'attendance', 'Campus center longitude')
ON CONFLICT (key) DO NOTHING;

-- ===================== 8. REAL-TIME PUBLICATION =====================

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.fee_discounts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.fee_payment_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.reviews_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.learner_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.error_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.welfare_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.archive_categories;

-- ===================== 9. UPDATE TRIGGERS =====================

CREATE TRIGGER update_fee_discounts_updated_at
  BEFORE UPDATE ON public.fee_discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_payment_plans_updated_at
  BEFORE UPDATE ON public.fee_payment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 10. AUDIT NOTIFICATIONS =====================

-- Add new tables to audit trigger function
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_message TEXT;
BEGIN
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = auth.uid();

  v_message := CASE TG_OP
    WHEN 'INSERT' THEN COALESCE(v_user_name, 'System') || ' created a ' || TG_TABLE_NAME || ' record'
    WHEN 'UPDATE' THEN COALESCE(v_user_name, 'System') || ' updated a ' || TG_TABLE_NAME || ' record'
    WHEN 'DELETE' THEN COALESCE(v_user_name, 'System') || ' deleted a ' || TG_TABLE_NAME || ' record'
    ELSE TG_OP || ' on ' || TG_TABLE_NAME
  END;

  INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );

  INSERT INTO public.in_app_notifications (user_id, title, message, type, link)
  SELECT id, 'System Update', v_message, 'audit',
    '/' || TG_TABLE_NAME
  FROM public.profiles
  WHERE has_role(id, 'admin'::app_role) OR has_role(id, 'director'::app_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers to new tables
CREATE TRIGGER trg_fee_discounts_audit AFTER INSERT OR UPDATE OR DELETE ON public.fee_discounts
  FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_fee_payment_plans_audit AFTER INSERT OR UPDATE OR DELETE ON public.fee_payment_plans
  FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_reviews_ratings_audit AFTER INSERT OR UPDATE OR DELETE ON public.reviews_ratings
  FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_learner_milestones_audit AFTER INSERT OR UPDATE OR DELETE ON public.learner_milestones
  FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_welfare_reports_audit AFTER INSERT OR UPDATE OR DELETE ON public.welfare_reports
  FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
