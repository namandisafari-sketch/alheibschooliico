-- =====================================================================
-- Alheib Mixed Day & Boarding School - Supabase Role Consolidation Script
-- =====================================================================
-- This script aligns existing database registrations and roles with the 
-- 7 unified core system roles displayed on the User Management / Access Controls page.
--
-- Cohesive Core Role Hierarchy:
--   1. admin         -> Administrator / Director / Manager / Proprietor
--   2. teacher       -> Educator / Class Teacher / Subject Teacher
--   3. parent        -> Learner Parent / Guardian
--   4. staff         -> Infirmary Caretaker, Storekeep, Office Admin, Comms, Secretary
--   5. security      -> Campus Guards, Gatemen, Visitor Loggers
--   6. accountant    -> School Bursar, Cashier, Treasurer
--   7. head_teacher  -> Head Teacher, Deputy heads, Director of Studies (DOS)
-- =====================================================================

DO $$
BEGIN
    -- 1. Ensure the core public app roles are correctly added if missing in the type enum
    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'admin';
    END IF;

    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'teacher';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'teacher';
    END IF;

    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'parent';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'parent';
    END IF;

    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'staff';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'staff';
    END IF;

    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'security';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'security';
    END IF;

    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'accountant';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'accountant';
    END IF;

    PERFORM FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'head_teacher';
    IF NOT FOUND THEN
        ALTER TYPE public.app_role ADD VALUE 'head_teacher';
    END IF;
END $$;

-- 2. Migrate existing user roles systematically and clean up legacy profiles & labels
UPDATE public.user_roles
SET role = 'admin'::public.app_role
WHERE role::text IN ('ict_admin', 'director', 'center_director', 'direct_manager', 'board_director', 'proprietor');

UPDATE public.user_roles
SET role = 'head_teacher'::public.app_role
WHERE role::text IN ('deputy_head_teacher', 'dos', 'islamic_coordinator', 'sheikh', 'discipline_master');

UPDATE public.user_roles
SET role = 'teacher'::public.app_role
WHERE role::text IN ('class_teacher', 'subject_teacher');

UPDATE public.user_roles
SET role = 'accountant'::public.app_role
WHERE role::text IN ('bursar', 'cashier');

UPDATE public.user_roles
SET role = 'security'::public.app_role
WHERE role::text IN ('gateman');

UPDATE public.user_roles
SET role = 'staff'::public.app_role
WHERE role::text IN ('nurse', 'matron', 'office_manager', 'secretary', 'librarian', 'storekeeper', 'store_manager', 'smc_member', 'alumni', 'donor');

-- Confirm success metric
SELECT role, count(*) 
FROM public.user_roles 
GROUP BY role;
