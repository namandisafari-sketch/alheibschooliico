
-- 1. EXTEND APP_ROLE ENUM
DO $$ 
BEGIN 
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dos';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'storekeeper';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gateman';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direct_manager';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center_director';
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- 2. CREATE MISSING TABLES

-- Update classes to have a teacher_id for simple assignment
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id);

-- Staff Attendance
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('present', 'late', 'absent', 'on_leave')) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salaries (for Teacher Finance page)
CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- e.g. "January 2024"
    base_salary DECIMAL(12,2),
    net_pay DECIMAL(12,2),
    deductions DECIMAL(12,2) DEFAULT 0,
    bonuses DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical Incidents (Nurse module)
CREATE TABLE IF NOT EXISTS public.medical_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    description TEXT,
    action_taken TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'referred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learner Medical Bio/Info
CREATE TABLE IF NOT EXISTS public.learner_medical (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE UNIQUE,
    blood_group TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    immunization_status TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    special_needs TEXT,
    medical_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_medical ENABLE ROW LEVEL SECURITY;

-- 5. RPCs & VIEWS

-- Decrement pharmacy stock helper
CREATE OR REPLACE FUNCTION public.decrement_pharmacy_stock(item_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.pharmacy_items
    SET quantity = quantity - amount,
        updated_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for Parent Chat compatibility
CREATE OR REPLACE VIEW public.learner_parents AS
SELECT 
    l.id as learner_id,
    g.full_name,
    g.phone,
    pll.relationship,
    pll.is_primary_contact
FROM public.learners l
JOIN public.parent_learner_links pll ON l.id = pll.learner_id
JOIN public.guardians g ON pll.parent_id = g.id;

GRANT SELECT ON public.learner_parents TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_pharmacy_stock(UUID, INTEGER) TO authenticated;

-- Staff Attendance Policies
CREATE POLICY "Users can view own attendance" ON public.staff_attendance
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins/Managers view all attendance" ON public.staff_attendance
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'head_teacher', 'office_manager'))
    );

-- Salaries Policies
CREATE POLICY "Users can view own salaries" ON public.salaries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins/Accountants view all salaries" ON public.salaries
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

-- Medical Incidents Policies
CREATE POLICY "Health staff manage incidents" ON public.medical_incidents
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    );
CREATE POLICY "Anyone authenticated can view incidents" ON public.medical_incidents
    FOR SELECT TO authenticated USING (true);

-- Learner Medical Policies
CREATE POLICY "Health staff manage medical info" ON public.learner_medical
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    );
CREATE POLICY "Teachers can view student medical info" ON public.learner_medical
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'dos'))
    );

-- Update existing health_visits to include nurse
DROP POLICY IF EXISTS "Anyone can view health records" ON public.health_visits;
CREATE POLICY "Anyone can view health records" ON public.health_visits
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher', 'teacher', 'staff', 'nurse', 'dos')));

-- Update pharmacy_items to include nurse
DROP POLICY IF EXISTS "Admins and nurses can manage pharmacy" ON public.pharmacy_items;
CREATE POLICY "Admins and nurses can manage pharmacy" ON public.pharmacy_items
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher', 'staff', 'nurse')));
