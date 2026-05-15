-- Add deputy_head_teacher role to app_role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'deputy_head_teacher') THEN
        ALTER TYPE public.app_role ADD VALUE 'deputy_head_teacher';
    END IF;
END $$;

-- Ensure head_teacher permissions are set
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'head_teacher'::public.app_role 
FROM public.profiles 
WHERE role = 'head_teacher'
ON CONFLICT DO NOTHING;
