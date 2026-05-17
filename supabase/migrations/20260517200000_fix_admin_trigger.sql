
-- Fix handle_new_user_role to correctly assign admin roles on signup for whitelisted emails
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if the new user's email is in the admin whitelist
  is_admin_email := (NEW.email IN (
    'muslim.ummahlink@gmail.com',
    'admin@ummahlink.app',
    'admin@alhebi.com',
    'info.kabejjasystems@gmail.com',
    'papa@alheib.teacher',
    'admin@alheib.com',
    'alhebiadmin@gmail.com'
  ));

  IF is_admin_email THEN
    -- Assign 'admin' role to whitelisted accounts
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Ensure they also have a global profile
    INSERT INTO public.profiles (id, email, full_name, scope)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'global')
    ON CONFLICT (id) DO UPDATE SET scope = 'global';
  ELSE
    -- Default new users to 'parent' role 
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix existing administrators who might have been assigned 'parent' role
DO $$
DECLARE
  admin_rec RECORD;
BEGIN
  FOR admin_rec IN 
    SELECT id, email FROM auth.users 
    WHERE email IN (
      'muslim.ummahlink@gmail.com',
      'admin@ummahlink.app',
      'admin@alhebi.com',
      'info.kabejjasystems@gmail.com',
      'papa@alheib.teacher',
      'admin@alheib.com',
      'alhebiadmin@gmail.com'
    )
  LOOP
    -- Upgrade to admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_rec.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Update profile scope
    UPDATE public.profiles 
    SET scope = 'global' 
    WHERE id = admin_rec.id;

    -- Remove any redundant parent role
    DELETE FROM public.user_roles 
    WHERE user_id = admin_rec.id AND role = 'parent';
  END LOOP;
END $$;
