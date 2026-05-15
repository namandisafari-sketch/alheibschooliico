
CREATE TABLE public.emergency_reentry_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_visit_id uuid REFERENCES public.visitor_visits(id) ON DELETE SET NULL,
  visitor_id uuid REFERENCES public.visitors(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_phone text,
  id_number text,
  purpose text,
  host_name text,
  badge_number text NOT NULL,
  serial text NOT NULL UNIQUE,
  duration_minutes integer NOT NULL DEFAULT 60,
  print_width integer NOT NULL DEFAULT 80,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  issued_by uuid,
  notes text,
  voided boolean NOT NULL DEFAULT false,
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reentry_slips_issued_at ON public.emergency_reentry_slips (issued_at DESC);
CREATE INDEX idx_reentry_slips_expires_at ON public.emergency_reentry_slips (expires_at);

ALTER TABLE public.emergency_reentry_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff manage reentry slips"
  ON public.emergency_reentry_slips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Teachers view reentry slips"
  ON public.emergency_reentry_slips
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role));
