
-- Create Governance and Ministry Compliance tables
-- Also create Academic Warning table for DOS tracking

-- Governance Members (Board of Directors/Governors)
CREATE TABLE IF NOT EXISTS public.governance_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, -- e.g. 'Chairman', 'Secretary', 'Member'
    status TEXT DEFAULT 'active', -- 'active', 'retired'
    image_url TEXT,
    bio TEXT
);

-- Governance Meetings (Board Meetings)
CREATE TABLE IF NOT EXISTS public.governance_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    venue TEXT DEFAULT 'Boardroom',
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    agenda TEXT,
    minutes_url TEXT
);

-- School Policies
CREATE TABLE IF NOT EXISTS public.governance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. 'Financial', 'Academic', 'Human Resource'
    status TEXT DEFAULT 'active', -- 'active', 'under_review', 'archived'
    version TEXT DEFAULT '1.0',
    last_updated DATE DEFAULT current_date,
    document_url TEXT
);

-- Ministry Guidelines (MoES)
CREATE TABLE IF NOT EXISTS public.ministry_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Circular', 'Directive', 'Regulation', 'Technical'
    issue_date DATE NOT NULL,
    file_size TEXT, -- e.g. '2.4MB'
    file_url TEXT
);

-- Academic Warnings (Learners at Risk)
-- Used by DOS to track students failing consistently
CREATE TABLE IF NOT EXISTS public.academic_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id), -- Reporting teacher
    subject_id UUID REFERENCES public.subjects(id),
    category TEXT NOT NULL, -- 'Unsatisfactory Progress', 'Persistent failure', 'High absenteeism'
    details TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'resolved'
    resolution_details TEXT
);

-- RLS
ALTER TABLE public.governance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_warnings ENABLE ROW LEVEL SECURITY;

-- Permissions: Everyone can view governance/ministry info, but only Admins/Director can manage
DROP POLICY IF EXISTS "Public select governance_members" ON public.governance_members;
CREATE POLICY "Public select governance_members" ON public.governance_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public select governance_meetings" ON public.governance_meetings;
CREATE POLICY "Public select governance_meetings" ON public.governance_meetings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public select governance_policies" ON public.governance_policies;
CREATE POLICY "Public select governance_policies" ON public.governance_policies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public select ministry_guidelines" ON public.ministry_guidelines;
CREATE POLICY "Public select ministry_guidelines" ON public.ministry_guidelines FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public select academic_warnings" ON public.academic_warnings;
CREATE POLICY "Public select academic_warnings" ON public.academic_warnings FOR SELECT TO authenticated USING (true);

-- Director can manage all
DROP POLICY IF EXISTS "Director manage governance_members" ON public.governance_members;
CREATE POLICY "Director manage governance_members" ON public.governance_members FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
DROP POLICY IF EXISTS "Director manage governance_meetings" ON public.governance_meetings;
CREATE POLICY "Director manage governance_meetings" ON public.governance_meetings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
DROP POLICY IF EXISTS "Director manage governance_policies" ON public.governance_policies;
CREATE POLICY "Director manage governance_policies" ON public.governance_policies FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
DROP POLICY IF EXISTS "Director manage ministry_guidelines" ON public.ministry_guidelines;
CREATE POLICY "Director manage ministry_guidelines" ON public.ministry_guidelines FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
DROP POLICY IF EXISTS "Director manage academic_warnings" ON public.academic_warnings;
CREATE POLICY "Director manage academic_warnings" ON public.academic_warnings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');

-- Initial Data
INSERT INTO public.governance_members (full_name, role, status) VALUES
('Sheikh Ahmad Khalid', 'Chairman', 'active'),
('Haji Ibrahim Isma', 'Director / Secretary', 'active'),
('Dr. Aisha Mariam', 'Board Member', 'active');

INSERT INTO public.ministry_guidelines (title, type, issue_date, file_size) VALUES
('Standard Operating Procedures (SOPs) 2025', 'Circular', '2026-01-12', '2.4MB'),
('Academic Calendar Directives Term II 2026', 'Directive', '2026-04-05', '1.1MB'),
('Safety & Security Standards for Boarding', 'Regulation', '2026-02-20', '3.8MB'),
('EMIS Compliance Reporting Framework v4.2', 'Technical', '2026-03-15', '5.2MB');

-- EXTEND APP_ROLE ENUM
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
    month TEXT NOT NULL,
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

-- ENABLE RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_medical ENABLE ROW LEVEL SECURITY;

-- RPCs & VIEWS
CREATE OR REPLACE FUNCTION public.decrement_pharmacy_stock(item_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.pharmacy_items
    SET quantity = quantity - amount,
        updated_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
DROP POLICY IF EXISTS "Users can view own attendance" ON public.staff_attendance;
CREATE POLICY "Users can view own attendance" ON public.staff_attendance
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins/Managers view all attendance" ON public.staff_attendance;
CREATE POLICY "Admins/Managers view all attendance" ON public.staff_attendance
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'head_teacher', 'office_manager'))
    );

-- Salaries Policies
DROP POLICY IF EXISTS "Users can view own salaries" ON public.salaries;
CREATE POLICY "Users can view own salaries" ON public.salaries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins/Accountants view all salaries" ON public.salaries;
CREATE POLICY "Admins/Accountants view all salaries" ON public.salaries
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

-- Medical Incidents Policies
DROP POLICY IF EXISTS "Health staff manage incidents" ON public.medical_incidents;
CREATE POLICY "Health staff manage incidents" ON public.medical_incidents
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    );
DROP POLICY IF EXISTS "Anyone authenticated can view incidents" ON public.medical_incidents;
CREATE POLICY "Anyone authenticated can view incidents" ON public.medical_incidents
    FOR SELECT TO authenticated USING (true);

-- Learner Medical Policies
DROP POLICY IF EXISTS "Health staff manage medical info" ON public.learner_medical;
CREATE POLICY "Health staff manage medical info" ON public.learner_medical
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    );
DROP POLICY IF EXISTS "Teachers can view student medical info" ON public.learner_medical;
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
