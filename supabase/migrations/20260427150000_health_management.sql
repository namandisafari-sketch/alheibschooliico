
-- Pharmacy & Sick Bay Management
CREATE TYPE health_visit_type AS ENUM ('illness', 'injury', 'routine_checkup', 'emergency');
CREATE TYPE health_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Medical Inventory (Pharmacy)
CREATE TABLE IF NOT EXISTS public.pharmacy_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT, -- e.g. Painkiller, Antibiotic, First Aid
  unit TEXT NOT NULL, -- e.g. Tablets, Bottle, Pack
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
  temperature DECIMAL(4,2), -- e.g. 37.5
  diagnosis TEXT,
  treatment_plan TEXT,
  action_taken TEXT, -- e.g. Sent home, Referred to hospital, Rest in sick bay
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
