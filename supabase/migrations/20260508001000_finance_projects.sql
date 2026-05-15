
-- Project Management for Financial Tracking
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial projects
INSERT INTO public.projects (name, description) VALUES
('School Expansion 2026', 'Construction of new classroom block'),
('Orphanage Support', 'Direct support for resident orphans'),
('Staff Welfare', 'Staff events and emergency funds'),
('Community Outreach', 'Local community engagement programs')
ON CONFLICT (name) DO NOTHING;

-- Link petty cash runs to projects
ALTER TABLE public.petty_cash_runs 
DROP CONSTRAINT IF EXISTS fk_petty_cash_project,
ADD CONSTRAINT fk_petty_cash_project FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow auth view projects" ON public.projects FOR SELECT TO authenticated USING (true);
GRANT ALL ON public.projects TO authenticated;