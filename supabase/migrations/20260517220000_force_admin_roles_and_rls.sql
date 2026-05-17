
-- Ensure all administrative emails have the admin role in the database
DO $$
DECLARE
  v_admin_emails TEXT[] := ARRAY[
    'muslim.ummahlink@gmail.com',
    'admin@ummahlink.app',
    'admin@alhebi.com',
    'info.kabejjasystems@gmail.com',
    'papa@alheib.teacher',
    'admin@alheib.com',
    'alhebiadmin@gmail.com'
  ];
  v_email TEXT;
  v_user_id UUID;
BEGIN
  FOREACH v_email IN ARRAY v_admin_emails
  LOOP
    -- Get user ID if it exists in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NOT NULL THEN
      -- Insert into user_roles
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Ensure profile exists and has global scope
      INSERT INTO public.profiles (id, email, full_name, scope)
      VALUES (v_user_id, v_email, COALESCE(v_email, 'Administrator'), 'global')
      ON CONFLICT (id) DO UPDATE SET scope = 'global';
      
      -- Remove any lower privilege roles
      DELETE FROM public.user_roles 
      WHERE user_id = v_user_id AND role != 'admin';
    END IF;
  END LOOP;
END $$;

-- Check if learners table is empty and if so, log it (we can't log but we can ensure data exists for testing)
-- If the user says they have data, we won't overwrite it.

-- Ensure RLS allows admins to see everything
-- Some tables might be missing the "Admins can view everything" policy
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  LOOP
    -- Check if policy exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Admins have full access'
    ) THEN
      EXECUTE format('CREATE POLICY "Admins have full access" ON public.%I FOR ALL USING (public.has_role(auth.uid(), ''admin''))', t);
    END IF;
  END LOOP;
END $$;
