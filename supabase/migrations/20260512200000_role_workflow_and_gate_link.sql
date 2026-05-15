-- =============================================================================
-- Migration: 20260512200000_role_workflow_and_gate_link
-- Role-Based Approval Workflow + Gate Pass Linkage
-- Idempotent. Apply via Lovable Cloud → SQL Editor, or copy into your
-- supabase/migrations/ folder and run `supabase db push`.
-- =============================================================================

-- 1. ROLES --------------------------------------------------------------------
DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direct_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center_director';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'storekeeper';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gateman';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. APPROVAL STAGE ENUM ------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.approval_stage AS ENUM (
    'submitted',
    'manager_approved',
    'director_approved',
    'accountant_verified',
    'final_approved',
    'dispatched',
    'gate_verified',
    'completed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. WORKFLOW + GATE COLUMNS --------------------------------------------------
ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS manager_approval_by      uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS director_approval_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS accountant_approval_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS accountant_approval_date timestamptz,
  ADD COLUMN IF NOT EXISTS final_approval_by        uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS final_approval_date      timestamptz,
  ADD COLUMN IF NOT EXISTS dispatched_at            timestamptz,
  ADD COLUMN IF NOT EXISTS direction                text DEFAULT 'out'
                CHECK (direction IN ('in','out')),
  ADD COLUMN IF NOT EXISTS rejection_reason         text,
  ADD COLUMN IF NOT EXISTS gateman_id               uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS gate_verified_at         timestamptz,
  ADD COLUMN IF NOT EXISTS gate_notes               text,
  ADD COLUMN IF NOT EXISTS qr_verification_code     text UNIQUE
                                                     DEFAULT gen_random_uuid()::text;

ALTER TABLE public.employee_advances
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS director_approval_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS director_approval_date   timestamptz,
  ADD COLUMN IF NOT EXISTS accountant_approval_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS accountant_approval_date timestamptz,
  ADD COLUMN IF NOT EXISTS office_approval_date     timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason         text;

ALTER TABLE public.liquidity_requests
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS director_approval_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS director_approval_date timestamptz,
  ADD COLUMN IF NOT EXISTS office_approval_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS office_approval_date   timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason       text;

-- 4. ROLE GUARD HELPER --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = ANY(_roles)
  );
$$;

