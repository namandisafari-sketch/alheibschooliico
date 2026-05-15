
-- Fee structures (catalog of fee items)
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tuition',
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  class_level INTEGER,
  applies_to TEXT NOT NULL DEFAULT 'all',
  term TEXT,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-learner fee assignments / exemptions
CREATE TABLE public.fee_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  custom_amount NUMERIC(12,2),
  is_exempted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(learner_id, fee_structure_id)
);

-- Payments
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE RESTRICT,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  term TEXT,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fee_payments_learner ON public.fee_payments(learner_id);
CREATE INDEX idx_fee_payments_date ON public.fee_payments(payment_date DESC);
CREATE INDEX idx_fee_payments_receipt ON public.fee_payments(receipt_number);

-- Bursar red list rules
CREATE TABLE public.bursar_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'balance_threshold',
  balance_threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  applies_to_all_classes BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Override requests when blocked
CREATE TABLE public.bursar_override_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.bursar_rules(id) ON DELETE SET NULL,
  reason TEXT,
  outstanding_balance NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_override_status ON public.bursar_override_requests(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bursar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bursar_override_requests ENABLE ROW LEVEL SECURITY;

-- Fee structures policies
CREATE POLICY "Anyone authenticated can view fee structures"
  ON public.fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fee structures"
  ON public.fee_structures FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fee assignments policies
CREATE POLICY "Staff view fee assignments"
  ON public.fee_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fee assignments"
  ON public.fee_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fee payments policies
CREATE POLICY "Staff view fee payments"
  ON public.fee_payments FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "Parents view own children payments"
  ON public.fee_payments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM parent_learner_links
            WHERE parent_user_id = auth.uid() AND learner_id = fee_payments.learner_id)
  );
CREATE POLICY "Admin and staff record payments"
  ON public.fee_payments FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "Admins update payments"
  ON public.fee_payments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete payments"
  ON public.fee_payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Bursar rules policies
CREATE POLICY "Staff view bursar rules"
  ON public.bursar_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bursar rules"
  ON public.bursar_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Override requests policies
CREATE POLICY "Staff view override requests"
  ON public.bursar_override_requests FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
  );
CREATE POLICY "Staff create override requests"
  ON public.bursar_override_requests FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "Admins manage override requests"
  ON public.bursar_override_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_fee_structures_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bursar_rules_updated_at
  BEFORE UPDATE ON public.bursar_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
