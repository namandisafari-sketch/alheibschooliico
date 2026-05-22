
-- ============================================================
-- LEARNERS
-- ============================================================
ALTER TABLE public.learners
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS lin TEXT,
  ADD COLUMN IF NOT EXISTS immunization_status JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS special_needs_category TEXT,
  ADD COLUMN IF NOT EXISTS special_needs_description TEXT,
  ADD COLUMN IF NOT EXISTS parent_nin TEXT,
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS religion TEXT DEFAULT 'Islam',
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS current_residence_town TEXT,
  ADD COLUMN IF NOT EXISTS current_residence_street TEXT,
  ADD COLUMN IF NOT EXISTS residence_phone TEXT,
  ADD COLUMN IF NOT EXISTS residence_email TEXT,
  ADD COLUMN IF NOT EXISTS former_school_name TEXT,
  ADD COLUMN IF NOT EXISTS former_school_class TEXT,
  ADD COLUMN IF NOT EXISTS former_school_year TEXT,
  ADD COLUMN IF NOT EXISTS pupil_status TEXT,
  ADD COLUMN IF NOT EXISTS house TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS chronic_diseases TEXT,
  ADD COLUMN IF NOT EXISTS medical_conditions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS medication_details TEXT,
  ADD COLUMN IF NOT EXISTS authorized_pick_up JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_of_kin JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS siblings_in_school JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS date_of_application DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS father_phone TEXT,
  ADD COLUMN IF NOT EXISTS father_email TEXT,
  ADD COLUMN IF NOT EXISTS father_occupation TEXT,
  ADD COLUMN IF NOT EXISTS father_nin TEXT,
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS mother_phone TEXT,
  ADD COLUMN IF NOT EXISTS mother_email TEXT,
  ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
  ADD COLUMN IF NOT EXISTS mother_nin TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS age_years INTEGER,
  ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS application_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS has_sickle_cell BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_heart_problems BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_eye_defects BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_hearing_impairment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_diabetes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_asthma BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_epilepsy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS immunization_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_region TEXT,
  ADD COLUMN IF NOT EXISTS home_district TEXT,
  ADD COLUMN IF NOT EXISTS home_sub_county TEXT,
  ADD COLUMN IF NOT EXISTS home_parish TEXT;

-- PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS tin TEXT,
  ADD COLUMN IF NOT EXISTS nssf_number TEXT,
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- CLASSES / ACADEMIC
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.academic_warnings ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.exam_series ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.parent_learner_links
  ADD COLUMN IF NOT EXISTS parent_id UUID,
  ADD COLUMN IF NOT EXISTS is_primary_contact BOOLEAN DEFAULT false;

-- ALIGN EXISTING TABLES
ALTER TABLE public.advance_requests
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS repayment_plan TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_note TEXT;
UPDATE public.advance_requests SET user_id = staff_id WHERE user_id IS NULL AND staff_id IS NOT NULL;

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS form_ref TEXT,
  ADD COLUMN IF NOT EXISTS leave_type_other TEXT,
  ADD COLUMN IF NOT EXISTS days_count INT,
  ADD COLUMN IF NOT EXISTS employee_full_name TEXT,
  ADD COLUMN IF NOT EXISTS employee_department TEXT,
  ADD COLUMN IF NOT EXISTS employee_position TEXT,
  ADD COLUMN IF NOT EXISTS employee_phone TEXT,
  ADD COLUMN IF NOT EXISTS employee_signature_name TEXT,
  ADD COLUMN IF NOT EXISTS employee_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS covering_staff_name TEXT,
  ADD COLUMN IF NOT EXISTS covering_staff_position TEXT,
  ADD COLUMN IF NOT EXISTS covering_staff_job_title TEXT,
  ADD COLUMN IF NOT EXISTS covering_staff_department TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities_summary TEXT,
  ADD COLUMN IF NOT EXISTS covering_staff_signature_name TEXT,
  ADD COLUMN IF NOT EXISTS covering_staff_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supervisor_user_id UUID,
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_decision TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_user_id UUID,
  ADD COLUMN IF NOT EXISTS admin_name TEXT,
  ADD COLUMN IF NOT EXISTS admin_decision TEXT,
  ADD COLUMN IF NOT EXISTS admin_comments TEXT,
  ADD COLUMN IF NOT EXISTS admin_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
UPDATE public.leave_requests SET user_id = staff_id WHERE user_id IS NULL AND staff_id IS NOT NULL;

ALTER TABLE public.staff_letters
  ADD COLUMN IF NOT EXISTS from_user UUID,
  ADD COLUMN IF NOT EXISTS to_user UUID,
  ADD COLUMN IF NOT EXISTS to_role TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
