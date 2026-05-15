-- Director Control System: nurse + DOS roles, kill-switch, permissions, warnings, appeals, leave/advance, letters, DMs
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dos';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active','suspended','disconnected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT COALESCE((SELECT allowed FROM public.user_permissions WHERE user_id = _user_id AND permission_key = _key LIMIT 1), false);
$fn$;

DROP POLICY IF EXISTS "users read own perms" ON public.user_permissions;
CREATE POLICY "users read own perms" ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "director manage perms" ON public.user_permissions;
CREATE POLICY "director manage perms" ON public.user_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES auth.users(id),
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warnings read" ON public.user_warnings;
CREATE POLICY "warnings read" ON public.user_warnings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "warnings ack" ON public.user_warnings;
CREATE POLICY "warnings ack" ON public.user_warnings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "warnings issue" ON public.user_warnings;
CREATE POLICY "warnings issue" ON public.user_warnings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'dos'));

CREATE TABLE IF NOT EXISTS public.account_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_appeals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appeals read" ON public.account_appeals;
CREATE POLICY "appeals read" ON public.account_appeals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "appeals submit" ON public.account_appeals;
CREATE POLICY "appeals submit" ON public.account_appeals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "appeals review" ON public.account_appeals;
CREATE POLICY "appeals review" ON public.account_appeals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave own read" ON public.leave_requests;
CREATE POLICY "leave own read" ON public.leave_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'head_teacher') OR public.has_role(auth.uid(),'dos'));
DROP POLICY IF EXISTS "leave own create" ON public.leave_requests;
CREATE POLICY "leave own create" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "leave approve" ON public.leave_requests;
CREATE POLICY "leave approve" ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'dos'));

CREATE TABLE IF NOT EXISTS public.advance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  repayment_plan text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adv own read" ON public.advance_requests;
CREATE POLICY "adv own read" ON public.advance_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'accountant'));
DROP POLICY IF EXISTS "adv own create" ON public.advance_requests;
CREATE POLICY "adv own create" ON public.advance_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "adv approve" ON public.advance_requests;
CREATE POLICY "adv approve" ON public.advance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'accountant'));

CREATE TABLE IF NOT EXISTS public.staff_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_role text NOT NULL,
  to_user uuid REFERENCES auth.users(id),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_letters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "letters read" ON public.staff_letters;
CREATE POLICY "letters read" ON public.staff_letters FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "letters send" ON public.staff_letters;
CREATE POLICY "letters send" ON public.staff_letters FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
DROP POLICY IF EXISTS "letters update" ON public.staff_letters;
CREATE POLICY "letters update" ON public.staff_letters FOR UPDATE TO authenticated
  USING (to_user = auth.uid() OR from_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm read" ON public.direct_messages;
CREATE POLICY "dm read" ON public.direct_messages FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
DROP POLICY IF EXISTS "dm send" ON public.direct_messages;
CREATE POLICY "dm send" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
DROP POLICY IF EXISTS "dm update" ON public.direct_messages;
CREATE POLICY "dm update" ON public.direct_messages FOR UPDATE TO authenticated
  USING (to_user = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_warnings; EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP POLICY IF EXISTS "director update profile" ON public.profiles;
CREATE POLICY "director update profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
