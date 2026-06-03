
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'storekeeper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gateman';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direct_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dos';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALERT TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
DO $$ BEGIN
  CREATE TYPE public.approval_stage AS ENUM (
    'submitted','manager_approved','director_approved','accountant_verified',
    'final_approved','dispatched','gate_verified','completed','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active','suspended','disconnected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
