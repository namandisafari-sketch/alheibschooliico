-- Compliance Portals, Notices, Standards & Contacts
-- Makes Ministry.tsx fully dynamic with downloadable files

-- 1. External Portals
CREATE TABLE IF NOT EXISTS public.compliance_portals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon_name TEXT DEFAULT 'Link',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Compliance Notices
CREATE TABLE IF NOT EXISTS public.compliance_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_label TEXT,
    action_link TEXT,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    is_active BOOLEAN DEFAULT true,
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. National Standards (NCS)
CREATE TABLE IF NOT EXISTS public.national_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    requirement TEXT NOT NULL,
    current_value TEXT,
    status TEXT DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'pending'
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Compliance Contacts
CREATE TABLE IF NOT EXISTS public.compliance_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    region TEXT,
    phone TEXT,
    email TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.compliance_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_contacts ENABLE ROW LEVEL SECURITY;

-- Everyone can view
CREATE POLICY "Public select compliance_portals" ON public.compliance_portals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select compliance_notices" ON public.compliance_notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select national_standards" ON public.national_standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public select compliance_contacts" ON public.compliance_contacts FOR SELECT TO authenticated USING (true);

-- Director can manage all
CREATE POLICY "Director manage compliance_portals" ON public.compliance_portals FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
CREATE POLICY "Director manage compliance_notices" ON public.compliance_notices FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
CREATE POLICY "Director manage national_standards" ON public.national_standards FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
CREATE POLICY "Director manage compliance_contacts" ON public.compliance_contacts FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');

-- Seed Data
INSERT INTO public.compliance_portals (name, url, icon_name, sort_order) VALUES
('Curriculum Center', 'https://www.curriculum.ac.ug', 'BookOpen', 1),
('UNEB Portal', 'https://www.uneb.ac.ug', 'FileText', 2),
('Inspection Log', 'https://www.education.go.ug/inspection', 'ShieldCheck', 3);

INSERT INTO public.compliance_notices (title, message, action_label, action_link, severity) VALUES
('EMIS Return Due',
 'The EMIS return for Term II is due in 14 days. Failure to upload learner data may affect the school''s capitation grant eligibility.',
 'Review EMIS Data',
 '/settings?tab=emis',
 'warning');

INSERT INTO public.national_standards (name, requirement, current_value, status, notes, sort_order) VALUES
('Teacher Ratio', '1:25', '1:22', 'compliant', 'Current ratio is within acceptable range', 1),
('Acreage Ratio', '5.2 Ac.', '5.2 Ac.', 'compliant', 'Meets minimum acreage requirements', 2),
('Library Facilities', 'Mandatory', 'Available', 'compliant', 'School library operational', 3),
('Laboratory Access', 'Mandatory', 'Available', 'compliant', 'Science lab equipped and functional', 4);

INSERT INTO public.compliance_contacts (name, title, region, phone, email, sort_order) VALUES
('DES Central Region', 'Regional Inspector of Schools', 'Central Region', '+256-414-000000', 'des.central@education.go.ug', 1),
('MoES Compliance Desk', 'Senior Compliance Officer', 'Headquarters', '+256-414-000001', 'compliance@education.go.ug', 2);

-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-documents', 'compliance-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for compliance documents
CREATE POLICY "Public read compliance-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'compliance-documents');

-- Director/Admin upload
CREATE POLICY "Director upload compliance-documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'compliance-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Director update compliance-documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'compliance-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Director delete compliance-documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'compliance-documents' AND has_role(auth.uid(), 'admin'));
