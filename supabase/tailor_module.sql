-- ===================================================================
-- TAILOR MODULE: role, tables, RLS, and report functions
-- ===================================================================

-- 1. Add tailor to app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tailor';
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Create tailor_tasks table
CREATE TABLE IF NOT EXISTS public.tailor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('new_uniform','repair','alteration','other_clothing')),
  description TEXT,
  measurements JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','delivered')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tailor_tasks_learner ON public.tailor_tasks(learner_id);
CREATE INDEX IF NOT EXISTS idx_tailor_tasks_status ON public.tailor_tasks(status);

ALTER TABLE public.tailor_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tailor_select" ON public.tailor_tasks;
CREATE POLICY "tailor_select" ON public.tailor_tasks FOR SELECT USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tailor') OR public.has_role(auth.uid(),'center_director')
);

DROP POLICY IF EXISTS "tailor_insert" ON public.tailor_tasks;
CREATE POLICY "tailor_insert" ON public.tailor_tasks FOR INSERT WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tailor')
);

DROP POLICY IF EXISTS "tailor_update" ON public.tailor_tasks;
CREATE POLICY "tailor_update" ON public.tailor_tasks FOR UPDATE USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tailor')
);

-- 3. Report function: tailor stats
CREATE OR REPLACE FUNCTION public.get_tailor_stats()
RETURNS TABLE (
  total_tasks BIGINT, pending_tasks BIGINT, in_progress_tasks BIGINT,
  completed_tasks BIGINT, delivered_tasks BIGINT,
  total_estimated_cost DECIMAL(12,2), total_actual_cost DECIMAL(12,2)
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status='pending')::BIGINT,
    COUNT(*) FILTER (WHERE status='in_progress')::BIGINT,
    COUNT(*) FILTER (WHERE status='completed')::BIGINT,
    COUNT(*) FILTER (WHERE status='delivered')::BIGINT,
    COALESCE(SUM(estimated_cost),0)::DECIMAL(12,2),
    COALESCE(SUM(actual_cost),0)::DECIMAL(12,2)
  FROM public.tailor_tasks;
$$;