UPDATE public.staff_letters SET from_user = issued_by WHERE from_user IS NULL AND issued_by IS NOT NULL;
UPDATE public.staff_letters SET to_user = staff_id WHERE to_user IS NULL AND staff_id IS NOT NULL;
UPDATE public.staff_letters SET body = content WHERE body IS NULL AND content IS NOT NULL;

ALTER TABLE public.account_appeals
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response TEXT;
UPDATE public.account_appeals SET message = reason WHERE message IS NULL AND reason IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS public.leave_form_seq START 1;

-- FINANCE WORKFLOW
CREATE TABLE IF NOT EXISTS public.finance_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.finance_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fp view" ON public.finance_projects;
CREATE POLICY "fp view" ON public.finance_projects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "fp manage" ON public.finance_projects;
CREATE POLICY "fp manage" ON public.finance_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));

CREATE TABLE IF NOT EXISTS public.liquidity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID,
  custody_balance NUMERIC(15,2) DEFAULT 0,
  awards_balance NUMERIC(15,2) DEFAULT 0,
  other_balance NUMERIC(15,2) DEFAULT 0,
  receivables_balance NUMERIC(15,2) DEFAULT 0,
  payables_due NUMERIC(15,2) DEFAULT 0,
  bills_value NUMERIC(15,2) DEFAULT 0,
  requested_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  purpose TEXT,
  status TEXT DEFAULT 'pending',
  stage public.approval_stage DEFAULT 'submitted',
  director_approval_by UUID,
  director_approval_date TIMESTAMPTZ,
  office_approval_by UUID,
  office_approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.liquidity_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "liq view" ON public.liquidity_requests;
CREATE POLICY "liq view" ON public.liquidity_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "liq insert" ON public.liquidity_requests;
CREATE POLICY "liq insert" ON public.liquidity_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by);
DROP POLICY IF EXISTS "liq update" ON public.liquidity_requests;
CREATE POLICY "liq update" ON public.liquidity_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'director'));

-- INVENTORY WORKFLOW
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_days INTEGER,
  ADD COLUMN IF NOT EXISTS manager_approval_by UUID,
  ADD COLUMN IF NOT EXISTS accountant_approval_by UUID,
  ADD COLUMN IF NOT EXISTS director_approval_by UUID;

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_days INTEGER,
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS manager_approval_by UUID,
  ADD COLUMN IF NOT EXISTS manager_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS director_approval_by UUID,
  ADD COLUMN IF NOT EXISTS director_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accountant_approval_by UUID,
  ADD COLUMN IF NOT EXISTS accountant_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_approval_by UUID,
  ADD COLUMN IF NOT EXISTS final_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'out',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS gateman_id UUID,
  ADD COLUMN IF NOT EXISTS gate_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gate_notes TEXT,
  ADD COLUMN IF NOT EXISTS qr_verification_code TEXT DEFAULT gen_random_uuid()::text;

ALTER TABLE public.employee_advances
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.finance_projects(id),
  ADD COLUMN IF NOT EXISTS duration_text TEXT,
  ADD COLUMN IF NOT EXISTS purpose_details TEXT,
  ADD COLUMN IF NOT EXISTS compliance_checked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS budget_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS previous_advances_settled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS office_approval_by UUID,
  ADD COLUMN IF NOT EXISTS office_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS director_approval_by UUID,
  ADD COLUMN IF NOT EXISTS director_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accountant_approval_by UUID,
  ADD COLUMN IF NOT EXISTS accountant_approval_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- NEW TABLES
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_key TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, permission_key)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perms read" ON public.user_permissions;
CREATE POLICY "perms read" ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
DROP POLICY IF EXISTS "perms manage" ON public.user_permissions;
CREATE POLICY "perms manage" ON public.user_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  issued_by UUID,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warnings read" ON public.user_warnings;
CREATE POLICY "warnings read" ON public.user_warnings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
DROP POLICY IF EXISTS "warnings ack" ON public.user_warnings;
CREATE POLICY "warnings ack" ON public.user_warnings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "warnings issue" ON public.user_warnings;
CREATE POLICY "warnings issue" ON public.user_warnings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL,
  to_user UUID NOT NULL,
  body TEXT NOT NULL,
  urgent BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm read" ON public.direct_messages;
CREATE POLICY "dm read" ON public.direct_messages FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
DROP POLICY IF EXISTS "dm send" ON public.direct_messages;
CREATE POLICY "dm send" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());
DROP POLICY IF EXISTS "dm update" ON public.direct_messages;
CREATE POLICY "dm update" ON public.direct_messages FOR UPDATE TO authenticated USING (to_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ DEFAULT NOW(),
  check_out TIMESTAMPTZ,
  status TEXT CHECK (status IN ('present','late','absent','on_leave')) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "att own" ON public.staff_attendance;
CREATE POLICY "att own" ON public.staff_attendance FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'head_teacher'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'head_teacher'));

