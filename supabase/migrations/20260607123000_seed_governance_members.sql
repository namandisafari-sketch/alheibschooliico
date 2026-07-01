-- Seed SMB (School Management Board) governance_members entries
-- Remove any existing entries with these full names to keep the seed idempotent
DELETE FROM public.governance_members WHERE full_name IN (
  'Sheikh Ahmad Khalid',
  'Haji Ibrahim Isma',
  'Dr. Aisha Mariam'
);

INSERT INTO public.governance_members (id, full_name, role, status, bio, created_at)
VALUES
  (gen_random_uuid(), 'Sheikh Ahmad Khalid', 'Chairman', 'active', 'Constitution - SAK', now()),
  (gen_random_uuid(), 'Haji Ibrahim Isma', 'Director / Secretary', 'active', 'HII', now()),
  (gen_random_uuid(), 'Dr. Aisha Mariam', 'Board Member', 'active', 'DAM', now());
