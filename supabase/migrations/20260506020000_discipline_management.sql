
-- Discipline and Conduct Management System

-- 1. Create Severity Enum
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discipline_severity') THEN
        CREATE TYPE discipline_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
    END IF;
END $$;

-- 2. Create Discipline Cases Table
CREATE TABLE IF NOT EXISTS public.discipline_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  incident_date DATE DEFAULT CURRENT_DATE,
  incident_type TEXT NOT NULL, -- e.g., 'Bullying', 'Late coming', 'Uniform violation'
  description TEXT,
  severity discipline_severity DEFAULT 'minor',
  action_taken TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'appealed', 'dismissed')),
  reported_by UUID REFERENCES public.profiles(id),
  witnesses TEXT,
  parent_notified BOOLEAN DEFAULT false,
  parent_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.discipline_cases ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Allow auth view discipline_cases" ON public.discipline_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage discipline_cases" ON public.discipline_cases FOR ALL TO authenticated USING (true);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.discipline_cases;

-- 6. Seed some common incident types (optional but good for UI suggestions)
-- These can be handled in the frontend as a predefined list
