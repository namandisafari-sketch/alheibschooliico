-- Add theology_teacher role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'theology_teacher';

-- Add iple_core column to subjects for IPLE core subject identification
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS iple_core boolean DEFAULT false;

-- Mark the 4 IPLE core subjects
UPDATE public.subjects SET iple_core = true, category = 'islamic' WHERE code IN ('QURAN', 'FIQH', 'ARAB', 'SEER');

-- Insert IPLE-specific core subjects if they don't exist (Tarbia may not have an exact match)
INSERT INTO public.subjects (name, code, is_core, category, grading_type, min_class_level, max_class_level, display_order, iple_core)
VALUES
  ('Holy Quran', 'IPLE-QRN', true, 'islamic', 'letter', 6, 7, 100, true),
  ('Al Fiqh', 'IPLE-FQH', true, 'islamic', 'letter', 6, 7, 101, true),
  ('Lughatul Arabiyyah', 'IPLE-ARB', true, 'islamic', 'numeric', 6, 7, 102, true),
  ('Attarbiyyat Islamiyat', 'IPLE-TRB', true, 'islamic', 'letter', 6, 7, 103, true)
ON CONFLICT (code) DO NOTHING;

-- Add theology_teacher to profiles_role_check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY[
  'admin'::text, 'teacher'::text, 'parent'::text, 'staff'::text,
  'security'::text, 'accountant'::text, 'head_teacher'::text,
  'gateman'::text, 'nurse'::text, 'matron'::text, 'cook'::text,
  'dos'::text, 'director'::text, 'manager'::text, 'secretary'::text,
  'office_manager'::text, 'orphan_supervisor'::text, 'center_director'::text,
  'direct_manager'::text, 'storekeeper'::text, 'deputy_head_teacher'::text,
  'store_manager'::text, 'head_of_internal'::text, 'dos_theology'::text,
  'theology_teacher'::text
]));
