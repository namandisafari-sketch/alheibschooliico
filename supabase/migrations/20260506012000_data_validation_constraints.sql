
-- EMIS Data Validation Constraints

-- 1. National Identification Number (NIN) Validation
-- Uganda NIN is exactly 14 characters, alphanumeric (typically CM... or CF...)
ALTER TABLE public.learners 
ADD CONSTRAINT check_nin_format 
CHECK (nin IS NULL OR nin ~* '^[A-Z0-9]{14}$');

ALTER TABLE public.profiles 
ADD CONSTRAINT check_staff_nin_format 
CHECK (nin IS NULL OR nin ~* '^[A-Z0-9]{14}$');

-- 2. Learner Identification Number (LIN) Validation
-- Usually starts with a year or specific sequence, roughly 10-15 chars
ALTER TABLE public.learners 
ADD CONSTRAINT check_lin_format 
CHECK (lin IS NULL OR LENGTH(lin) BETWEEN 5 AND 20);

-- 3. Teacher Registration Number (TRN) Validation
ALTER TABLE public.profiles 
ADD CONSTRAINT check_trn_format 
CHECK (registration_number IS NULL OR LENGTH(registration_number) >= 5);

-- 4. Update EMIS Export View to include new fields
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
  c.name as current_class,
  l.parent_nin,
  l.father_name,
  l.mother_name,
  l.religion,
  l.home_region,
  l.home_district,
  l.home_sub_county,
  l.home_parish,
  s.name as school_name,
  s.center_number,
  s.district_id as school_district
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id
LEFT JOIN public.schools s ON l.school_id = s.id;
