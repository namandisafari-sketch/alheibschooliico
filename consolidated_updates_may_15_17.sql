-- =========================================================================================
-- COMPREHENSIVE DATABASE SYNC (MAY 2026)
-- Target: Apply latest schema changes, security fixes, and role management for all modules
-- Includes: Academic, Gate, Office, Store, Nurse, HR, and Admin Force roles
-- =========================================================================================

-- 1. EXTEND APP_ROLE ENUM (Support new modules)
DO $$ 
BEGIN 
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dos';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'storekeeper';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gateman';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direct_manager';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center_director';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'deputy_head_teacher';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_manager';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security';
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- 2. CALENDAR RECURRENCE & RLS FIX
ALTER TABLE public.school_calendar 
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' 
CHECK (recurrence IN ('none', 'weekly', 'monthly', 'annually', 'termly'));

CREATE INDEX IF NOT EXISTS idx_school_calendar_dates ON public.school_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_school_calendar_type ON public.school_calendar(event_type);

CREATE OR REPLACE FUNCTION public.is_calendar_manager(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = _uid
       AND p.role IN ('admin','head_teacher','director','dos','deputy_head_teacher')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles r
     WHERE r.user_id = _uid
       AND r.role::text IN ('admin','head_teacher','director','dos','deputy_head_teacher')
  );
$$;

ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view calendar"        ON public.school_calendar;
DROP POLICY IF EXISTS "Managers can insert calendar"    ON public.school_calendar;
DROP POLICY IF EXISTS "Managers can update calendar"    ON public.school_calendar;
DROP POLICY IF EXISTS "Managers can delete calendar"    ON public.school_calendar;

CREATE POLICY "Anyone can view calendar" ON public.school_calendar FOR SELECT USING (true);
CREATE POLICY "Managers can insert calendar" ON public.school_calendar FOR INSERT WITH CHECK (public.is_calendar_manager(auth.uid()));
CREATE POLICY "Managers can update calendar" ON public.school_calendar FOR UPDATE USING (public.is_calendar_manager(auth.uid()));
CREATE POLICY "Managers can delete calendar" ON public.school_calendar FOR DELETE USING (public.is_calendar_manager(auth.uid()));

-- 3. STAFF ATTENDANCE, SALARIES, & HR
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

-- 4. NURSE / MEDICAL MODULE TABLES
CREATE TABLE IF NOT EXISTS public.clinic_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    complaint TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medication_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    stock_quantity INTEGER DEFAULT 0,
    unit TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 5. ACADEMIC WORKFLOW (SYLLABUS & EXAMS)
CREATE TABLE IF NOT EXISTS public.curriculum_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  term TEXT,
  academic_year INTEGER,
  topic_title TEXT NOT NULL,
  planned_weeks INTEGER,
  sequence_order INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_date DATE,
  evidence_url TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  term TEXT,
  academic_year INTEGER,
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. GATE OPERATIONS
CREATE TABLE IF NOT EXISTS public.vehicle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  driver_name TEXT,
  phone_number TEXT,
  purpose TEXT,
  vehicle_type TEXT,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  recorded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exit_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id),
  staff_id UUID REFERENCES public.profiles(id),
  pass_type TEXT CHECK (pass_type IN ('learner', 'staff')),
  reason TEXT,
  departure_target_time TIMESTAMP WITH TIME ZONE,
  return_target_time TIMESTAMP WITH TIME ZONE,
  actual_exit_time TIMESTAMP WITH TIME ZONE,
  actual_return_time TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  verified_by_gate UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'exit', 'returned', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. OFFICE & STORE OPERATIONS
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles text[],
  priority TEXT CHECK (priority IN ('normal', 'high', 'urgent')),
  sent_via text[] DEFAULT ARRAY['app'],
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT,
  rating INTEGER DEFAULT 5,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  contract_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  unit TEXT,
  min_threshold INTEGER DEFAULT 5,
  cost_per_unit DECIMAL(12,2),
  supplier_id UUID REFERENCES public.suppliers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ADMINISTRATIVE ROLE FORCE (WHITELIST SYNC)
DO $$
DECLARE
  v_admin_emails TEXT[] := ARRAY[
    'muslim.ummahlink@gmail.com',
    'admin@ummahlink.app',
    'admin@alhebi.com',
    'info.kabejjasystems@gmail.com',
    'papa@alheib.teacher',
    'admin@alheib.com',
    'alhebiadmin@gmail.com'
  ];
  v_email TEXT;
  v_user_id UUID;
BEGIN
  FOREACH v_email IN ARRAY v_admin_emails
  LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      INSERT INTO public.profiles (id, email, full_name, scope)
      VALUES (v_user_id, v_email, COALESCE(v_email, 'Administrator'), 'global')
      ON CONFLICT (id) DO UPDATE SET scope = 'global';
      
      DELETE FROM public.user_roles WHERE user_id = v_user_id AND role != 'admin';
    END IF;
  END LOOP;
END $$;

-- 9. GLOBAL ADMIN RLS SWEEP (Includes Directors & Center Directors as System Admins)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins have full access" ON public.%I FOR ALL USING (
      public.has_role(auth.uid(), ''admin'') OR 
      public.has_role(auth.uid(), ''center_director'') OR 
      public.has_role(auth.uid(), ''director'')
    )', t);
  END LOOP;
END $$;

-- 10. LEARNER SEEDING (If empty)
INSERT INTO public.learners (full_name, admission_number, gender, date_of_birth, status)
SELECT 'Test Learner ' || i, 'ALH/SYNC/' || i, CASE WHEN i % 2 = 0 THEN 'male'::gender_type ELSE 'female'::gender_type END, '2015-01-01'::DATE, 'active'
FROM generate_series(1, 5) AS i
WHERE NOT EXISTS (SELECT 1 FROM public.learners LIMIT 1);
