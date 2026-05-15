
-- Refine Learner Schema for official Alheib Admission Form
-- Adding more specific medical and personal fields

ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS age_years INTEGER,
ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS application_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS has_sickle_cell BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_heart_problems BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_eye_defects BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_hearing_impairment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_diabetes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_asthma BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_epilepsy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS immunization_complete BOOLEAN DEFAULT false;

-- Update the full_name to be a generated column or just keep it for backward compatibility
-- But for now, we'll just use the new columns.

-- Update EMIS View
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.first_name,
  l.last_name,
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
  l.house,
  l.blood_group,
  l.immunization_complete as immunized
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id;
