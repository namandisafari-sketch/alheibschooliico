
-- Add EMIS compliant fields to learners
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS nin TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS lin TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS immunization_status JSONB DEFAULT '[]';
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS special_needs_category TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS special_needs_description TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS parent_nin TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS religion TEXT DEFAULT 'Islam';

-- Add EMIS compliant fields to staff profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nssf_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number TEXT; -- For teachers (TRN)

-- Create a view for EMIS Export
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.full_name,
  l.gender,
  l.date_of_birth,
  l.nin,
  l.lin,
  c.name as current_class,
  l.parent_name,
  l.parent_phone,
  l.parent_nin,
  l.religion,
  l.special_needs_category
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id;
