
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
CREATE POLICY "Public select governance_members" ON public.governance_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select governance_meetings" ON public.governance_meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select governance_policies" ON public.governance_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select ministry_guidelines" ON public.ministry_guidelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select academic_warnings" ON public.academic_warnings FOR SELECT TO authenticated USING (true);

-- Director can manage all
CREATE POLICY "Director manage governance_members" ON public.governance_members FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
CREATE POLICY "Director manage governance_meetings" ON public.governance_meetings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
CREATE POLICY "Director manage governance_policies" ON public.governance_policies FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
CREATE POLICY "Director manage ministry_guidelines" ON public.ministry_guidelines FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
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
