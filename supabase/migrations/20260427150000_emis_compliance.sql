
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
DROP VIEW IF EXISTS public.emis_learner_export CASCADE;
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

-- Pharmacy & Sick Bay Management
DO $$ BEGIN
  CREATE TYPE health_visit_type AS ENUM ('illness', 'injury', 'routine_checkup', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE health_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Medical Inventory (Pharmacy)
CREATE TABLE IF NOT EXISTS public.pharmacy_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  expiry_date DATE,
  batch_number TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sick Bay Visits
CREATE TABLE IF NOT EXISTS public.health_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID REFERENCES public.learners(id),
  staff_id UUID REFERENCES public.profiles(id),
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_type health_visit_type DEFAULT 'illness',
  priority health_priority DEFAULT 'low',
  symptoms TEXT,
  temperature DECIMAL(4,2),
  diagnosis TEXT,
  treatment_plan TEXT,
  action_taken TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'referred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication Dispensing Logs
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES public.health_visits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.pharmacy_items(id),
  quantity INTEGER NOT NULL,
  dosage_instructions TEXT,
  dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dispensed_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view health records') THEN
        CREATE POLICY "Anyone can view health records" ON public.health_visits
          FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher', 'teacher', 'staff')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins and nurses can manage pharmacy') THEN
        CREATE POLICY "Admins and nurses can manage pharmacy" ON public.pharmacy_items
          FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher', 'staff')));
    END IF;
END $$;
