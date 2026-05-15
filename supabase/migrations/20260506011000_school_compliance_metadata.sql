
-- School Compliance Metadata & Infrastructure Tracking

-- 1. Enhance Schools Table with Compliance Fields
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS center_number TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS registration_status TEXT CHECK (registration_status IN ('registered', 'license valid', 'license expired', 'not registered')),
ADD COLUMN IF NOT EXISTS ownership_type TEXT CHECK (ownership_type IN ('government', 'private', 'ngo', 'religious', 'community')),
ADD COLUMN IF NOT EXISTS academic_level TEXT CHECK (academic_level IN ('pre-primary', 'primary', 'secondary', 'post-primary', 'vocational')),
ADD COLUMN IF NOT EXISTS boarding_status TEXT CHECK (boarding_status IN ('day', 'boarding', 'mixed')),
ADD COLUMN IF NOT EXISTS gender_status TEXT CHECK (gender_status IN ('single_boys', 'single_girls', 'mixed')),
ADD COLUMN IF NOT EXISTS year_founded INTEGER,
ADD COLUMN IF NOT EXISTS urban_rural TEXT CHECK (urban_rural IN ('urban', 'rural')),
ADD COLUMN IF NOT EXISTS distance_to_district_hq NUMERIC,
ADD COLUMN IF NOT EXISTS distance_to_health_facility NUMERIC,
ADD COLUMN IF NOT EXISTS distance_to_bank NUMERIC;

-- 2. Infrastructure Table
CREATE TABLE IF NOT EXISTS public.school_infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- classroom, lab, library, office, staff_house
  name TEXT,
  sitting_capacity INTEGER DEFAULT 0,
  construction_year INTEGER,
  status TEXT DEFAULT 'usable' CHECK (status IN ('usable', 'under_construction', 'needs_repair', 'unusable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sanitation & WASH Table
CREATE TABLE IF NOT EXISTS public.school_sanitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  facility_type TEXT NOT NULL, -- latrine, flush_toilet, urinal, handwashing_station
  target_user TEXT NOT NULL, -- boys, girls, teachers, staff, mixed
  units_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'usable' CHECK (status IN ('usable', 'unusable')),
  is_accessible_to_pwd BOOLEAN DEFAULT false,
  
  -- WASH Specifics
  primary_water_source TEXT, -- Borehole, Piped, Rainwater
  has_handwashing_with_soap BOOLEAN DEFAULT false,
  has_mhm_changing_room BOOLEAN DEFAULT false,
  garbage_disposal_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.school_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_sanitation ENABLE ROW LEVEL SECURITY;

-- Policies (Allow authenticated users to view, admins to manage)
CREATE POLICY "Anyone can view infrastructure" ON public.school_infrastructure FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view sanitation" ON public.school_sanitation FOR SELECT TO authenticated USING (true);

-- Admin management policies (assuming 'admin' role exists)
CREATE POLICY "Admins can manage infrastructure" ON public.school_infrastructure FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage sanitation" ON public.school_sanitation FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
