
-- Extended Geographical Hierarchy for Uganda EMIS Compliance
-- Adds Region, County, Sub-County, Parish, and Village levels

-- Update Schools Table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS sub_county TEXT,
ADD COLUMN IF NOT EXISTS parish TEXT,
ADD COLUMN IF NOT EXISTS village TEXT;

-- Update Profiles Table (for staff and users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS sub_county TEXT,
ADD COLUMN IF NOT EXISTS parish TEXT,
ADD COLUMN IF NOT EXISTS village TEXT;

-- Update Learners Table (for home address)
ALTER TABLE public.learners
ADD COLUMN IF NOT EXISTS home_region TEXT,
ADD COLUMN IF NOT EXISTS home_district TEXT,
ADD COLUMN IF NOT EXISTS home_county TEXT,
ADD COLUMN IF NOT EXISTS home_sub_county TEXT,
ADD COLUMN IF NOT EXISTS home_parish TEXT,
ADD COLUMN IF NOT EXISTS home_village TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.schools.sub_county IS 'Administrative Sub-county for EMIS reporting';
COMMENT ON COLUMN public.schools.parish IS 'Administrative Parish for EMIS reporting';
