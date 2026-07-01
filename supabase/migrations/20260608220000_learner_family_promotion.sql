-- Learner Family Relationships
CREATE TABLE IF NOT EXISTS public.learner_family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  related_learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'brother','sister','half_brother','half_sister','cousin','twin','other'
  )),
  is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(learner_id, related_learner_id),
  CHECK (learner_id <> related_learner_id)
);

ALTER TABLE public.learner_family ENABLE ROW LEVEL LEVEL SECURITY;

CREATE POLICY "Authenticated users can read learner_family"
  ON public.learner_family FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert learner_family"
  ON public.learner_family FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update learner_family"
  ON public.learner_family FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete learner_family"
  ON public.learner_family FOR DELETE USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE public.learner_family;

-- DOS Promotion Rules Engine
CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'average_score','subject_score','attendance','conduct','exam_series','custom_formula'
  )),
  operator TEXT CHECK (operator IN ('>=','>','<=','<','==','between')),
  min_value NUMERIC(6,2),
  max_value NUMERIC(6,2),
  applies_to_level INTEGER REFERENCES public.classes(level),
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_promote BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC(3,2) DEFAULT 1.00 CHECK (weight >= 0 AND weight <= 1),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  term TEXT NOT NULL DEFAULT 'term_1',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','approved')),
  total_learners INTEGER DEFAULT 0,
  promoted_count INTEGER DEFAULT 0,
  repeated_count INTEGER DEFAULT 0,
  reviewed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.promotion_evaluations(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  from_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  average_score NUMERIC(6,2),
  total_score NUMERIC(8,2),
  attendance_rate NUMERIC(5,2),
  rules_passed INTEGER DEFAULT 0,
  rules_total INTEGER DEFAULT 0,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('promote','repeat','conditional','review')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','overridden','rejected')),
  override_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read promotion_rules"
  ON public.promotion_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin/DOS can manage promotion_rules"
  ON public.promotion_rules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin/DOS can update promotion_rules"
  ON public.promotion_rules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin/DOS can delete promotion_rules"
  ON public.promotion_rules FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read promotion_evaluations"
  ON public.promotion_evaluations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert promotion_evaluations"
  ON public.promotion_evaluations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update promotion_evaluations"
  ON public.promotion_evaluations FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read promotion_results"
  ON public.promotion_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert promotion_results"
  ON public.promotion_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update promotion_results"
  ON public.promotion_results FOR UPDATE USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_evaluations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_results;

-- Enhanced fee_structures with more detail columns
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]';
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS payment_deadline DATE;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS late_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS late_fee_type TEXT DEFAULT 'percentage' CHECK (late_fee_type IN ('percentage','fixed'));
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS discountable BOOLEAN DEFAULT true;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS refundable BOOLEAN DEFAULT false;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS installment_allowed BOOLEAN DEFAULT true;

-- Enhanced bursar_rules with more detail
ALTER TABLE public.bursar_rules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.bursar_rules ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'block_gate' CHECK (action IN ('block_gate','warn_only','notify_only','block_and_notify'));
ALTER TABLE public.bursar_rules ADD COLUMN IF NOT EXISTS notification_template TEXT;
ALTER TABLE public.bursar_rules ADD COLUMN IF NOT EXISTS auto_remind_days INTEGER DEFAULT 0;
ALTER TABLE public.bursar_rules ADD COLUMN IF NOT EXISTS apply_to_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.bursar_rules ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 0;

-- Enhanced expense_requests with line items
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]';
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS cost_center TEXT;
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','bank_transfer','mobile_money','cheque'));
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.expense_requests ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Discount rules configuration (new dedicated table for discount system rules)
CREATE TABLE IF NOT EXISTS public.discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  value NUMERIC(12,2) NOT NULL,
  priority INTEGER DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','pupil_status','class','learner','fee_structure','relationship')),
  filter_value TEXT,
  max_cap NUMERIC(12,2),
  requires_approval BOOLEAN DEFAULT true,
  approver_role TEXT DEFAULT 'admin' CHECK (approver_role IN ('admin','director','head_teacher','accountant')),
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discount applications
CREATE TABLE IF NOT EXISTS public.discount_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_rule_id UUID REFERENCES public.discount_rules(id) ON DELETE CASCADE,
  fee_discount_id UUID REFERENCES public.fee_discounts(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  applied_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','applied')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read discount_rules"
  ON public.discount_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage discount_rules"
  ON public.discount_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can read discount_applications"
  ON public.discount_applications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert discount_applications"
  ON public.discount_applications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin can update discount_applications"
  ON public.discount_applications FOR UPDATE USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_applications;
