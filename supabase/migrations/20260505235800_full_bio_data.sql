
-- Comprehensive Bio-Data for Alheib Primary School
-- Based on the official admission form docx

-- Add missing fields to learners
ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS current_residence_town TEXT,
ADD COLUMN IF NOT EXISTS current_residence_street TEXT,
ADD COLUMN IF NOT EXISTS residence_phone TEXT,
ADD COLUMN IF NOT EXISTS residence_email TEXT,
ADD COLUMN IF NOT EXISTS former_school_name TEXT,
ADD COLUMN IF NOT EXISTS former_school_class TEXT,
ADD COLUMN IF NOT EXISTS former_school_year TEXT,
ADD COLUMN IF NOT EXISTS pupil_status TEXT, -- bait zakat, IICO, Paying, Community
ADD COLUMN IF NOT EXISTS house TEXT, -- Lion, Tiger, Elephant, Cheetah
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions JSONB DEFAULT '[]', -- Asthma, Hearing, etc.
ADD COLUMN IF NOT EXISTS medication_details TEXT,
ADD COLUMN IF NOT EXISTS authorized_pick_up JSONB DEFAULT '{}', -- name, contact
ADD COLUMN IF NOT EXISTS next_of_kin JSONB DEFAULT '{}', -- name, tel, address, work_place
ADD COLUMN IF NOT EXISTS siblings_in_school JSONB DEFAULT '[]', -- array of {name, class}
ADD COLUMN IF NOT EXISTS date_of_application DATE DEFAULT CURRENT_DATE;

-- Add parent-specific details to guardians or learners
-- For simplicity and better data integrity per learner, adding to learners
ALTER TABLE public.learners
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS father_phone TEXT,
ADD COLUMN IF NOT EXISTS father_email TEXT,
ADD COLUMN IF NOT EXISTS father_occupation TEXT,
ADD COLUMN IF NOT EXISTS father_nin TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS mother_phone TEXT,
ADD COLUMN IF NOT EXISTS mother_email TEXT,
ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
ADD COLUMN IF NOT EXISTS mother_nin TEXT;

-- Refresh EMIS Export view to include new fields if needed
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.full_name,
  l.gender,
  l.date_of_birth,
  l.nin,
  l.lin,
  l.nationality,
  l.current_residence_town,
  c.name as current_class,
  l.parent_nin,
  l.father_name,
  l.mother_name,
  l.religion,
  l.pupil_status,
  l.special_needs_category
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id;
