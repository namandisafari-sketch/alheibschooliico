-- Add missing roles to app_role enum that are referenced in profiles_role_check
-- and used throughout the codebase but were never added to the enum
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'orphan_supervisor';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'matron';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cook';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_manager';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION WHEN others THEN NULL;
END $$;
