
-- Update app_role enum to include missing roles
-- Note: Enum values must be added in a separate transaction from where they are first used.
DO $$ 
BEGIN 
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_teacher';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security';
EXCEPTION 
    WHEN others THEN NULL; 
END $$;
