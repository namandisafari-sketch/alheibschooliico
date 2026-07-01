-- Student Gate Check-in/out Log
CREATE TABLE IF NOT EXISTS public.student_gate_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method TEXT NOT NULL DEFAULT 'pdf417' CHECK (verification_method IN ('pdf417', 'qr', 'manual')),
  purpose TEXT DEFAULT 'Daily attendance',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_gate_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and staff manage student gate logs" ON public.student_gate_logs;
CREATE POLICY "Admin and staff manage student gate logs"
  ON public.student_gate_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Teachers view student gate logs" ON public.student_gate_logs;
CREATE POLICY "Teachers view student gate logs"
  ON public.student_gate_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE INDEX IF NOT EXISTS idx_student_gate_logs_learner_id ON public.student_gate_logs(learner_id);
CREATE INDEX IF NOT EXISTS idx_student_gate_logs_check_in ON public.student_gate_logs(check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_gate_logs_status ON public.student_gate_logs(status);
