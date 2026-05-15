INSERT INTO public.user_roles (user_id, role)
VALUES ('d4aeeb9e-e2c9-42a0-8650-cb38f136b18f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove any default 'parent' role for the admin so they only have 'admin'
DELETE FROM public.user_roles
WHERE user_id = 'd4aeeb9e-e2c9-42a0-8650-cb38f136b18f' AND role = 'parent';