-- 5. STAGE-ADVANCEMENT RPCs ---------------------------------------------------
-- Stock: storekeeper → direct_manager → center_director → accountant → office_manager → gateman
CREATE OR REPLACE FUNCTION public.advance_stock_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.inventory_transactions WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Stock request % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.inventory_transactions
       SET stage='rejected', status='rejected', rejection_reason=_reason
     WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['direct_manager','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Direct Manager can approve at this stage';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='manager_approved', status='manager_approved',
             manager_approval_by=_uid, manager_approval_date=now()
       WHERE id=_id;
      _new := 'manager_approved';

    WHEN 'manager_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Center Director can approve at this stage';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='director_approved', status='director_approved',
             director_approval_by=_uid, director_approval_date=now()
       WHERE id=_id;
      _new := 'director_approved';

    WHEN 'director_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['accountant','admin']) THEN
        RAISE EXCEPTION 'Only Accountant can verify at this stage';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='accountant_verified',
             accountant_approval_by=_uid, accountant_approval_date=now()
       WHERE id=_id;
      _new := 'accountant_verified';

    WHEN 'accountant_verified' THEN
      IF NOT has_any_role(_uid, ARRAY['office_manager','admin']) THEN
        RAISE EXCEPTION 'Only Office Manager can give final approval';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='dispatched', status='dispatched',
             final_approval_by=_uid, final_approval_date=now(),
             dispatched_at=now()
       WHERE id=_id;
      _new := 'dispatched';

    ELSE
      RAISE EXCEPTION 'Stock request already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;

-- Custody: applicant → center_director → accountant → office_manager
CREATE OR REPLACE FUNCTION public.advance_custody_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.employee_advances WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Advance % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.employee_advances SET stage='rejected', status='rejected', rejection_reason=_reason WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Center Director can approve';
      END IF;
      UPDATE public.employee_advances
         SET stage='director_approved',
             director_approval_by=_uid, director_approval_date=now()
       WHERE id=_id;
      _new := 'director_approved';

    WHEN 'director_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['accountant','admin']) THEN
        RAISE EXCEPTION 'Only Accountant can verify';
      END IF;
      UPDATE public.employee_advances
         SET stage='accountant_verified',
             accountant_approval_by=_uid, accountant_approval_date=now(),
             compliance_checked=true, budget_available=true
       WHERE id=_id;
      _new := 'accountant_verified';

    WHEN 'accountant_verified' THEN
      IF NOT has_any_role(_uid, ARRAY['office_manager','admin']) THEN
        RAISE EXCEPTION 'Only Office Manager can give final approval';
      END IF;
      UPDATE public.employee_advances
         SET stage='final_approved',
             office_approval_by=_uid, office_approval_date=now(), status='approved'
       WHERE id=_id;
      _new := 'final_approved';

    ELSE
      RAISE EXCEPTION 'Advance already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;

-- Liquidity: accountant → center_director → office_manager
CREATE OR REPLACE FUNCTION public.advance_liquidity_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.liquidity_requests WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Liquidity request % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.liquidity_requests SET stage='rejected', status='rejected', rejection_reason=_reason WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Center Director can approve';
      END IF;
      UPDATE public.liquidity_requests
         SET stage='director_approved',
             director_approval_by=_uid, director_approval_date=now()
       WHERE id=_id;
      _new := 'director_approved';

    WHEN 'director_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['office_manager','admin']) THEN
        RAISE EXCEPTION 'Only Office Manager can give final approval';
      END IF;
      UPDATE public.liquidity_requests
         SET stage='final_approved',
             office_approval_by=_uid, office_approval_date=now(), status='approved'
       WHERE id=_id;
      _new := 'final_approved';

    ELSE
      RAISE EXCEPTION 'Liquidity request already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;

-- 6. GATE PASS LINKAGE --------------------------------------------------------
-- Gateman scans the QR code printed on the Stock Request form. Only succeeds
-- when stage='dispatched' (i.e. the full approval chain is complete).
CREATE OR REPLACE FUNCTION public.gate_verify_movement(
  _qr_code text, _direction text, _notes text DEFAULT NULL
) RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid; _cur public.approval_stage;
BEGIN
  IF _direction NOT IN ('in','out') THEN
    RAISE EXCEPTION 'direction must be in or out';
  END IF;
  IF NOT has_any_role(_uid, ARRAY['gateman','security','admin']) THEN
    RAISE EXCEPTION 'Only Gateman / Security can verify gate movements';
  END IF;

  SELECT id, stage INTO _id, _cur
    FROM public.inventory_transactions
   WHERE qr_verification_code = _qr_code;

  IF _id IS NULL THEN
    RAISE EXCEPTION 'No request matches QR code %', _qr_code;
  END IF;
  IF _cur <> 'dispatched' THEN
    RAISE EXCEPTION 'Cannot release at gate — current stage is % (must be dispatched)', _cur;
  END IF;

  UPDATE public.inventory_transactions
     SET stage='gate_verified', status='verified_at_gate',
         gateman_id=(SELECT id FROM public.profiles WHERE id=_uid),
         gate_verified_at=now(),
         gate_notes=_notes,
         direction=_direction
   WHERE id=_id;

  RETURN 'gate_verified';
END $$;

-- Close the loop (delivery / receipt)
CREATE OR REPLACE FUNCTION public.gate_complete_movement(_id uuid)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gateman','security','storekeeper','admin']) THEN
    RAISE EXCEPTION 'Insufficient role to complete movement';
  END IF;
  UPDATE public.inventory_transactions
     SET stage='completed', status='completed'
   WHERE id=_id AND stage='gate_verified';
  RETURN 'completed';
END $$;

-- 7. GATEMAN VIEW -------------------------------------------------------------
DROP VIEW IF EXISTS public.active_gate_passes;
CREATE OR REPLACE VIEW public.active_gate_passes AS
SELECT
  t.id,
  t.tracking_number,
  t.qr_verification_code,
  t.direction,
  t.stage,
  t.dispatched_at,
  t.gate_verified_at,
  i.name           AS item_name,
  t.quantity,
  t.approved_quantity,
  p.full_name      AS requester_name
FROM public.inventory_transactions t
JOIN public.inventory_items i ON t.item_id = i.id
LEFT JOIN public.profiles p   ON t.staff_id = p.id
WHERE t.stage IN ('dispatched','gate_verified');

-- 8. GRANTS -------------------------------------------------------------------
GRANT SELECT  ON public.active_gate_passes                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_stock_request(uuid,text,text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_custody_request(uuid,text,text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_liquidity_request(uuid,text,text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_verify_movement(text,text,text)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_complete_movement(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid,text[])                   TO authenticated;

-- 9. SAMPLE TEST ACCOUNTS -----------------------------------------------------
-- Create these in Auth → Users first, then this block assigns the role.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'storekeeper'::public.app_role
  FROM auth.users u WHERE u.email='store@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'direct_manager'::public.app_role
  FROM auth.users u WHERE u.email='manager@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'center_director'::public.app_role
  FROM auth.users u WHERE u.email='director@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'accountant'::public.app_role
  FROM auth.users u WHERE u.email='accountant@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'office_manager'::public.app_role
  FROM auth.users u WHERE u.email='office@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'gateman'::public.app_role
  FROM auth.users u WHERE u.email='gate@alheib.test' ON CONFLICT DO NOTHING;
