
-- Discipline Module Enhancements: Director Feedback, Confidential Cases, File Uploads

-- 1. Add new columns to discipline_cases
ALTER TABLE public.discipline_cases
  ADD COLUMN IF NOT EXISTS director_feedback TEXT,
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confidential_type TEXT CHECK (confidential_type IN ('sexual_harassment', 'abuse', 'other_confidential')) ,
  ADD COLUMN IF NOT EXISTS evidence_files TEXT[];

-- 2. Create incident_logs table for file attachments and status tracking
CREATE TABLE IF NOT EXISTS public.incident_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_case_id UUID REFERENCES public.discipline_cases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  note TEXT,
  file_url TEXT,
  file_name TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS for incident_logs
CREATE POLICY "incident_logs read" ON public.incident_logs
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos')
  );

CREATE POLICY "incident_logs write" ON public.incident_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

-- 4. Create welfare_reports table for welfare management
CREATE TABLE IF NOT EXISTS public.welfare_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('wellness_check', 'counseling', 'home_visit', 'follow_up', 'general')),
  description TEXT,
  action_taken TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'referred')),
  reported_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.welfare_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "welfare_reports read" ON public.welfare_reports
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'orphan_supervisor')
  );

CREATE POLICY "welfare_reports write" ON public.welfare_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'orphan_supervisor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'orphan_supervisor'));

-- 5. Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.incident_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.welfare_reports;

-- 6. Audit triggers
CREATE OR REPLACE FUNCTION public.proc_discipline_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.incident_logs (discipline_case_id, action, note, performed_by)
  VALUES (
    NEW.id,
    TG_OP,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Case created: ' || NEW.incident_type
      WHEN TG_OP = 'UPDATE' THEN 'Case updated: ' || COALESCE(NEW.status, 'status changed')
      ELSE 'Case deleted'
    END,
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_discipline_audit ON public.discipline_cases;
CREATE TRIGGER trg_discipline_audit
  AFTER INSERT OR UPDATE ON public.discipline_cases
  FOR EACH ROW EXECUTE FUNCTION public.proc_discipline_audit();

-- 7. Update RLS for confidential discipline cases (restrict to director/admin only)
DROP POLICY IF EXISTS "discipline staff read" ON public.discipline_cases;
CREATE POLICY "discipline staff read" ON public.discipline_cases
  FOR SELECT TO authenticated USING (
    (is_confidential = true AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')))
    OR
    (is_confidential = false AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
      OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
      OR has_role(auth.uid(),'dos')
    ))
  );

-- 8. Search_path fixes
ALTER FUNCTION public.proc_discipline_audit() SET search_path = public;
