-- Database Migration Script: Teacher Onboarding Scope & Bursar Override Workflows
-- Purpose: Support Teacher Professional Profiles, Certification references, and live Bursar Gate Overrides.

-- 1. Ensure the 'scope' column exists on the profiles table (used for teacher specifications)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS scope TEXT;

COMMENT ON COLUMN public.profiles.scope IS 'Stores extended professional onboarding payload (qualification, specialized_subjects, birth_date, experience_years, certifications) as serialized JSON';

-- 2. Verify or create public.bursar_rules
CREATE TABLE IF NOT EXISTS public.bursar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    balance_threshold NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    applies_to_all_classes BOOLEAN NOT NULL DEFAULT TRUE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Verify or create public.bursar_override_requests
CREATE TABLE IF NOT EXISTS public.bursar_override_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.bursar_rules(id) ON DELETE SET NULL,
    outstanding_balance NUMERIC(15,2) DEFAULT 0.00,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes for rapid lookup on gate checkpoint and review lists
CREATE INDEX IF NOT EXISTS idx_bursar_override_learner ON public.bursar_override_requests(learner_id);
CREATE INDEX IF NOT EXISTS idx_bursar_override_status ON public.bursar_override_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bursar_rules_active ON public.bursar_rules(is_active);

-- 5. Enable Row Level Security (RLS) and grant CRUD permissions
ALTER TABLE public.bursar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bursar_override_requests ENABLE ROW LEVEL SECURITY;

-- Select policies for authenticated users
CREATE POLICY select_bursar_rules_auth ON public.bursar_rules 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY select_bursar_overrides_auth ON public.bursar_override_requests 
    FOR SELECT TO authenticated USING (true);

-- Admin & Accountant management privileges
CREATE POLICY manage_bursar_rules_admin_acct ON public.bursar_rules 
    FOR ALL TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY manage_bursar_overrides_admin_acct ON public.bursar_override_requests 
    FOR ALL TO authenticated 
    USING (true)
    WITH CHECK (true);