CREATE TABLE IF NOT EXISTS public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  month TEXT NOT NULL,
  base_salary NUMERIC(12,2),
  net_pay NUMERIC(12,2),
  deductions NUMERIC(12,2) DEFAULT 0,
  bonuses NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sal own" ON public.salaries;
CREATE POLICY "sal own" ON public.salaries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
DROP POLICY IF EXISTS "sal manage" ON public.salaries;
CREATE POLICY "sal manage" ON public.salaries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));

CREATE TABLE IF NOT EXISTS public.medical_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'low',
  description TEXT,
  action_taken TEXT,
  recorded_by UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.medical_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "med view" ON public.medical_incidents;
CREATE POLICY "med view" ON public.medical_incidents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "med manage" ON public.medical_incidents;
CREATE POLICY "med manage" ON public.medical_incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse') OR public.has_role(auth.uid(),'head_teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse') OR public.has_role(auth.uid(),'head_teacher'));

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.learner_medical ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lm view" ON public.learner_medical;
CREATE POLICY "lm view" ON public.learner_medical FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lm manage" ON public.learner_medical;
CREATE POLICY "lm manage" ON public.learner_medical FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse'));

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  created_by UUID,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks read" ON public.tasks;
CREATE POLICY "tasks read" ON public.tasks FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "tasks manage" ON public.tasks;
CREATE POLICY "tasks manage" ON public.tasks FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hw view" ON public.homework;
CREATE POLICY "hw view" ON public.homework FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "hw manage" ON public.homework;
CREATE POLICY "hw manage" ON public.homework FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','graded')),
  grade TEXT,
  feedback TEXT,
  file_url TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hws view" ON public.homework_submissions;
CREATE POLICY "hws view" ON public.homework_submissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "hws manage" ON public.homework_submissions;
CREATE POLICY "hws manage" ON public.homework_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

CREATE TABLE IF NOT EXISTS public.homework_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('video','pdf','doc','link')),
  url TEXT,
  source TEXT,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.homework_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hwr view" ON public.homework_resources;
CREATE POLICY "hwr view" ON public.homework_resources FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "hwr manage" ON public.homework_resources;
CREATE POLICY "hwr manage" ON public.homework_resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

-- POLICIES on tables with newly-added user/from/to columns
DROP POLICY IF EXISTS "leave own read"   ON public.leave_requests;
DROP POLICY IF EXISTS "leave own create" ON public.leave_requests;
DROP POLICY IF EXISTS "leave approve"    ON public.leave_requests;
DROP POLICY IF EXISTS "leave read"       ON public.leave_requests;
DROP POLICY IF EXISTS "leave insert"     ON public.leave_requests;
DROP POLICY IF EXISTS "leave update"     ON public.leave_requests;
CREATE POLICY "leave read" ON public.leave_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'head_teacher') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "leave insert" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "leave update" ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'head_teacher') OR public.has_role(auth.uid(),'manager'));

DROP POLICY IF EXISTS "adv own read"   ON public.advance_requests;
DROP POLICY IF EXISTS "adv own create" ON public.advance_requests;
DROP POLICY IF EXISTS "adv approve"    ON public.advance_requests;
DROP POLICY IF EXISTS "adv read"       ON public.advance_requests;
DROP POLICY IF EXISTS "adv insert"     ON public.advance_requests;
DROP POLICY IF EXISTS "adv update"     ON public.advance_requests;
CREATE POLICY "adv read" ON public.advance_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "adv insert" ON public.advance_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "adv update" ON public.advance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "letters read" ON public.staff_letters;
DROP POLICY IF EXISTS "letters send" ON public.staff_letters;
DROP POLICY IF EXISTS "letters update" ON public.staff_letters;
CREATE POLICY "letters read" ON public.staff_letters FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
CREATE POLICY "letters send" ON public.staff_letters FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
CREATE POLICY "letters update" ON public.staff_letters FOR UPDATE TO authenticated
  USING (to_user = auth.uid() OR from_user = auth.uid());

DROP POLICY IF EXISTS "appeals read" ON public.account_appeals;
DROP POLICY IF EXISTS "appeals submit" ON public.account_appeals;
DROP POLICY IF EXISTS "appeals review" ON public.account_appeals;
CREATE POLICY "appeals read" ON public.account_appeals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
CREATE POLICY "appeals submit" ON public.account_appeals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "appeals review" ON public.account_appeals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));

GRANT ALL ON public.finance_projects, public.liquidity_requests, public.user_permissions,
  public.user_warnings, public.direct_messages, public.staff_attendance, public.salaries,
  public.medical_incidents, public.learner_medical, public.tasks, public.homework,
  public.homework_submissions, public.homework_resources TO authenticated;

NOTIFY pgrst, 'reload schema';
