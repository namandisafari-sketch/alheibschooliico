
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE u.email IN ('admin@ummahlink.app','admin@alhebi.com','info.kabejjasystems@gmail.com','papa@alheib.teacher')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email IN ('admin@ummahlink.app','admin@alhebi.com','info.kabejjasystems@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'teacher'::app_role
FROM auth.users u
WHERE u.email = 'papa@alheib.teacher'
ON CONFLICT (user_id, role) DO NOTHING;
