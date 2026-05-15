
-- Migrate existing staff and teachers from profiles to the unified employees table
INSERT INTO public.employees (profile_id, full_name, role, email, phone, qualification, base_salary)
SELECT 
    p.id as profile_id,
    p.full_name,
    p.role,
    p.email,
    p.phone,
    p.qualification,
    COALESCE((SELECT base_salary FROM public.employees e WHERE e.profile_id = p.id), 350000) -- Default salary for migrated staff
FROM public.profiles p
WHERE p.role IN ('admin', 'teacher', 'support', 'driver', 'security', 'cook', 'cleaner', 'accountant')
ON CONFLICT (profile_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    qualification = EXCLUDED.qualification;

-- Add unique constraint to profile_id if not exists to prevent duplicates during migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_profile_id_key') THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;
