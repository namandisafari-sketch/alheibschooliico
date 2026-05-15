
-- Update has_role function to be more robust with the new roles
-- This depends on 20260427160000_fix_roles.sql being committed first
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) OR EXISTS (
    -- Fallback to profile role if user_roles is not set yet (for new signups)
    SELECT 1 
    FROM public.profiles 
    WHERE id = _user_id 
    AND (
      (role = 'admin' AND _role = 'admin'::public.app_role) OR
      (role = 'teacher' AND _role = 'teacher'::public.app_role) OR
      (role = 'accountant' AND _role = 'accountant'::public.app_role)
    )
  )
$$;
