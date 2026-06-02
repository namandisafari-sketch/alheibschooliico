-- =====================================================================
-- RUN THIS IN THE LOVABLE CLOUD SQL EDITOR
-- Fixes: "Could not find the table 'public.leave_requests' in the schema cache"
-- and adds every column the Alheib leave-request form writes, plus a 2-stage
-- approval workflow (Supervisor / Head of Dept  →  Administration / Director).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS form_ref text,
  ADD COLUMN IF NOT EXISTS leave_type_other text,
  ADD COLUMN IF NOT EXISTS days_count int,
  ADD COLUMN IF NOT EXISTS employee_full_name text,
  ADD COLUMN IF NOT EXISTS employee_department text,
  ADD COLUMN IF NOT EXISTS employee_position text,
  ADD COLUMN IF NOT EXISTS employee_phone text,
  ADD COLUMN IF NOT EXISTS employee_signature_name text,
  ADD COLUMN IF NOT EXISTS employee_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS covering_staff_name text,
  ADD COLUMN IF NOT EXISTS covering_staff_position text,
  ADD COLUMN IF NOT EXISTS covering_staff_job_title text,
  ADD COLUMN IF NOT EXISTS covering_staff_department text,
  ADD COLUMN IF NOT EXISTS responsibilities_summary text,
  ADD COLUMN IF NOT EXISTS covering_staff_signature_name text,
  ADD COLUMN IF NOT EXISTS covering_staff_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS supervisor_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS supervisor_name text,
  ADD COLUMN IF NOT EXISTS supervisor_decision text,
  ADD COLUMN IF NOT EXISTS supervisor_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS admin_name text,
  ADD COLUMN IF NOT EXISTS admin_decision text,
  ADD COLUMN IF NOT EXISTS admin_comments text,
  ADD COLUMN IF NOT EXISTS admin_signed_at timestamptz;

CREATE SEQUENCE IF NOT EXISTS public.leave_form_seq START 1;

CREATE OR REPLACE FUNCTION public.set_leave_form_ref()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.form_ref IS NULL OR NEW.form_ref = '' THEN
    NEW.form_ref := 'ALH-LV-' || LPAD(nextval('public.leave_form_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_leave_form_ref ON public.leave_requests;
CREATE TRIGGER trg_leave_form_ref BEFORE INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_leave_form_ref();

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave own read"   ON public.leave_requests;
DROP POLICY IF EXISTS "leave own create" ON public.leave_requests;
DROP POLICY IF EXISTS "leave approve"    ON public.leave_requests;
DROP POLICY IF EXISTS "leave read"       ON public.leave_requests;
DROP POLICY IF EXISTS "leave insert"     ON public.leave_requests;
DROP POLICY IF EXISTS "leave update"     ON public.leave_requests;

CREATE POLICY "leave read" ON public.leave_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'center_director')
    OR public.has_role(auth.uid(),'direct_manager')
    OR public.has_role(auth.uid(),'manager')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'dos')
  );
CREATE POLICY "leave insert" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "leave update" ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'center_director')
    OR public.has_role(auth.uid(),'direct_manager')
    OR public.has_role(auth.uid(),'manager')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'dos')
  );

-- ---------- advance_requests ----------
CREATE TABLE IF NOT EXISTS public.advance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  repayment_plan text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adv own read"   ON public.advance_requests;
DROP POLICY IF EXISTS "adv own create" ON public.advance_requests;
DROP POLICY IF EXISTS "adv approve"    ON public.advance_requests;
DROP POLICY IF EXISTS "adv read"       ON public.advance_requests;
DROP POLICY IF EXISTS "adv insert"     ON public.advance_requests;
DROP POLICY IF EXISTS "adv update"     ON public.advance_requests;

CREATE POLICY "adv read" ON public.advance_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "adv insert" ON public.advance_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "adv update" ON public.advance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'manager'));

-- Refresh PostgREST schema cache so new columns are visible to the API immediately
NOTIFY pgrst, 'reload schema';
