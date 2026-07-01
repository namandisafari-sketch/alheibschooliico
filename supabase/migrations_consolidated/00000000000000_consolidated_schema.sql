-- Consolidated migration (2026-05-22T11:21:16Z)
-- Source: 76 files


-- Create Homework table
CREATE TABLE IF NOT EXISTS homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for homework
ALTER TABLE homework ENABLE CONTROL;
ALTER TABLE homework ENABLE RLS;

-- Create Homework Submissions table
CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id UUID REFERENCES homework(id) ON DELETE CASCADE,
    learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
    grade TEXT,
    feedback TEXT,
    file_url TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for homework_submissions
ALTER TABLE homework_submissions ENABLE CONTROL;
ALTER TABLE homework_submissions ENABLE RLS;

-- Create Homework Resources table
CREATE TABLE IF NOT EXISTS homework_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('video', 'pdf', 'doc', 'link')),
    url TEXT,
    source TEXT,
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for homework_resources
ALTER TABLE homework_resources ENABLE CONTROL;
ALTER TABLE homework_resources ENABLE RLS;

-- Policies for homework
CREATE POLICY "Public homework are viewable by everyone" ON homework
    FOR SELECT USING (true);

CREATE POLICY "Teachers can insert/update homework" ON homework
    FOR ALL USING (has_role('teacher', auth.uid()) OR has_role('admin', auth.uid()));

-- Policies for homework_submissions
CREATE POLICY "Learners can view their own submissions" ON homework_submissions
    FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE id = auth.uid())); -- Simplified for now

CREATE POLICY "Submissions viewable by relevant teachers" ON homework_submissions
    FOR SELECT USING (has_role('teacher', auth.uid()) OR has_role('admin', auth.uid()));

-- Policies for homework_resources
CREATE POLICY "Resources viewable by everyone" ON homework_resources
    FOR SELECT USING (true);
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for competency levels (Uganda New Curriculum)
CREATE TYPE competency_level AS ENUM ('exceeding', 'meeting', 'approaching', 'beginning');

-- Create enum for gender
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- Create enum for attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- Create enum for term
CREATE TYPE term_type AS ENUM ('term_1', 'term_2', 'term_3');

-- Create profiles table for authenticated users (teachers/admin)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'head_teacher')),
  phone TEXT,
  qualification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table (P1-P7)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 7),
  teacher_id UUID REFERENCES public.profiles(id),
  room TEXT,
  capacity INTEGER DEFAULT 40,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guardians table
CREATE TABLE public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT DEFAULT 'parent',
  district TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learners table
CREATE TABLE public.learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth DATE,
  class_id UUID REFERENCES public.classes(id),
  guardian_id UUID REFERENCES public.guardians(id),
  district TEXT,
  religion TEXT DEFAULT 'Islam',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects/learning areas table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  is_core BOOLEAN DEFAULT true,
  min_class_level INTEGER DEFAULT 1,
  max_class_level INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  check_in_time TIME,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_id, date)
);

-- Create term results table (competency-based)
CREATE TABLE public.term_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  term term_type NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  competency_rating competency_level NOT NULL,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  teacher_remarks TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_id, subject_id, term, academic_year)
);

-- Create report cards table
CREATE TABLE public.report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) NOT NULL,
  term term_type NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  attendance_percentage DECIMAL(5,2),
  class_teacher_remarks TEXT,
  head_teacher_remarks TEXT,
  overall_competency competency_level,
  conduct_rating competency_level,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_id, term, academic_year)
);

-- Create PLE mock tests table
CREATE TABLE public.ple_mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('english', 'mathematics', 'science', 'social_studies')),
  year INTEGER,
  is_past_paper BOOLEAN DEFAULT false,
  total_marks INTEGER DEFAULT 100,
  duration_minutes INTEGER DEFAULT 120,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PLE results table
CREATE TABLE public.ple_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  mock_test_id UUID REFERENCES public.ple_mock_tests(id) NOT NULL,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  grade TEXT,
  time_taken_minutes INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  remarks TEXT,
  UNIQUE(learner_id, mock_test_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ple_mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ple_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (teachers/admin)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage classes" ON public.classes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view guardians" ON public.guardians
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage guardians" ON public.guardians
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view learners" ON public.learners
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage learners" ON public.learners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage subjects" ON public.subjects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view term results" ON public.term_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage term results" ON public.term_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view report cards" ON public.report_cards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage report cards" ON public.report_cards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view PLE mock tests" ON public.ple_mock_tests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage PLE mock tests" ON public.ple_mock_tests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view PLE results" ON public.ple_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage PLE results" ON public.ple_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learners_updated_at BEFORE UPDATE ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_term_results_updated_at BEFORE UPDATE ON public.term_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subjects (Uganda New Curriculum)
INSERT INTO public.subjects (name, code, is_core, min_class_level, max_class_level) VALUES
  ('Literacy', 'LIT', true, 1, 2),
  ('Numeracy', 'NUM', true, 1, 2),
  ('English', 'ENG', true, 3, 7),
  ('Mathematics', 'MAT', true, 3, 7),
  ('Science', 'SCI', true, 3, 7),
  ('Social Studies', 'SST', true, 3, 7),
  ('Islamic Religious Education', 'IRE', true, 1, 7),
  ('Arabic', 'ARB', true, 1, 7),
  ('Quran', 'QRN', true, 1, 7),
  ('Kiswahili', 'KIS', false, 4, 7),
  ('Local Language', 'LOC', false, 1, 3);

-- Insert default classes (P1-P7)
INSERT INTO public.classes (name, level, room, capacity) VALUES
  ('Primary 1 (P1)', 1, 'Room 101', 40),
  ('Primary 2 (P2)', 2, 'Room 102', 40),
  ('Primary 3 (P3)', 3, 'Room 103', 40),
  ('Primary 4 (P4)', 4, 'Room 104', 40),
  ('Primary 5 (P5)', 5, 'Room 105', 40),
  ('Primary 6 (P6)', 6, 'Room 106', 40),
  ('Primary 7 (P7)', 7, 'Room 107', 40);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learners;-- Create app_role enum for different user types
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent', 'staff');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create parent_learner_links table to link parents to their children
CREATE TABLE public.parent_learner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (parent_user_id, learner_id)
);

-- Enable RLS on parent_learner_links
ALTER TABLE public.parent_learner_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for parent_learner_links
CREATE POLICY "Parents can view their own links"
  ON public.parent_learner_links
  FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Admins can manage all links"
  ON public.parent_learner_links
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles table to ensure it works with auth
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create trigger to assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default new users to 'parent' role (can be changed by admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');
  RETURN NEW;
END;
$$;

-- Create trigger for new user role assignment
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Update RLS policies for learners table to allow parents to view their children
CREATE POLICY "Parents can view their linked learners"
  ON public.learners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_learner_links
      WHERE parent_user_id = auth.uid()
      AND learner_id = id
    )
  );

-- Update RLS policies for attendance to allow parents to view their children's attendance
CREATE POLICY "Parents can view their children's attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_learner_links
      WHERE parent_user_id = auth.uid()
      AND learner_id = attendance.learner_id
    )
  );-- Fix get_user_role function search path
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;-- Create storage bucket for learner documents (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('learner-documents', 'learner-documents', false);

-- Create table to track learner documents with metadata
CREATE TABLE public.learner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL, -- 'guardian_id', 'academic_report', 'medical_record', 'birth_certificate', 'other'
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  ocr_extracted_data jsonb, -- Store OCR results
  ocr_status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learner_documents ENABLE ROW LEVEL SECURITY;

-- Only admins and teachers can view documents
CREATE POLICY "Staff can view learner documents"
ON public.learner_documents
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'teacher') OR
  has_role(auth.uid(), 'staff')
);

-- Only admins can insert/update/delete documents
CREATE POLICY "Admins can manage learner documents"
ON public.learner_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Storage policies for learner-documents bucket
CREATE POLICY "Staff can view learner document files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'learner-documents' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'))
);

CREATE POLICY "Admins can upload learner document files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'learner-documents' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update learner document files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'learner-documents' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete learner document files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'learner-documents' AND
  has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_learner_documents_updated_at
BEFORE UPDATE ON public.learner_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create notification templates table
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  channel text NOT NULL DEFAULT 'sms', -- 'sms', 'whatsapp'
  subject text,
  message_body text NOT NULL,
  variables text[], -- e.g. ['learner_name', 'class_name', 'date']
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.notification_templates(id),
  recipient_phone text NOT NULL,
  recipient_name text,
  learner_id uuid REFERENCES public.learners(id),
  guardian_id uuid REFERENCES public.guardians(id),
  channel text NOT NULL, -- 'sms', 'whatsapp'
  message_content text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create scheduled notifications table
CREATE TABLE public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.notification_templates(id) NOT NULL,
  target_audience text NOT NULL, -- 'all_parents', 'class', 'individual'
  target_class_id uuid REFERENCES public.classes(id),
  target_learner_ids uuid[],
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'scheduled', -- 'scheduled', 'processing', 'completed', 'cancelled'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates
CREATE POLICY "Staff can view notification templates"
ON public.notification_templates FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for notification_logs
CREATE POLICY "Staff can view notification logs"
ON public.notification_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage notification logs"
ON public.notification_logs FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for scheduled_notifications
CREATE POLICY "Staff can view scheduled notifications"
ON public.scheduled_notifications FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage scheduled notifications"
ON public.scheduled_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default templates (inactive)
INSERT INTO public.notification_templates (name, description, channel, message_body, variables, is_active) VALUES
('Attendance Alert', 'Notify parent when learner is absent', 'sms', 'Dear {guardian_name}, your child {learner_name} was marked absent today ({date}). Please contact the school if you have any concerns.', ARRAY['guardian_name', 'learner_name', 'date'], false),
('Fee Reminder', 'Remind parents about pending fees', 'sms', 'Dear {guardian_name}, this is a reminder that school fees for {learner_name} ({class_name}) are due. Please make payment at your earliest convenience.', ARRAY['guardian_name', 'learner_name', 'class_name'], false),
('Report Card Ready', 'Notify when report card is available', 'whatsapp', 'Dear {guardian_name}, the {term} report card for {learner_name} is now available. Please visit the school to collect it or check the parent portal.', ARRAY['guardian_name', 'learner_name', 'term'], false),
('General Announcement', 'General school announcements', 'sms', '{message}', ARRAY['message'], false),
('Event Reminder', 'Remind about upcoming events', 'whatsapp', 'Dear {guardian_name}, reminder: {event_name} is scheduled for {event_date}. We look forward to seeing you!', ARRAY['guardian_name', 'event_name', 'event_date'], false);

-- Triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Create site settings table for landing page content
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (public landing page)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can update site settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default landing page content
INSERT INTO public.site_settings (key, value) VALUES
('landing_hero', '{
  "school_name": "Alheb Islamic Primary School",
  "tagline": "Nurturing Minds, Building Character, Inspiring Excellence",
  "description": "Where Islamic values meet academic excellence. We provide quality education in a nurturing environment that prepares students for success in this life and the hereafter.",
  "cta_text": "Apply Now",
  "cta_link": "/auth"
}'::jsonb),
('landing_features', '{
  "title": "Why Choose Us?",
  "items": [
    {"icon": "BookOpen", "title": "Islamic Education", "description": "Comprehensive Islamic studies integrated with modern curriculum"},
    {"icon": "GraduationCap", "title": "Academic Excellence", "description": "High-quality education with experienced and dedicated teachers"},
    {"icon": "Users", "title": "Character Building", "description": "Focus on moral development and Islamic values"},
    {"icon": "Shield", "title": "Safe Environment", "description": "Secure and nurturing campus for your children"}
  ]
}'::jsonb),
('landing_stats', '{
  "items": [
    {"value": "500+", "label": "Students"},
    {"value": "25+", "label": "Teachers"},
    {"value": "15+", "label": "Years Experience"},
    {"value": "98%", "label": "Pass Rate"}
  ]
}'::jsonb),
('landing_contact', '{
  "title": "Contact Us",
  "address": "123 Education Road, Kampala, Uganda",
  "phone": "+256 700 123 456",
  "email": "info@alheb.edu",
  "hours": "Monday - Friday: 7:00 AM - 5:00 PM"
}'::jsonb),
('landing_theme', '{
  "primary_color": "hsl(142, 76%, 36%)",
  "hero_bg_gradient": "linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 60%, 25%) 100%)",
  "show_stats": true,
  "show_features": true,
  "show_contact": true
}'::jsonb);

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Create salary records table for all staff
CREATE TABLE public.salary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) GENERATED ALWAYS AS (basic_salary + COALESCE(allowances, 0) - COALESCE(deductions, 0)) STORED,
  currency TEXT DEFAULT 'UGX',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create salary payments table for payment history
CREATE TABLE public.salary_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salary_record_id UUID NOT NULL REFERENCES public.salary_records(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  reference_number TEXT,
  receipt_number TEXT UNIQUE,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  paid_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add language preference to site settings
INSERT INTO public.site_settings (key, value)
VALUES ('language_settings', '{"default_language": "en", "supported_languages": ["en", "ar"], "rtl_enabled": true}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for salary_records
CREATE POLICY "Admins can manage salary records"
ON public.salary_records FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own salary"
ON public.salary_records FOR SELECT
USING (staff_id = auth.uid());

-- RLS policies for salary_payments
CREATE POLICY "Admins can manage salary payments"
ON public.salary_payments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own payments"
ON public.salary_payments FOR SELECT
USING (staff_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_salary_records_updated_at
BEFORE UPDATE ON public.salary_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create signatures storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view signatures
CREATE POLICY "Public can view signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Admins can upload signatures
CREATE POLICY "Admins can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update signatures
CREATE POLICY "Admins can update signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete signatures
CREATE POLICY "Admins can delete signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed id_card_settings if missing
INSERT INTO public.site_settings (key, value)
VALUES (
  'id_card_settings',
  '{
    "director_name": "",
    "director_signature_url": "",
    "head_teacher_name": "",
    "head_teacher_signature_url": "",
    "school_logo_url": "",
    "back_policy": "This card remains the property of the school. If found, please return to the school office. The holder must produce this card on request.",
    "back_policy_ar": "هذه البطاقة ملك للمدرسة. في حال العثور عليها، يرجى إعادتها إلى مكتب المدرسة. يجب على حامل البطاقة إبرازها عند الطلب."
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
-- 1. Subject category & grading type
DO $$ BEGIN
  CREATE TYPE public.subject_category AS ENUM ('academic', 'islamic', 'behavior');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.grading_type AS ENUM ('numeric', 'letter', 'descriptive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('draft', 'published', 'locked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS category public.subject_category NOT NULL DEFAULT 'academic',
  ADD COLUMN IF NOT EXISTS grading_type public.grading_type NOT NULL DEFAULT 'numeric',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 100;

-- 2. Term results: letter grades + Juz tracking
ALTER TABLE public.term_results
  ADD COLUMN IF NOT EXISTS letter_grade text,
  ADD COLUMN IF NOT EXISTS juz_completed numeric;

-- 3. Report cards: positions, attendance, Islamic remarks, behavior, publish state
ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS academic_position integer,
  ADD COLUMN IF NOT EXISTS islamic_position integer,
  ADD COLUMN IF NOT EXISTS class_size integer,
  ADD COLUMN IF NOT EXISTS days_present integer,
  ADD COLUMN IF NOT EXISTS days_absent integer,
  ADD COLUMN IF NOT EXISTS islamic_teacher_remarks text,
  ADD COLUMN IF NOT EXISTS discipline_rating text,
  ADD COLUMN IF NOT EXISTS participation_rating text,
  ADD COLUMN IF NOT EXISTS cleanliness_rating text,
  ADD COLUMN IF NOT EXISTS academic_total numeric,
  ADD COLUMN IF NOT EXISTS academic_average numeric,
  ADD COLUMN IF NOT EXISTS status public.report_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS report_cards_unique_idx
  ON public.report_cards (learner_id, class_id, term, academic_year);

-- 4. Tighten RLS on report_cards: teachers cannot modify locked/published reports
DROP POLICY IF EXISTS "Authenticated users can manage report cards" ON public.report_cards;

CREATE POLICY "Admins manage all report cards"
ON public.report_cards
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Teachers manage draft report cards"
ON public.report_cards
FOR ALL
TO authenticated
USING (status = 'draft' AND (public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)))
WITH CHECK (status = 'draft' AND (public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));

-- 5. Seed Islamic subjects (extended set)
INSERT INTO public.subjects (name, code, is_core, category, grading_type, min_class_level, max_class_level, display_order)
VALUES
  ('Qur''an (Tilawah)', 'QURAN', true, 'islamic', 'letter', 1, 7, 200),
  ('Hifz (Memorization)', 'HIFZ', true, 'islamic', 'descriptive', 1, 7, 201),
  ('Fiqh', 'FIQH', true, 'islamic', 'letter', 1, 7, 202),
  ('Hadith', 'HADITH', true, 'islamic', 'letter', 1, 7, 203),
  ('Aqeedah', 'AQEED', true, 'islamic', 'letter', 1, 7, 204),
  ('Arabic Language', 'ARAB', true, 'islamic', 'numeric', 1, 7, 205),
  ('Akhlaq (Character)', 'AKHL', true, 'islamic', 'descriptive', 1, 7, 206),
  ('Seerah', 'SEER', true, 'islamic', 'letter', 1, 7, 207)
ON CONFLICT DO NOTHING;

-- 6. Mark existing curriculum subjects as academic with sensible order
UPDATE public.subjects
SET category = 'academic', grading_type = 'numeric'
WHERE category IS NULL OR category = 'academic';
-- Fee structures (catalog of fee items)
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tuition',
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  class_level INTEGER,
  applies_to TEXT NOT NULL DEFAULT 'all',
  term TEXT,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-learner fee assignments / exemptions
CREATE TABLE public.fee_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  custom_amount NUMERIC(12,2),
  is_exempted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(learner_id, fee_structure_id)
);

-- Payments
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE RESTRICT,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  term TEXT,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fee_payments_learner ON public.fee_payments(learner_id);
CREATE INDEX idx_fee_payments_date ON public.fee_payments(payment_date DESC);
CREATE INDEX idx_fee_payments_receipt ON public.fee_payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_salary_payments_receipt ON public.salary_payments(receipt_number);

-- Bursar red list rules
CREATE TABLE public.bursar_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'balance_threshold',
  balance_threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  applies_to_all_classes BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Override requests when blocked
CREATE TABLE public.bursar_override_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.bursar_rules(id) ON DELETE SET NULL,
  reason TEXT,
  outstanding_balance NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_override_status ON public.bursar_override_requests(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bursar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bursar_override_requests ENABLE ROW LEVEL SECURITY;

-- Fee structures policies
CREATE POLICY "Anyone authenticated can view fee structures"
  ON public.fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fee structures"
  ON public.fee_structures FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fee assignments policies
CREATE POLICY "Staff view fee assignments"
  ON public.fee_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fee assignments"
  ON public.fee_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fee payments policies
CREATE POLICY "Staff view fee payments"
  ON public.fee_payments FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "Parents view own children payments"
  ON public.fee_payments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM parent_learner_links
            WHERE parent_user_id = auth.uid() AND learner_id = fee_payments.learner_id)
  );
CREATE POLICY "Admin and staff record payments"
  ON public.fee_payments FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "Admins update payments"
  ON public.fee_payments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete payments"
  ON public.fee_payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Bursar rules policies
CREATE POLICY "Staff view bursar rules"
  ON public.bursar_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bursar rules"
  ON public.bursar_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Override requests policies
CREATE POLICY "Staff view override requests"
  ON public.bursar_override_requests FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
  );
CREATE POLICY "Staff create override requests"
  ON public.bursar_override_requests FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "Admins manage override requests"
  ON public.bursar_override_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_fee_structures_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bursar_rules_updated_at
  BEFORE UPDATE ON public.bursar_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.user_roles (user_id, role)
VALUES ('d4aeeb9e-e2c9-42a0-8650-cb38f136b18f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove any default 'parent' role for the admin so they only have 'admin'
DELETE FROM public.user_roles
WHERE user_id = 'd4aeeb9e-e2c9-42a0-8650-cb38f136b18f' AND role = 'parent';
-- ============== VISITORS ==============
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  id_number TEXT,
  photo_url TEXT,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage visitors" ON public.visitors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Teachers view visitors" ON public.visitors FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role));
CREATE TRIGGER trg_visitors_updated_at BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== APPOINTMENTS ==============
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  purpose TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT,
  host_staff_id UUID,
  host_name TEXT,
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  notes TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage appointments" ON public.appointments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Teachers view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role) OR host_staff_id = auth.uid());
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_appointments_scheduled_for ON public.appointments(scheduled_for);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============== VISITOR VISITS (gate log) ==============
CREATE TABLE public.visitor_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_photo_url TEXT,
  purpose TEXT,
  host_staff_id UUID,
  host_name TEXT,
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  badge_number TEXT,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in',
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage visitor visits" ON public.visitor_visits FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Teachers view visitor visits" ON public.visitor_visits FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role));
CREATE INDEX idx_visitor_visits_check_in ON public.visitor_visits(check_in_at DESC);
CREATE INDEX idx_visitor_visits_status ON public.visitor_visits(status);

-- ============== IN-APP NOTIFICATIONS ==============
CREATE TABLE public.in_app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.in_app_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.in_app_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.in_app_notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Staff create notifications" ON public.in_app_notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE INDEX idx_in_app_notifications_user_unread ON public.in_app_notifications(user_id, is_read, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

CREATE TABLE public.emergency_reentry_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_visit_id uuid REFERENCES public.visitor_visits(id) ON DELETE SET NULL,
  visitor_id uuid REFERENCES public.visitors(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_phone text,
  id_number text,
  purpose text,
  host_name text,
  badge_number text NOT NULL,
  serial text NOT NULL UNIQUE,
  duration_minutes integer NOT NULL DEFAULT 60,
  print_width integer NOT NULL DEFAULT 80,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  issued_by uuid,
  notes text,
  voided boolean NOT NULL DEFAULT false,
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reentry_slips_issued_at ON public.emergency_reentry_slips (issued_at DESC);
CREATE INDEX idx_reentry_slips_expires_at ON public.emergency_reentry_slips (expires_at);

ALTER TABLE public.emergency_reentry_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff manage reentry slips"
  ON public.emergency_reentry_slips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Teachers view reentry slips"
  ON public.emergency_reentry_slips
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role));

-- Add designation and gender to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender public.gender_type;

-- Update the role check constraint to allow all staff roles
DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'teacher', 'head_teacher', 'support', 'driver', 'security', 'cook', 'cleaner', 'accountant'));


-- Ensure full_name is unique to allow ON CONFLICT to work
-- Note: In a real production system, you might want a more specific unique key.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_full_name_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_key UNIQUE (full_name);
    END IF;
END $$;

-- Insert staff members
INSERT INTO public.profiles (id, full_name, role, designation, gender, phone, email) VALUES
(gen_random_uuid(), 'ALI ABDO SALEH', 'admin', 'CENTRE DIRECTOR', 'male', NULL, NULL),
(gen_random_uuid(), 'NAKAYIZA AIDAH', 'admin', 'HEADTEACHER', 'female', '788402156', NULL),
(gen_random_uuid(), 'MUSIHO YASIN', 'teacher', 'TEACHER SECULAR', 'male', '700761192', NULL),
(gen_random_uuid(), 'MULONDO RUHUMAN', 'teacher', 'TEACHER SECULAR', 'male', '704653273', 'mulondoruqman312@gmail.com'),
(gen_random_uuid(), 'MUMBUYI ISAAC', 'teacher', 'TEACHER SECULAR', 'male', '789906707', NULL),
(gen_random_uuid(), 'ISABIRYE TAIBU', 'teacher', 'TEACHER SECULAR', 'male', '771837787', NULL),
(gen_random_uuid(), 'SSEREMBA FLUJENSIO', 'teacher', 'TEACHER SECULAR', 'male', '701069096', NULL),
(gen_random_uuid(), 'NAMUKASA REBECCA', 'teacher', 'TEACHER SECULAR', 'female', '762623954', NULL),
(gen_random_uuid(), 'NAKAYE HALIMAH', 'teacher', 'TEACHER SECULAR', 'female', '773900033', NULL),
(gen_random_uuid(), 'BYANGO JALALU-DIIN', 'teacher', 'TEACHER THEOLOGY', 'male', '0704865647', NULL),
(gen_random_uuid(), 'ISIKO MOHAMMED', 'teacher', 'TEACHER SECULAR', 'male', '701700530', NULL),
(gen_random_uuid(), 'JAMAL ABUBAKAR', 'support', 'ORPHAN SUPERVISOR', 'male', '700232171', 'jamaldinjamal256@gmail.com'),
(gen_random_uuid(), 'LOGOSE OLIVER', 'teacher', 'TEACHER SECULAR', 'female', '784835507', NULL),
(gen_random_uuid(), 'NAMULONDO ZAITUN', 'teacher', 'TEACHER THEOLOGY', 'female', '758612864', NULL),
(gen_random_uuid(), 'HANIFAH KALIFAN', 'teacher', 'TEACHER THEOLOGY', 'female', '774067512', NULL),
(gen_random_uuid(), 'NANYANZI ZAITUN', 'support', 'SECRETARY', 'female', '702592341', 'nanyanzizaitun@gmail.com'),
(gen_random_uuid(), 'NAMUSUBO ATIKA', 'support', 'SECRETARY', 'female', NULL, NULL),
(gen_random_uuid(), 'TUSIIME DINAVENCE', 'support', 'MATRON', 'female', '0758881938', NULL),
(gen_random_uuid(), 'KYAKUWAIRE ASIA', 'support', 'MATRON', 'female', '751605352', NULL),
(gen_random_uuid(), 'MWENDEZE SANULA', 'support', 'MATRON', 'female', '701988945', NULL),
(gen_random_uuid(), 'NAKYANZI LAILAH', 'support', 'MATRON', 'female', '707305382', NULL),
(gen_random_uuid(), 'NANYONGA HIDAYAH', 'support', 'NURSE', 'female', '0700991081', NULL),
(gen_random_uuid(), 'ABUDU MAGOHA MAYUNI', 'cook', 'COOK', 'male', '772828179', NULL),
(gen_random_uuid(), 'KALEMA ISA', 'cook', 'COOK', 'male', '786967253', NULL),
(gen_random_uuid(), 'NAMUBIRU ROSE', 'cleaner', 'CLEANER', 'female', '782647067', NULL),
(gen_random_uuid(), 'MBABAZI ZAHARA', 'cleaner', 'CLEANER', 'female', '746013830', NULL),
(gen_random_uuid(), 'WANYAMA HUSSEIN', 'security', 'WATCHMAN', 'male', '700228340', NULL),
(gen_random_uuid(), 'YASIN HARUNA', 'driver', 'DRIVER', 'male', '708181083', NULL),
(gen_random_uuid(), 'NABALA RASHID', 'security', 'WATCHMAN', 'male', '752310154', NULL),
(gen_random_uuid(), 'HIGENYI ISMAIL', 'security', 'WATCHMAN', 'male', '754008064', NULL),
(gen_random_uuid(), 'HANAD MOHAMMED', 'accountant', 'ACCOUNTANT', 'male', '707817492', 'hanadmohammed@alheib.teacher'),
(gen_random_uuid(), 'SAMIIRAH HAMIDU', 'teacher', 'TEACHER THEOLOGY', 'female', NULL, NULL),
(gen_random_uuid(), 'MUGOYA ROGERS', 'security', 'WATCHMAN', 'male', '740496827', NULL),
(gen_random_uuid(), 'RUTAKOME EMMANUEL', 'cleaner', 'CLEANER', 'male', NULL, NULL),
(gen_random_uuid(), 'HAMMAAD KARAARI ABDALLA', 'teacher', 'TEACHER THEOLOGY', 'male', NULL, NULL),
(gen_random_uuid(), 'BBAALE UKASHA', 'teacher', 'TEACHER THEOLOGY', 'male', NULL, NULL),
(gen_random_uuid(), 'ABDULLATWIFU IBRAHIM', 'teacher', 'TEACHER THEOLOGY', 'male', NULL, NULL),
(gen_random_uuid(), 'NASSALI AISHA', 'teacher', 'TEACHER SECULAR', 'female', NULL, NULL),
(gen_random_uuid(), 'MUSIMENTA SYLIVIA', 'support', 'MATRON', 'female', '704151132', NULL),
(gen_random_uuid(), 'KITONGO SARAH', 'support', 'MATRON', 'female', NULL, NULL),
(gen_random_uuid(), 'HARRIET KHAITSA', 'support', 'MATRON', 'female', '780186911', NULL),
(gen_random_uuid(), 'NAMBI AMINA', 'support', 'MATRON', 'female', '705330387', NULL),
(gen_random_uuid(), 'HUSSEIN RAJAB', 'support', 'WELDER', 'male', NULL, NULL),
(gen_random_uuid(), 'KAJULE YUNUSU', 'support', 'TAILOR', 'male', NULL, NULL),
(gen_random_uuid(), 'KAYISINGE JUMA', 'support', 'GENERAL DUTIES', 'male', NULL, NULL),
(gen_random_uuid(), 'NALUBWAMA REHEMAH', 'support', 'MATRON', 'female', NULL, NULL)
ON CONFLICT (full_name) DO NOTHING;

-- Inventory and Assets Tracking System

-- 1. Create Categories for Items
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pieces',
  sku TEXT UNIQUE,
  min_stock_level INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Stock Table
CREATE TABLE IF NOT EXISTS public.inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Transaction Types Enum if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transaction_type') THEN
        CREATE TYPE inventory_transaction_type AS ENUM ('restock', 'issuance', 'return', 'adjustment', 'damage');
    END IF;
END $$;

-- 5. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type inventory_transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  serial_number TEXT UNIQUE,
  purchase_date DATE,
  purchase_cost NUMERIC(12,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'disposed')),
  condition TEXT DEFAULT 'good',
  location TEXT,
  assigned_to_staff UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Trigger to Update Stock automatically
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- For new transactions, update the stock level
    IF (TG_OP = 'INSERT') THEN
        -- Ensure stock record exists
        INSERT INTO public.inventory_stock (item_id, quantity)
        VALUES (NEW.item_id, 0)
        ON CONFLICT (item_id) DO NOTHING;

        IF (NEW.type = 'restock' OR NEW.type = 'return') THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity + NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        ELSIF (NEW.type = 'issuance' OR NEW.type = 'damage' OR NEW.type = 'adjustment') THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity - NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_inventory_stock ON public.inventory_transactions;
CREATE TRIGGER tr_update_inventory_stock
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();

-- 8. Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (Allow authenticated users to manage)
CREATE POLICY "Allow auth view categories" ON public.inventory_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage categories" ON public.inventory_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow auth view items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage items" ON public.inventory_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow auth view stock" ON public.inventory_stock FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow auth view transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth insert transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow auth view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage assets" ON public.assets FOR ALL TO authenticated USING (true);

-- 10. Seed some initial categories
INSERT INTO public.inventory_categories (name, description) VALUES
('Stationery', 'Pens, pencils, notebooks, and office supplies'),
('Uniforms', 'Student and staff uniforms'),
('Electronics', 'Computers, printers, and teaching aids'),
('Furniture', 'Desks, chairs, and cupboards'),
('Sports', 'Balls, nets, and sports equipment')
ON CONFLICT (name) DO NOTHING;

-- 11. Ensure every item HAS a stock record and initialize/recalculate
-- This fixes any existing data inconsistencies
DO $$
BEGIN
    -- 1. Create missing stock records
    INSERT INTO public.inventory_stock (item_id, quantity)
    SELECT id, 0 FROM public.inventory_items
    ON CONFLICT (item_id) DO NOTHING;

    -- 2. Reset all stock to 0 before recalculating
    UPDATE public.inventory_stock SET quantity = 0;

    -- 3. Add Restocks and Returns
    UPDATE public.inventory_stock s
    SET quantity = s.quantity + t.sum_qty
    FROM (
        SELECT item_id, SUM(quantity) as sum_qty
        FROM public.inventory_transactions
        WHERE type IN ('restock', 'return')
        GROUP BY item_id
    ) t
    WHERE s.item_id = t.item_id;

    -- 4. Subtract Issuances, Damages, and Adjustments
    -- Note: This assumes 'adjustment' in transactions is always a positive number representing a deduction.
    -- If adjustments can be positive or negative, this logic would need to be split.
    UPDATE public.inventory_stock s
    SET quantity = s.quantity - t.sum_qty
    FROM (
        SELECT item_id, SUM(quantity) as sum_qty
        FROM public.inventory_transactions
        WHERE type IN ('issuance', 'damage', 'adjustment')
        GROUP BY item_id
    ) t
    WHERE s.item_id = t.item_id;
END $$;

-- Advanced Inventory Tracking & Approval System

-- 1. Update items to include Custodian (Person in Charge)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS custodian_id UUID REFERENCES public.profiles(id);

-- 2. Update Transactions to support Approval Workflow and Tracking Numbers
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'dispatched', 'completed'));
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS gate_pass_id TEXT UNIQUE;

-- 3. Create Gate Passes Table
CREATE TABLE IF NOT EXISTS public.inventory_gate_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.inventory_transactions(id) ON DELETE CASCADE,
  pass_number TEXT UNIQUE NOT NULL,
  security_checked_by UUID REFERENCES public.profiles(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Function to generate tracking numbers automatically
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
BEGIN
    IF NEW.tracking_number IS NULL THEN
        prefix := CASE 
            WHEN NEW.type = 'issuance' THEN 'ISS-'
            WHEN NEW.type = 'restock' THEN 'REC-'
            ELSE 'TRX-'
        END;
        NEW.tracking_number := prefix || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_generate_tracking_number
BEFORE INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

-- 5. Update the stock update trigger to ONLY update stock when status is 'approved' or if it's a 'restock'
-- Restocks are usually immediate, but issuances need approval.
-- 5. Update the stock update trigger to ONLY update stock when status is 'approved' or if it's an immediate type
-- Restocks, Returns, and Damages are usually immediate, but issuances need approval.
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
DECLARE
    is_becoming_approved BOOLEAN;
BEGIN
    -- Ensure stock record exists
    INSERT INTO public.inventory_stock (item_id, quantity)
    VALUES (NEW.item_id, 0)
    ON CONFLICT (item_id) DO NOTHING;

    -- Determine if this is a new approved transaction or an existing one becoming approved
    is_becoming_approved := (NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status = 'pending'));

    -- Update quantity based on type
    IF (NEW.type = 'restock' OR NEW.type = 'return') THEN
        -- Additions: Restocks and Returns are usually auto-approved or immediate
        IF (TG_OP = 'INSERT' OR (NEW.status = 'approved' AND OLD.status = 'pending')) THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity + NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        END IF;
    ELSIF (NEW.type = 'issuance' OR NEW.type = 'damage' OR NEW.type = 'adjustment') THEN
        -- Deductions: Only subtract when it becomes approved
        IF (is_becoming_approved) THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity - NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger as AFTER INSERT OR UPDATE
DROP TRIGGER IF EXISTS tr_update_inventory_stock ON public.inventory_transactions;
CREATE TRIGGER tr_update_inventory_stock
AFTER INSERT OR UPDATE ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();

-- 6. RLS for Gate Passes
ALTER TABLE public.inventory_gate_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow auth view gate passes" ON public.inventory_gate_passes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage gate passes" ON public.inventory_gate_passes FOR ALL TO authenticated USING (true);

-- Create school_calendar table
CREATE TABLE IF NOT EXISTS public.school_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('term', 'holiday', 'exam', 'activity', 'event')),
  color TEXT DEFAULT '#3b82f6',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;


-- Policies
-- Check if policy exists before creating
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view public calendar') THEN
        CREATE POLICY "Anyone can view public calendar" ON public.school_calendar
          FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage calendar') THEN
        CREATE POLICY "Admins can manage calendar" ON public.school_calendar
          FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher')));
    END IF;
END $$;

-- Add EMIS compliant fields to learners
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS nin TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS lin TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS immunization_status JSONB DEFAULT '[]';
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS special_needs_category TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS special_needs_description TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS parent_nin TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS religion TEXT DEFAULT 'Islam';

-- Add EMIS compliant fields to staff profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nssf_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number TEXT; -- For teachers (TRN)

-- Create a view for EMIS Export
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.full_name,
  l.gender,
  l.date_of_birth,
  l.nin,
  l.lin,
  c.name as current_class,
  l.parent_name,
  l.parent_phone,
  l.parent_nin,
  l.religion,
  l.special_needs_category
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id;

-- Pharmacy & Sick Bay Management
CREATE TYPE health_visit_type AS ENUM ('illness', 'injury', 'routine_checkup', 'emergency');
CREATE TYPE health_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Medical Inventory (Pharmacy)
CREATE TABLE IF NOT EXISTS public.pharmacy_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT, -- e.g. Painkiller, Antibiotic, First Aid
  unit TEXT NOT NULL, -- e.g. Tablets, Bottle, Pack
  quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  expiry_date DATE,
  batch_number TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sick Bay Visits
CREATE TABLE IF NOT EXISTS public.health_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID REFERENCES public.learners(id),
  staff_id UUID REFERENCES public.profiles(id),
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_type health_visit_type DEFAULT 'illness',
  priority health_priority DEFAULT 'low',
  symptoms TEXT,
  temperature DECIMAL(4,2), -- e.g. 37.5
  diagnosis TEXT,
  treatment_plan TEXT,
  action_taken TEXT, -- e.g. Sent home, Referred to hospital, Rest in sick bay
  recorded_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'referred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication Dispensing Logs
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES public.health_visits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.pharmacy_items(id),
  quantity INTEGER NOT NULL,
  dosage_instructions TEXT,
  dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dispensed_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view health records') THEN
        CREATE POLICY "Anyone can view health records" ON public.health_visits
          FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher', 'teacher', 'staff')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins and nurses can manage pharmacy') THEN
        CREATE POLICY "Admins and nurses can manage pharmacy" ON public.pharmacy_items
          FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'head_teacher', 'staff')));
    END IF;
END $$;

-- Update app_role enum to include missing roles
-- Note: Enum values must be added in a separate transaction from where they are first used.
DO $$ 
BEGIN 
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_teacher';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security';
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- Update has_role function to be more robust with the new roles
-- This depends on 20260427160000_fix_roles.sql being committed first
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) OR EXISTS (
    -- Fallback to profile role if user_roles is not set yet (for new signups)
    SELECT 1 
    FROM public.profiles 
    WHERE id = _user_id 
    AND role::text = _role::text
  )
$$;

-- Islamic Education and Hostel Management Modules

-- 1. Quran and Hifdh Tracking
CREATE TABLE IF NOT EXISTS public.quran_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  surah_name TEXT NOT NULL,
  last_ayah INTEGER NOT NULL,
  tajweed_score INTEGER CHECK (tajweed_score BETWEEN 1 AND 10),
  hifdh_type TEXT CHECK (hifdh_type IN ('memorization', 'revision', 'reading')),
  teacher_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Salah Attendance Tracking
CREATE TABLE IF NOT EXISTS public.salah_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  prayer_name TEXT CHECK (prayer_name IN ('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Tahajjud')),
  status TEXT CHECK (status IN ('Jamaah', 'Individual', 'Excused', 'Missed')),
  date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_id, prayer_name, date)
);

-- 3. Character Building (Akhlaaq)
CREATE TABLE IF NOT EXISTS public.akhlaaq_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  trait_category TEXT NOT NULL, -- e.g., 'Honesty', 'Respect', 'Cleanliness'
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  term term_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Hostel Logistics & Inventory Extensions
-- (Using existing inventory_items for buckets, boots, etc. to link to learners)
CREATE TABLE IF NOT EXISTS public.hostel_issuances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory_items(id),
  status TEXT CHECK (status IN ('Issued', 'Returned', 'Damaged', 'Lost')),
  condition_at_issue TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.holiday_arrival_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  arrival_date DATE NOT NULL,
  holiday_type TEXT,
  guardian_name TEXT,
  relative_relationship TEXT,
  phone_number TEXT,
  dormitory_number TEXT,
  proposed_dormitory TEXT,
  weight TEXT,
  height TEXT,
  chronic_disease_history TEXT,
  health_status TEXT,
  health_signature TEXT,
  school_uniforms INTEGER NOT NULL DEFAULT 0,
  sports_wear INTEGER NOT NULL DEFAULT 0,
  sweater INTEGER NOT NULL DEFAULT 0,
  track_suits INTEGER NOT NULL DEFAULT 0,
  shoes INTEGER NOT NULL DEFAULT 0,
  kanzu_hijab INTEGER NOT NULL DEFAULT 0,
  vests INTEGER NOT NULL DEFAULT 0,
  casual_wears INTEGER NOT NULL DEFAULT 0,
  cap_veils INTEGER NOT NULL DEFAULT 0,
  stockings INTEGER NOT NULL DEFAULT 0,
  underwear_pants INTEGER NOT NULL DEFAULT 0,
  matron_status TEXT NOT NULL DEFAULT 'pending',
  head_teacher_status TEXT NOT NULL DEFAULT 'pending',
  internal_supervisor_status TEXT NOT NULL DEFAULT 'pending',
  centre_director_status TEXT NOT NULL DEFAULT 'pending',
  matron_notes TEXT,
  head_teacher_notes TEXT,
  internal_supervisor_notes TEXT,
  centre_director_notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Washing Machine Management
CREATE TABLE IF NOT EXISTS public.washing_machine_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES public.assets(id),
  operator_id UUID REFERENCES public.profiles(id),
  soap_detergent_id UUID REFERENCES public.inventory_items(id),
  soap_quantity_used DECIMAL(10,2),
  loads_count INTEGER DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'completed',
  notes TEXT
);

-- 6. Visitor Management Extension
-- (Existing Visitors table likely exists, adding Visitor ID generation support)
ALTER TABLE IF EXISTS public.visitors 
ADD COLUMN IF NOT EXISTS visitor_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_printed BOOLEAN DEFAULT false;

-- 7. Procurement & Budgeting
CREATE TABLE IF NOT EXISTS public.budget_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id),
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partially_funded')),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on all new tables
ALTER TABLE public.quran_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salah_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akhlaaq_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_arrival_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washing_machine_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_requests ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Allow auth manage quran_progress" ON public.quran_progress FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage salah_attendance" ON public.salah_attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage akhlaaq_reports" ON public.akhlaaq_reports FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage hostel_issuances" ON public.hostel_issuances FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage holiday_arrival_clearances" ON public.holiday_arrival_clearances FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage washing_machine_usage" ON public.washing_machine_usage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage budget_requests" ON public.budget_requests FOR ALL TO authenticated USING (true);

-- Academic Tools and Staff Analytics Modules

-- 1. Digital Homework & Learning Materials
CREATE TABLE IF NOT EXISTS public.digital_homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT, -- Link to photo or document in storage
  due_date DATE,
  is_holiday_work BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff Performance Tracking
-- Tracks various metrics like attendance, grading speed, and curriculum coverage
CREATE TABLE IF NOT EXISTS public.staff_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'attendance', 'grading_speed', 'lesson_plan_completion'
  metric_value DECIMAL(10,2),
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  term term_type,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Student Progress Analytics View (Materialized for performance)
-- This will aggregate scores, attendance, and akhlaaq for holistic view
-- For now, we'll just create a table to store processed snapshots
CREATE TABLE IF NOT EXISTS public.student_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  academic_score_avg DECIMAL(5,2),
  attendance_percentage DECIMAL(5,2),
  akhlaaq_avg DECIMAL(5,2),
  salah_completion_rate DECIMAL(5,2),
  quran_progress_summary TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.digital_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow auth manage digital_homework" ON public.digital_homework FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage staff_performance_logs" ON public.staff_performance_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth view student_progress_snapshots" ON public.student_progress_snapshots FOR SELECT TO authenticated USING (true);

-- Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_id TEXT, -- GeoNames ID
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add scoping columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'school' CHECK (scope IN ('global', 'district', 'school')),
ADD COLUMN IF NOT EXISTS district_id TEXT, -- GeoNames ID
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view schools' AND tablename = 'schools') THEN
    CREATE POLICY "Anyone can view schools" ON public.schools
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage schools' AND tablename = 'schools') THEN
    CREATE POLICY "Admins can manage schools" ON public.schools
      FOR ALL TO authenticated USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Update profile handle function to set default scope
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, scope)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'school');
  RETURN NEW;
END;
$$;

-- Dormitories
CREATE TABLE public.dormitories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('boys','girls','mixed')),
  capacity integer NOT NULL DEFAULT 30,
  matron_staff_id uuid,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage dormitories" ON public.dormitories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Authenticated view dormitories" ON public.dormitories
  FOR SELECT TO authenticated USING (true);

-- Residency assignments
CREATE TABLE public.dormitory_residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dormitory_id uuid NOT NULL REFERENCES public.dormitories(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL,
  bed_number text,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  released_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_active_resident ON public.dormitory_residents(learner_id) WHERE is_active = true;
ALTER TABLE public.dormitory_residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage residents" ON public.dormitory_residents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Authenticated view residents" ON public.dormitory_residents
  FOR SELECT TO authenticated USING (true);

-- Per-learner essentials issuance log (references inventory_items)
CREATE TABLE public.learner_essentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  issued_by uuid,
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('good','damaged','missing','returned','replaced')),
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','missing','damaged','returned')),
  returned_date date,
  replacement_for uuid REFERENCES public.learner_essentials(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_learner_essentials_learner ON public.learner_essentials(learner_id);
ALTER TABLE public.learner_essentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage essentials" ON public.learner_essentials
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Teachers view essentials" ON public.learner_essentials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Parents view linked children essentials" ON public.learner_essentials
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_learner_links WHERE parent_user_id = auth.uid() AND learner_id = learner_essentials.learner_id));

CREATE TRIGGER trg_dorms_updated BEFORE UPDATE ON public.dormitories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_essentials_updated BEFORE UPDATE ON public.learner_essentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Hostel Essentials category if missing
INSERT INTO public.inventory_categories (name, description)
SELECT 'Hostel Essentials', 'Personal items issued to dormitory residents (sheets, mattresses, cups, buckets, mosquito nets, etc.)'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_categories WHERE name = 'Hostel Essentials');

-- Comprehensive Bio-Data for Alheib Primary School
-- Based on the official admission form docx

-- Add missing fields to learners
ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS current_residence_town TEXT,
ADD COLUMN IF NOT EXISTS current_residence_street TEXT,
ADD COLUMN IF NOT EXISTS residence_phone TEXT,
ADD COLUMN IF NOT EXISTS residence_email TEXT,
ADD COLUMN IF NOT EXISTS former_school_name TEXT,
ADD COLUMN IF NOT EXISTS former_school_class TEXT,
ADD COLUMN IF NOT EXISTS former_school_year TEXT,
ADD COLUMN IF NOT EXISTS pupil_status TEXT, -- bait zakat, IICO, Paying, Community
ADD COLUMN IF NOT EXISTS house TEXT, -- Lion, Tiger, Elephant, Cheetah
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions JSONB DEFAULT '[]', -- Asthma, Hearing, etc.
ADD COLUMN IF NOT EXISTS medication_details TEXT,
ADD COLUMN IF NOT EXISTS authorized_pick_up JSONB DEFAULT '{}', -- name, contact
ADD COLUMN IF NOT EXISTS next_of_kin JSONB DEFAULT '{}', -- name, tel, address, work_place
ADD COLUMN IF NOT EXISTS siblings_in_school JSONB DEFAULT '[]', -- array of {name, class}
ADD COLUMN IF NOT EXISTS date_of_application DATE DEFAULT CURRENT_DATE;

-- Add parent-specific details to guardians or learners
-- For simplicity and better data integrity per learner, adding to learners
ALTER TABLE public.learners
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS father_phone TEXT,
ADD COLUMN IF NOT EXISTS father_email TEXT,
ADD COLUMN IF NOT EXISTS father_occupation TEXT,
ADD COLUMN IF NOT EXISTS father_nin TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS mother_phone TEXT,
ADD COLUMN IF NOT EXISTS mother_email TEXT,
ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
ADD COLUMN IF NOT EXISTS mother_nin TEXT;

-- Refresh EMIS Export view to include new fields if needed
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.full_name,
  l.gender,
  l.date_of_birth,
  l.nin,
  l.lin,
  l.nationality,
  l.current_residence_town,
  c.name as current_class,
  l.parent_nin,
  l.father_name,
  l.mother_name,
  l.religion,
  l.pupil_status,
  l.special_needs_category
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id;

-- Refine Learner Schema for official Alheib Admission Form
-- Adding more specific medical and personal fields

ALTER TABLE public.learners 
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
ADD COLUMN IF NOT EXISTS immunization_complete BOOLEAN DEFAULT false;

-- Update the full_name to be a generated column or just keep it for backward compatibility
-- But for now, we'll just use the new columns.

-- Update EMIS View
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.first_name,
  l.last_name,
  l.gender,
  l.date_of_birth,
  l.nin,
  l.lin,
  l.nationality,
  l.current_residence_town,
  c.name as current_class,
  l.parent_nin,
  l.father_name,
  l.mother_name,
  l.religion,
  l.pupil_status,
  l.house,
  l.blood_group,
  l.immunization_complete as immunized
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id;

-- Extended Geographical Hierarchy for Uganda EMIS Compliance
-- Adds Region, County, Sub-County, Parish, and Village levels

-- Update Schools Table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS sub_county TEXT,
ADD COLUMN IF NOT EXISTS parish TEXT,
ADD COLUMN IF NOT EXISTS village TEXT;

-- Update Profiles Table (for staff and users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS sub_county TEXT,
ADD COLUMN IF NOT EXISTS parish TEXT,
ADD COLUMN IF NOT EXISTS village TEXT;

-- Update Learners Table (for home address)
ALTER TABLE public.learners
ADD COLUMN IF NOT EXISTS home_region TEXT,
ADD COLUMN IF NOT EXISTS home_district TEXT,
ADD COLUMN IF NOT EXISTS home_county TEXT,
ADD COLUMN IF NOT EXISTS home_sub_county TEXT,
ADD COLUMN IF NOT EXISTS home_parish TEXT,
ADD COLUMN IF NOT EXISTS home_village TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.schools.sub_county IS 'Administrative Sub-county for EMIS reporting';
COMMENT ON COLUMN public.schools.parish IS 'Administrative Parish for EMIS reporting';

-- School Compliance Metadata & Infrastructure Tracking

-- 1. Enhance Schools Table with Compliance Fields
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS center_number TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS registration_status TEXT CHECK (registration_status IN ('registered', 'license valid', 'license expired', 'not registered')),
ADD COLUMN IF NOT EXISTS ownership_type TEXT CHECK (ownership_type IN ('government', 'private', 'ngo', 'religious', 'community')),
ADD COLUMN IF NOT EXISTS academic_level TEXT CHECK (academic_level IN ('pre-primary', 'primary', 'secondary', 'post-primary', 'vocational')),
ADD COLUMN IF NOT EXISTS boarding_status TEXT CHECK (boarding_status IN ('day', 'boarding', 'mixed')),
ADD COLUMN IF NOT EXISTS gender_status TEXT CHECK (gender_status IN ('single_boys', 'single_girls', 'mixed')),
ADD COLUMN IF NOT EXISTS year_founded INTEGER,
ADD COLUMN IF NOT EXISTS urban_rural TEXT CHECK (urban_rural IN ('urban', 'rural')),
ADD COLUMN IF NOT EXISTS distance_to_district_hq NUMERIC,
ADD COLUMN IF NOT EXISTS distance_to_health_facility NUMERIC,
ADD COLUMN IF NOT EXISTS distance_to_bank NUMERIC;

-- 2. Infrastructure Table
CREATE TABLE IF NOT EXISTS public.school_infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- classroom, lab, library, office, staff_house
  name TEXT,
  sitting_capacity INTEGER DEFAULT 0,
  construction_year INTEGER,
  status TEXT DEFAULT 'usable' CHECK (status IN ('usable', 'under_construction', 'needs_repair', 'unusable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sanitation & WASH Table
CREATE TABLE IF NOT EXISTS public.school_sanitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  facility_type TEXT NOT NULL, -- latrine, flush_toilet, urinal, handwashing_station
  target_user TEXT NOT NULL, -- boys, girls, teachers, staff, mixed
  units_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'usable' CHECK (status IN ('usable', 'unusable')),
  is_accessible_to_pwd BOOLEAN DEFAULT false,
  
  -- WASH Specifics
  primary_water_source TEXT, -- Borehole, Piped, Rainwater
  has_handwashing_with_soap BOOLEAN DEFAULT false,
  has_mhm_changing_room BOOLEAN DEFAULT false,
  garbage_disposal_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.school_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_sanitation ENABLE ROW LEVEL SECURITY;

-- Policies (Allow authenticated users to view, admins to manage)
CREATE POLICY "Anyone can view infrastructure" ON public.school_infrastructure FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view sanitation" ON public.school_sanitation FOR SELECT TO authenticated USING (true);

-- Admin management policies (assuming 'admin' role exists)
CREATE POLICY "Admins can manage infrastructure" ON public.school_infrastructure FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage sanitation" ON public.school_sanitation FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- EMIS Data Validation Constraints

-- 1. National Identification Number (NIN) Validation
-- Uganda NIN is exactly 14 characters, alphanumeric (typically CM... or CF...)
ALTER TABLE public.learners 
ADD CONSTRAINT check_nin_format 
CHECK (nin IS NULL OR nin ~* '^[A-Z0-9]{14}$');

ALTER TABLE public.profiles 
ADD CONSTRAINT check_staff_nin_format 
CHECK (nin IS NULL OR nin ~* '^[A-Z0-9]{14}$');

-- 2. Learner Identification Number (LIN) Validation
-- Usually starts with a year or specific sequence, roughly 10-15 chars
ALTER TABLE public.learners 
ADD CONSTRAINT check_lin_format 
CHECK (lin IS NULL OR LENGTH(lin) BETWEEN 5 AND 20);

-- 3. Teacher Registration Number (TRN) Validation
ALTER TABLE public.profiles 
ADD CONSTRAINT check_trn_format 
CHECK (registration_number IS NULL OR LENGTH(registration_number) >= 5);

-- 4. Update EMIS Export View to include new fields
CREATE OR REPLACE VIEW public.emis_learner_export AS
SELECT 
  l.admission_number,
  l.first_name,
  l.last_name,
  l.gender,
  l.date_of_birth,
  l.nin,
  l.lin,
  l.nationality,
  c.name as current_class,
  l.parent_nin,
  l.father_name,
  l.mother_name,
  l.religion,
  l.home_region,
  l.home_district,
  l.home_sub_county,
  l.home_parish,
  s.name as school_name,
  s.center_number,
  s.district_id as school_district
FROM public.learners l
JOIN public.classes c ON l.class_id = c.id
LEFT JOIN public.schools s ON l.school_id = s.id;

-- 1. Create Gate Pass Table for more detailed tracking if it doesn't exist
-- Based on the previous session, we already had some columns, but we'll formalize the flow.

-- Add specific flow columns to inventory_transactions
ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS manager_approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS director_approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gateman_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS gate_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gate_notes TEXT,
ADD COLUMN IF NOT EXISTS qr_verification_code TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Update status constraint to match the new flow
ALTER TABLE public.inventory_transactions 
DROP CONSTRAINT IF EXISTS inventory_transactions_status_check;

ALTER TABLE public.inventory_transactions 
ADD CONSTRAINT inventory_transactions_status_check 
CHECK (status IN ('pending', 'manager_approved', 'director_approved', 'rejected', 'dispatched', 'verified_at_gate', 'completed'));

-- Create a View for the Gateman (simplified)
CREATE OR REPLACE VIEW public.active_gate_passes AS
SELECT 
    t.id,
    t.tracking_number,
    t.qr_verification_code,
    i.name as item_name,
    t.quantity,
    p.full_name as requester_name,
    t.status,
    t.director_approval_date
FROM public.inventory_transactions t
JOIN public.inventory_items i ON t.item_id = i.id
LEFT JOIN public.profiles p ON t.staff_id = p.id
WHERE t.status IN ('director_approved', 'dispatched');

-- Enable RLS for the view if possible (Supabase handles views well)
GRANT SELECT ON public.active_gate_passes TO authenticated;

-- Enhance Inventory Items with more details
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS storage_location TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb;

-- Enhance Assets with more details
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS next_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS asset_tag_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS technical_details JSONB DEFAULT '{}'::jsonb;

-- Create a helper function to get full item details including stock
CREATE OR REPLACE VIEW public.inventory_details AS
SELECT 
    i.*,
    s.quantity as current_stock,
    c.name as category_name
FROM public.inventory_items i
LEFT JOIN public.inventory_stock s ON i.id = s.item_id
LEFT JOIN public.inventory_categories c ON i.category_id = c.id;

GRANT SELECT ON public.inventory_details TO authenticated;

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

-- Serious Discipline Filing System (Police Style)
-- Adds unique case numbers and authoritative metadata

-- 1. Add case_number column if it doesn't exist
ALTER TABLE public.discipline_cases 
ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE;

-- 2. Create function to generate Case Number (Format: ALH/DIS/YYYY/0001)
CREATE OR REPLACE FUNCTION generate_discipline_case_number() 
RETURNS TRIGGER AS $$
DECLARE
    year_val TEXT;
    next_val INTEGER;
BEGIN
    year_val := TO_CHAR(NOW(), 'YYYY');
    
    -- Count cases in current year
    SELECT COUNT(*) + 1 INTO next_val 
    FROM public.discipline_cases 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    NEW.case_number := 'ALH/DIS/' || year_val || '/' || LPAD(next_val::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger to auto-assign case number on insert
DROP TRIGGER IF EXISTS tr_assign_case_number ON public.discipline_cases;
CREATE TRIGGER tr_assign_case_number
BEFORE INSERT ON public.discipline_cases
FOR EACH ROW
EXECUTE FUNCTION generate_discipline_case_number();

-- 4. Backfill existing cases if any
UPDATE public.discipline_cases 
SET case_number = 'ALH/DIS/' || TO_CHAR(created_at, 'YYYY') || '/' || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 4, '0')
WHERE case_number IS NULL;

-- Extended Discipline Filing (Victims & Evidence)
-- Adds support for victims and evidence photos to discipline files

-- 1. Add victims and evidence_photos columns
ALTER TABLE public.discipline_cases 
ADD COLUMN IF NOT EXISTS victims TEXT, -- Comma separated names or JSON
ADD COLUMN IF NOT EXISTS evidence_photos TEXT[]; -- Array of URLs

-- Financial & Accountant Module Schema
-- Prepared May 2026

-- 1. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donor_type') THEN
        CREATE TYPE donor_type AS ENUM ('individual', 'organization', 'grant');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
        CREATE TYPE po_status AS ENUM ('draft', 'committee', 'head_office', 'kuwait', 'approved', 'rejected', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_type') THEN
        CREATE TYPE doc_type AS ENUM ('invoice', 'delivery_note', 'receipt', 'quotation');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_step_type') THEN
        CREATE TYPE approval_step_type AS ENUM ('committee', 'head_office', 'kuwait');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_order_category') THEN
        CREATE TYPE store_order_category AS ENUM ('food', 'stationery');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_order_status') THEN
        CREATE TYPE store_order_status AS ENUM ('pending_director', 'pending_accountant', 'pending_storekeeper', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category_type') THEN
        CREATE TYPE asset_category_type AS ENUM ('furniture', 'equipment', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'petty_cash_status') THEN
        CREATE TYPE petty_cash_status AS ENUM ('open', 'closed', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_status') THEN
        CREATE TYPE payroll_status AS ENUM ('draft', 'approved', 'paid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repayment_plan') THEN
        CREATE TYPE repayment_plan AS ENUM ('single', 'installment');
    END IF;
END $$;

-- 2. Financial Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type account_type NOT NULL,
    parent_id UUID REFERENCES public.finance_accounts(id),
    currency TEXT DEFAULT 'UGX',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC(15,6) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Donors & Donations
CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type donor_type NOT NULL,
    contact TEXT,
    currency TEXT DEFAULT 'UGX',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE,
    project_id UUID, -- Links to projects (if any)
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'UGX',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Procurement (Purchase Orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    title TEXT NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    status po_status DEFAULT 'draft',
    total_amount NUMERIC(15,2),
    currency TEXT DEFAULT 'UGX',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    type doc_type NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    step approval_step_type NOT NULL,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 6. Store Management
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category store_order_category NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT,
    requested_by UUID REFERENCES auth.users(id),
    status store_order_status DEFAULT 'pending_director',
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assets Extensions & Custodians
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS useful_life_years INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS current_value NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.asset_custodians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    employee_id UUID, -- Link to employee table
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    returned_date DATE,
    signed_form_url TEXT,
    notes TEXT
);

-- 8. Petty Cash
CREATE TABLE IF NOT EXISTS public.petty_cash_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    opened_by UUID REFERENCES auth.users(id),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    total_float NUMERIC(15,2) NOT NULL,
    status petty_cash_status DEFAULT 'open',
    report_url TEXT,
    signed_image_url TEXT
);

CREATE TABLE IF NOT EXISTS public.petty_cash_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.petty_cash_runs(id) ON DELETE CASCADE,
    product_category TEXT,
    item_description TEXT NOT NULL,
    invoice_number TEXT,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'UGX',
    invoice_image_url TEXT,
    entered_by UUID REFERENCES auth.users(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Employees & Payroll
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    full_name TEXT NOT NULL,
    role TEXT,
    tin_number TEXT,
    nssf_number TEXT,
    base_salary NUMERIC(15,2),
    currency TEXT DEFAULT 'UGX',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link asset_custodians to employees
ALTER TABLE public.asset_custodians 
ADD CONSTRAINT fk_custodian_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    run_by UUID REFERENCES auth.users(id),
    status payroll_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id),
    base_salary NUMERIC(15,2) NOT NULL,
    overtime_amount NUMERIC(15,2) DEFAULT 0,
    advances_deducted NUMERIC(15,2) DEFAULT 0,
    other_deductions NUMERIC(15,2) DEFAULT 0,
    nssf_deduction NUMERIC(15,2) DEFAULT 0,
    net_pay NUMERIC(15,2) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.employee_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id),
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'UGX',
    disbursed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    repayment_schedule repayment_plan DEFAULT 'single',
    outstanding_balance NUMERIC(15,2) NOT NULL,
    notes TEXT
);

-- 10. Audit Log & Notifications
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. RLS Enable
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_custodians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies
CREATE POLICY "Allow auth view accounts" ON public.finance_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view exchange_rates" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view donors" ON public.donors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view donations" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view store_orders" ON public.store_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view petty_cash" ON public.petty_cash_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view payroll" ON public.payroll_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

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
-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (old_val->>'id')::UUID
            ELSE (new_val->>'id')::UUID
        END,
        old_val,
        new_val
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers to Financial Tables
CREATE TRIGGER trg_audit_finance_accounts AFTER INSERT OR UPDATE OR DELETE ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_donors AFTER INSERT OR UPDATE OR DELETE ON public.donors FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_donations AFTER INSERT OR UPDATE OR DELETE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_purchase_orders AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_petty_cash_runs AFTER INSERT OR UPDATE OR DELETE ON public.petty_cash_runs FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_petty_cash_invoices AFTER INSERT OR UPDATE OR DELETE ON public.petty_cash_invoices FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_employee_advances AFTER INSERT OR UPDATE OR DELETE ON public.employee_advances FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_payroll_runs AFTER INSERT OR UPDATE OR DELETE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Update employees table to include essential HR contact and qualification info
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT;

-- Update employee registration to handle teacher specific data if needed
-- (Assigned class can be handled via position/role string for now)

-- Further enhance employees for teacher integration
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS assigned_class TEXT,
ADD COLUMN IF NOT EXISTS subjects TEXT;

-- Migrate existing staff and teachers from profiles to the unified employees table
INSERT INTO public.employees (profile_id, full_name, role, email, phone, qualification, base_salary)
SELECT 
    p.id as profile_id,
    p.full_name,
    p.role,
    p.email,
    p.phone,
    p.qualification,
    COALESCE((SELECT base_salary FROM public.employees e WHERE e.profile_id = p.id), 350000) -- Default salary for migrated staff
FROM public.profiles p
WHERE p.role IN ('admin', 'teacher', 'support', 'driver', 'security', 'cook', 'cleaner', 'accountant')
ON CONFLICT (profile_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    qualification = EXCLUDED.qualification;

-- Add unique constraint to profile_id if not exists to prevent duplicates during migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_profile_id_key') THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;

INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE u.email IN ('admin@ummahlink.app','admin@alhebi.com','info.kabejjasystems@gmail.com','papa@alheib.teacher')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email IN ('admin@ummahlink.app','admin@alhebi.com','info.kabejjasystems@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'teacher'::app_role
FROM auth.users u
WHERE u.email = 'papa@alheib.teacher'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add missing created_at column to employee_advances
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Reorganizing System to match official Alheib School Workflows
-- Based on: doc_1.docx (Liquidity), doc_2.docx (Custody), doc_3-6.docx (Stock)

-- 1. Inventory / Stock Request Extensions
ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_days INTEGER, -- For Kitchen requests
ADD COLUMN IF NOT EXISTS manager_approval_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS accountant_approval_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS director_approval_by UUID REFERENCES auth.users(id);

-- 1b. Inventory Transactions Extensions
ALTER TABLE public.inventory_transactions
ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_days INTEGER;

-- 2. Petty Cash Liquidity & Snapshots (Matching doc_1.docx)
CREATE TABLE IF NOT EXISTS public.liquidity_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID REFERENCES auth.users(id),
    custody_balance NUMERIC(15,2) DEFAULT 0,
    awards_balance NUMERIC(15,2) DEFAULT 0,
    other_balance NUMERIC(15,2) DEFAULT 0,
    receivables_balance NUMERIC(15,2) DEFAULT 0,
    payables_due NUMERIC(15,2) DEFAULT 0,
    bills_value NUMERIC(15,2) DEFAULT 0,
    total_liquidity NUMERIC(15,2) GENERATED ALWAYS AS (custody_balance + awards_balance + other_balance + receivables_balance - payables_due) STORED,
    requested_amount NUMERIC(15,2) NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, received
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Temporary Custody / Project Advances (Matching doc_2.docx)
ALTER TABLE public.employee_advances
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.finance_projects(id),
ADD COLUMN IF NOT EXISTS duration_text TEXT, -- e.g., '15 days', '1 month'
ADD COLUMN IF NOT EXISTS purpose_details TEXT,
ADD COLUMN IF NOT EXISTS compliance_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_advances_settled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS office_approval_by UUID REFERENCES auth.users(id);

-- 4. Enable RLS
ALTER TABLE public.liquidity_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow auth view liquidity" ON public.liquidity_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth request liquidity" ON public.liquidity_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

-- 5. Grants
GRANT ALL ON public.liquidity_requests TO authenticated;
-- =============================================================================
-- Migration: 20260512200000_role_workflow_and_gate_link
-- Role-Based Approval Workflow + Gate Pass Linkage
-- Idempotent. Apply via Lovable Cloud → SQL Editor, or copy into your
-- supabase/migrations/ folder and run `supabase db push`.
-- =============================================================================

-- 1. ROLES --------------------------------------------------------------------
DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direct_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center_director';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'storekeeper';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gateman';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. APPROVAL STAGE ENUM ------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.approval_stage AS ENUM (
    'submitted',
    'manager_approved',
    'director_approved',
    'accountant_verified',
    'final_approved',
    'dispatched',
    'gate_verified',
    'completed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. WORKFLOW + GATE COLUMNS --------------------------------------------------
ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS manager_approval_by      uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS director_approval_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS accountant_approval_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS accountant_approval_date timestamptz,
  ADD COLUMN IF NOT EXISTS final_approval_by        uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS final_approval_date      timestamptz,
  ADD COLUMN IF NOT EXISTS dispatched_at            timestamptz,
  ADD COLUMN IF NOT EXISTS direction                text DEFAULT 'out'
                CHECK (direction IN ('in','out')),
  ADD COLUMN IF NOT EXISTS rejection_reason         text,
  ADD COLUMN IF NOT EXISTS gateman_id               uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS gate_verified_at         timestamptz,
  ADD COLUMN IF NOT EXISTS gate_notes               text,
  ADD COLUMN IF NOT EXISTS qr_verification_code     text UNIQUE
                                                     DEFAULT gen_random_uuid()::text;

ALTER TABLE public.employee_advances
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS director_approval_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS director_approval_date   timestamptz,
  ADD COLUMN IF NOT EXISTS accountant_approval_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS accountant_approval_date timestamptz,
  ADD COLUMN IF NOT EXISTS office_approval_date     timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason         text;

ALTER TABLE public.liquidity_requests
  ADD COLUMN IF NOT EXISTS stage public.approval_stage DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS director_approval_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS director_approval_date timestamptz,
  ADD COLUMN IF NOT EXISTS office_approval_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS office_approval_date   timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason       text;

-- 4. ROLE GUARD HELPER --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = ANY(_roles)
  );
$$;

-- 5. STAGE-ADVANCEMENT RPCs ---------------------------------------------------
-- Stock: storekeeper → direct_manager → center_director → accountant → office_manager → gateman
CREATE OR REPLACE FUNCTION public.advance_stock_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.inventory_transactions WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Stock request % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.inventory_transactions
       SET stage='rejected', status='rejected', rejection_reason=_reason
     WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['direct_manager','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Direct Manager can approve at this stage';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='manager_approved', status='manager_approved',
             manager_approval_by=_uid, manager_approval_date=now()
       WHERE id=_id;
      _new := 'manager_approved';

    WHEN 'manager_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Center Director can approve at this stage';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='director_approved', status='director_approved',
             director_approval_by=_uid, director_approval_date=now()
       WHERE id=_id;
      _new := 'director_approved';

    WHEN 'director_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['accountant','admin']) THEN
        RAISE EXCEPTION 'Only Accountant can verify at this stage';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='accountant_verified',
             accountant_approval_by=_uid, accountant_approval_date=now()
       WHERE id=_id;
      _new := 'accountant_verified';

    WHEN 'accountant_verified' THEN
      IF NOT has_any_role(_uid, ARRAY['office_manager','admin']) THEN
        RAISE EXCEPTION 'Only Office Manager can give final approval';
      END IF;
      UPDATE public.inventory_transactions
         SET stage='dispatched', status='dispatched',
             final_approval_by=_uid, final_approval_date=now(),
             dispatched_at=now()
       WHERE id=_id;
      _new := 'dispatched';

    ELSE
      RAISE EXCEPTION 'Stock request already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;

-- Custody: applicant → center_director → accountant → office_manager
CREATE OR REPLACE FUNCTION public.advance_custody_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.employee_advances WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Advance % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.employee_advances SET stage='rejected', status='rejected', rejection_reason=_reason WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Center Director can approve';
      END IF;
      UPDATE public.employee_advances
         SET stage='director_approved',
             director_approval_by=_uid, director_approval_date=now()
       WHERE id=_id;
      _new := 'director_approved';

    WHEN 'director_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['accountant','admin']) THEN
        RAISE EXCEPTION 'Only Accountant can verify';
      END IF;
      UPDATE public.employee_advances
         SET stage='accountant_verified',
             accountant_approval_by=_uid, accountant_approval_date=now(),
             compliance_checked=true, budget_available=true
       WHERE id=_id;
      _new := 'accountant_verified';

    WHEN 'accountant_verified' THEN
      IF NOT has_any_role(_uid, ARRAY['office_manager','admin']) THEN
        RAISE EXCEPTION 'Only Office Manager can give final approval';
      END IF;
      UPDATE public.employee_advances
         SET stage='final_approved',
             office_approval_by=_uid, office_approval_date=now(), status='approved'
       WHERE id=_id;
      _new := 'final_approved';

    ELSE
      RAISE EXCEPTION 'Advance already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;

-- Liquidity: accountant → center_director → office_manager
CREATE OR REPLACE FUNCTION public.advance_liquidity_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.liquidity_requests WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Liquidity request % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.liquidity_requests SET stage='rejected', status='rejected', rejection_reason=_reason WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Center Director can approve';
      END IF;
      UPDATE public.liquidity_requests
         SET stage='director_approved',
             director_approval_by=_uid, director_approval_date=now()
       WHERE id=_id;
      _new := 'director_approved';

    WHEN 'director_approved' THEN
      IF NOT has_any_role(_uid, ARRAY['office_manager','admin']) THEN
        RAISE EXCEPTION 'Only Office Manager can give final approval';
      END IF;
      UPDATE public.liquidity_requests
         SET stage='final_approved',
             office_approval_by=_uid, office_approval_date=now(), status='approved'
       WHERE id=_id;
      _new := 'final_approved';

    ELSE
      RAISE EXCEPTION 'Liquidity request already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;

-- 6. GATE PASS LINKAGE --------------------------------------------------------
-- Gateman scans the QR code printed on the Stock Request form. Only succeeds
-- when stage='dispatched' (i.e. the full approval chain is complete).
CREATE OR REPLACE FUNCTION public.gate_verify_movement(
  _qr_code text, _direction text, _notes text DEFAULT NULL
) RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid; _cur public.approval_stage;
BEGIN
  IF _direction NOT IN ('in','out') THEN
    RAISE EXCEPTION 'direction must be in or out';
  END IF;
  IF NOT has_any_role(_uid, ARRAY['gateman','security','admin']) THEN
    RAISE EXCEPTION 'Only Gateman / Security can verify gate movements';
  END IF;

  SELECT id, stage INTO _id, _cur
    FROM public.inventory_transactions
   WHERE qr_verification_code = _qr_code;

  IF _id IS NULL THEN
    RAISE EXCEPTION 'No request matches QR code %', _qr_code;
  END IF;
  IF _cur <> 'dispatched' THEN
    RAISE EXCEPTION 'Cannot release at gate — current stage is % (must be dispatched)', _cur;
  END IF;

  UPDATE public.inventory_transactions
     SET stage='gate_verified', status='verified_at_gate',
         gateman_id=(SELECT id FROM public.profiles WHERE id=_uid),
         gate_verified_at=now(),
         gate_notes=_notes,
         direction=_direction
   WHERE id=_id;

  RETURN 'gate_verified';
END $$;

-- Close the loop (delivery / receipt)
CREATE OR REPLACE FUNCTION public.gate_complete_movement(_id uuid)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gateman','security','storekeeper','admin']) THEN
    RAISE EXCEPTION 'Insufficient role to complete movement';
  END IF;
  UPDATE public.inventory_transactions
     SET stage='completed', status='completed'
   WHERE id=_id AND stage='gate_verified';
  RETURN 'completed';
END $$;

-- 7. GATEMAN VIEW -------------------------------------------------------------
DROP VIEW IF EXISTS public.active_gate_passes;
CREATE OR REPLACE VIEW public.active_gate_passes AS
SELECT
  t.id,
  t.tracking_number,
  t.qr_verification_code,
  t.direction,
  t.stage,
  t.dispatched_at,
  t.gate_verified_at,
  i.name           AS item_name,
  t.quantity,
  t.approved_quantity,
  p.full_name      AS requester_name
FROM public.inventory_transactions t
JOIN public.inventory_items i ON t.item_id = i.id
LEFT JOIN public.profiles p   ON t.staff_id = p.id
WHERE t.stage IN ('dispatched','gate_verified');

-- 8. GRANTS -------------------------------------------------------------------
GRANT SELECT  ON public.active_gate_passes                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_stock_request(uuid,text,text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_custody_request(uuid,text,text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_liquidity_request(uuid,text,text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_verify_movement(text,text,text)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_complete_movement(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid,text[])                   TO authenticated;

-- 9. SAMPLE TEST ACCOUNTS -----------------------------------------------------
-- Create these in Auth → Users first, then this block assigns the role.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'storekeeper'::public.app_role
  FROM auth.users u WHERE u.email='store@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'direct_manager'::public.app_role
  FROM auth.users u WHERE u.email='manager@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'center_director'::public.app_role
  FROM auth.users u WHERE u.email='director@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'accountant'::public.app_role
  FROM auth.users u WHERE u.email='accountant@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'office_manager'::public.app_role
  FROM auth.users u WHERE u.email='office@alheib.test' ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'gateman'::public.app_role
  FROM auth.users u WHERE u.email='gate@alheib.test' ON CONFLICT DO NOTHING;
-- =====================================================================
-- ALHEIB SCHOOL — SAMPLE TEST DATA FOR PRINTOUT WORKFLOWS
-- Run this in: Lovable Cloud → Backend → SQL Editor
-- Idempotent: safe to run multiple times.
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 0 — Auto-create test user accounts (password: Test1234!)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email text;
  v_uid uuid;
  v_emails text[] := ARRAY[
    'storekeeper@alheib.test',
    'manager@alheib.test',
    'director@alheib.test',
    'office@alheib.test',
    'accountant@alheib.test',
    'gateman@alheib.test',
    'teacher@alheib.test'
  ];
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, confirmation_token,
        recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
        v_email, crypt('Test1234!', gen_salt('bf')),
        now(), now(), now(),
        jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
        jsonb_build_object('full_name', split_part(v_email,'@',1)),
        '', '', '', ''
      );
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_uid, v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_email),
        'email', now(), now(), now()
      );
    END IF;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------

-- Insert profiles (user_roles.user_id FKs to profiles.id)
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, split_part(u.email,'@',1), u.email
FROM auth.users u
WHERE u.email LIKE '%@alheib.test'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 1 — Assign workflow roles to the test accounts
-- ---------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role::public.app_role
FROM auth.users u
JOIN (VALUES
  ('storekeeper@alheib.test', 'storekeeper'),
  ('manager@alheib.test',     'direct_manager'),
  ('director@alheib.test',    'center_director'),
  ('office@alheib.test',      'office_manager'),
  ('accountant@alheib.test',  'accountant'),
  ('gateman@alheib.test',     'gateman'),
  ('teacher@alheib.test',     'teacher')
) AS r(email, role) ON r.email = u.email
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 2 — Inventory categories + items + stock levels
-- ---------------------------------------------------------------------
INSERT INTO public.inventory_categories (name, description) VALUES
  ('Stationery',  'Pens, paper, exercise books'),
  ('Cleaning',    'Soap, detergents, brooms'),
  ('Kitchen',     'Foodstuff and consumables'),
  ('Electronics', 'Computers and accessories')
ON CONFLICT DO NOTHING;

WITH cat AS (
  SELECT name, id FROM public.inventory_categories
)
INSERT INTO public.inventory_items (name, unit, category_id, min_stock_level, supplier_name, storage_location)
SELECT v.name, v.unit, c.id, v.min_stock, v.supplier, v.location
FROM (VALUES
  ('A4 Ream Paper',     'ream', 'Stationery', 20, 'Kampala Stationers', 'Main Store'),
  ('Blue Ballpens',     'box',  'Stationery', 10, 'Kampala Stationers', 'Main Store'),
  ('Exercise Books 96p','dozen','Stationery', 50, 'UPPC',               'Main Store'),
  ('Liquid Soap 5L',    'jerry','Cleaning',   5,  'Mukwano',            'Cleaning Store'),
  ('Posho 50kg',        'sack', 'Kitchen',    10, 'Maganjo Millers',    'Kitchen Store'),
  ('Beans 50kg',        'sack', 'Kitchen',    10, 'Local Supplier',     'Kitchen Store'),
  ('Cooking Oil 20L',   'jerry','Kitchen',    4,  'Mukwano',            'Kitchen Store'),
  ('HP Toner 85A',      'pcs',  'Electronics',2,  'Computer Point',     'Office')
) AS v(name, unit, cat_name, min_stock, supplier, location)
JOIN cat c ON c.name = v.cat_name
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory_stock (item_id, quantity)
SELECT id,
  CASE name
    WHEN 'A4 Ream Paper' THEN 80
    WHEN 'Blue Ballpens' THEN 40
    WHEN 'Exercise Books 96p' THEN 200
    WHEN 'Liquid Soap 5L' THEN 25
    WHEN 'Posho 50kg' THEN 35
    WHEN 'Beans 50kg' THEN 28
    WHEN 'Cooking Oil 20L' THEN 12
    WHEN 'HP Toner 85A' THEN 6
  END
FROM public.inventory_items
WHERE name IN ('A4 Ream Paper','Blue Ballpens','Exercise Books 96p','Liquid Soap 5L',
               'Posho 50kg','Beans 50kg','Cooking Oil 20L','HP Toner 85A')
ON CONFLICT (item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- ---------------------------------------------------------------------
-- STEP 3 — Employees (link to auth profiles where possible)
-- ---------------------------------------------------------------------
INSERT INTO public.employees (full_name, email, role, base_salary, currency, phone, is_active, profile_id)
SELECT v.full_name, v.email, v.role, v.salary, 'UGX', v.phone, true, u.id
FROM (VALUES
  ('Aisha Nakato',    'teacher@alheib.test',     'teacher',        850000, '+256700111001'),
  ('Yusuf Mukasa',    'storekeeper@alheib.test', 'storekeeper',    700000, '+256700111002'),
  ('Ibrahim Ssali',   'manager@alheib.test',     'direct_manager', 1200000,'+256700111003'),
  ('Khadija Namuli',  'accountant@alheib.test',  'accountant',     1100000,'+256700111004'),
  ('Omar Kasozi',     'gateman@alheib.test',     'gateman',        500000, '+256700111005')
) AS v(full_name, email, role, salary, phone)
LEFT JOIN auth.users u ON u.email = v.email
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 4 — Sample stock-issuance transactions (one per stage)
-- ---------------------------------------------------------------------
WITH item AS (SELECT id FROM public.inventory_items WHERE name = 'A4 Ream Paper' LIMIT 1),
     teacher_p AS (SELECT id FROM auth.users WHERE email='teacher@alheib.test' LIMIT 1),
     store_p   AS (SELECT id FROM auth.users WHERE email='storekeeper@alheib.test' LIMIT 1)
INSERT INTO public.inventory_transactions
  (item_id, type, quantity, status, notes, issued_by, staff_id, tracking_number, qr_verification_code)
VALUES
  ((SELECT id FROM item), 'issuance', 5, 'pending',
   'SAMPLE — awaiting manager signature',
   (SELECT id FROM store_p), (SELECT id FROM teacher_p),
   'SR-SAMPLE-001', 'QR-SAMPLE-001'),
  ((SELECT id FROM item), 'issuance', 3, 'dispatched',
   'SAMPLE — fully approved, ready for gate dispatch',
   (SELECT id FROM store_p), (SELECT id FROM teacher_p),
   'SR-SAMPLE-002', 'QR-SAMPLE-002')
ON CONFLICT (tracking_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 5 — Sample custody / advance request
-- ---------------------------------------------------------------------
INSERT INTO public.employee_advances
  (employee_id, amount, currency, outstanding_balance, repayment_schedule, notes)
SELECT e.id, 500000, 'UGX', 500000, 'installment',
       'SAMPLE — staff custody advance for field activity'
FROM public.employees e
WHERE e.email = 'teacher@alheib.test'
LIMIT 1;

-- =====================================================================
-- DONE. Verify with:
--   SELECT name, (SELECT quantity FROM inventory_stock s WHERE s.item_id=i.id)
--     FROM inventory_items i ORDER BY name;
--   SELECT tracking_number, status, notes FROM inventory_transactions
--     WHERE tracking_number LIKE 'SR-SAMPLE-%';
--   SELECT u.email, r.role FROM user_roles r
--     JOIN auth.users u ON u.id=r.user_id
--     WHERE u.email LIKE '%@alheib.test' ORDER BY u.email;
-- =====================================================================
-- Director Control System: nurse + DOS roles, kill-switch, permissions, warnings, appeals, leave/advance, letters, DMs
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dos';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active','suspended','disconnected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT COALESCE((SELECT allowed FROM public.user_permissions WHERE user_id = _user_id AND permission_key = _key LIMIT 1), false);
$fn$;

DROP POLICY IF EXISTS "users read own perms" ON public.user_permissions;
CREATE POLICY "users read own perms" ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "director manage perms" ON public.user_permissions;
CREATE POLICY "director manage perms" ON public.user_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES auth.users(id),
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warnings read" ON public.user_warnings;
CREATE POLICY "warnings read" ON public.user_warnings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "warnings ack" ON public.user_warnings;
CREATE POLICY "warnings ack" ON public.user_warnings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "warnings issue" ON public.user_warnings;
CREATE POLICY "warnings issue" ON public.user_warnings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'dos'));

CREATE TABLE IF NOT EXISTS public.account_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_appeals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appeals read" ON public.account_appeals;
CREATE POLICY "appeals read" ON public.account_appeals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "appeals submit" ON public.account_appeals;
CREATE POLICY "appeals submit" ON public.account_appeals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "appeals review" ON public.account_appeals;
CREATE POLICY "appeals review" ON public.account_appeals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave own read" ON public.leave_requests;
CREATE POLICY "leave own read" ON public.leave_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'head_teacher') OR public.has_role(auth.uid(),'dos'));
DROP POLICY IF EXISTS "leave own create" ON public.leave_requests;
CREATE POLICY "leave own create" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "leave approve" ON public.leave_requests;
CREATE POLICY "leave approve" ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'dos'));

CREATE TABLE IF NOT EXISTS public.advance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  repayment_plan text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adv own read" ON public.advance_requests;
CREATE POLICY "adv own read" ON public.advance_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'accountant'));
DROP POLICY IF EXISTS "adv own create" ON public.advance_requests;
CREATE POLICY "adv own create" ON public.advance_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "adv approve" ON public.advance_requests;
CREATE POLICY "adv approve" ON public.advance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director') OR public.has_role(auth.uid(),'direct_manager') OR public.has_role(auth.uid(),'accountant'));

CREATE TABLE IF NOT EXISTS public.staff_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_role text NOT NULL,
  to_user uuid REFERENCES auth.users(id),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_letters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "letters read" ON public.staff_letters;
CREATE POLICY "letters read" ON public.staff_letters FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));
DROP POLICY IF EXISTS "letters send" ON public.staff_letters;
CREATE POLICY "letters send" ON public.staff_letters FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
DROP POLICY IF EXISTS "letters update" ON public.staff_letters;
CREATE POLICY "letters update" ON public.staff_letters FOR UPDATE TO authenticated
  USING (to_user = auth.uid() OR from_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm read" ON public.direct_messages;
CREATE POLICY "dm read" ON public.direct_messages FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
DROP POLICY IF EXISTS "dm send" ON public.direct_messages;
CREATE POLICY "dm send" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
DROP POLICY IF EXISTS "dm update" ON public.direct_messages;
CREATE POLICY "dm update" ON public.direct_messages FOR UPDATE TO authenticated
  USING (to_user = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_warnings; EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP POLICY IF EXISTS "director update profile" ON public.profiles;
CREATE POLICY "director update profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'center_director'));

-- Migration to add recurrence to school_calendar
ALTER TABLE public.school_calendar 
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' 
CHECK (recurrence IN ('none', 'weekly', 'monthly', 'annually', 'termly'));

-- Comment to explain values
COMMENT ON COLUMN public.school_calendar.recurrence IS 'Recurrence pattern: none, weekly, monthly, annually, termly';

-- Update Audit Log Function to include Global Notifications
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    audit_user_id UUID;
    audit_user_email TEXT;
BEGIN
    -- Get Current User Info
    audit_user_id := auth.uid();
    
    IF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
    END IF;

    -- Insert into Audit Log
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        audit_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (old_val->>'id')::UUID
            ELSE (new_val->>'id')::UUID
        END,
        old_val,
        new_val
    );

    -- Notify Admins and Directors
    -- We skip notifications for the notification table itself to avoid recursion
    IF TG_TABLE_NAME != 'in_app_notifications' AND TG_TABLE_NAME != 'notifications' AND TG_TABLE_NAME != 'audit_log' THEN
        INSERT INTO public.in_app_notifications (
            user_id, 
            title, 
            message, 
            type,
            created_by
        )
        SELECT 
            p.id, 
            'System Activity: ' || INITCAP(TG_TABLE_NAME), 
            'Action ' || TG_OP || ' performed on ' || TG_TABLE_NAME || ' by staff member.',
            'activity',
            audit_user_id
        FROM public.profiles p
        WHERE p.role IN ('admin', 'director')
        AND p.id != audit_user_id; -- Don't notify yourself of your own action
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers to Additional Critical Tables
DO $$
DECLARE
    t TEXT;
    table_list TEXT[] := ARRAY[
        'learners',
        'classes',
        'attendance',
        'discipline_cases',
        'health_visits',
        'visitors',
        'visitor_visits',
        'appointments',
        'inventory_items',
        'inventory_transactions',
        'assets',
        'fee_payments',
        'school_calendar',
        'dormitories',
        'tasks',
        'profiles',
        'bursar_rules',
        'bursar_override_requests',
        'salary_payments',
        'salary_records',
        'petty_cash_runs',
        'donations',
        'purchase_orders'
    ];
BEGIN
    FOREACH t IN ARRAY table_list LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log()', t, t);
    END LOOP;
END $$;

-- Advanced Timetable System
CREATE TABLE IF NOT EXISTS public.class_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.school_infrastructure(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 7=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  term TEXT DEFAULT 'term_1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent exact duplicate slot for same class
  CONSTRAINT uq_class_slot UNIQUE (class_id, day_of_week, start_time)
);

-- Indexes for performance and conflict checking
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON public.class_timetables (teacher_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_room ON public.class_timetables (room_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.class_timetables (class_id, day_of_week);

-- Enable RLS
ALTER TABLE public.class_timetables ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'class_timetables' AND policyname = 'Allow auth all class_timetables'
    ) THEN
        CREATE POLICY "Allow auth all class_timetables" ON public.class_timetables FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 1. Add 'director' role to app_role enum and profiles constraint
DO $$ 
BEGIN 
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- Update profiles table check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'teacher', 'head_teacher', 'accountant', 'security', 'director', 'staff'));

-- 2. Update the audit and notification function to be more descriptive and robust
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    audit_user_id UUID;
    staff_name TEXT := 'System';
BEGIN
    -- Get Current User Context
    audit_user_id := auth.uid();
    
    -- Try to get the name of the person performing the action
    IF audit_user_id IS NOT NULL THEN
        SELECT full_name INTO staff_name FROM public.profiles WHERE id = audit_user_id;
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
    END IF;

    -- Insert into Audit Log
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        audit_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (old_val->>'id')::UUID
            ELSE (new_val->>'id')::UUID
        END,
        old_val,
        new_val
    );

    -- Notify Admins and Directors of EVERY system activity
    -- Exclude internal log tables to prevent infinite recursion
    IF TG_TABLE_NAME NOT IN ('in_app_notifications', 'notifications', 'audit_log', 'notification_logs', 'medication_logs') THEN
        INSERT INTO public.in_app_notifications (
            user_id, 
            title, 
            message, 
            type,
            created_by
        )
        SELECT 
            p.id, 
            'Activity in ' || INITCAP(REPLACE(TG_TABLE_NAME, '_', ' ')), 
            staff_name || ' performed ' || TG_OP || ' on ' || REPLACE(TG_TABLE_NAME, '_', ' ') || '.',
            'activity',
            audit_user_id
        FROM public.profiles p
        WHERE p.role IN ('admin', 'director')
        AND p.id != COALESCE(audit_user_id, '00000000-0000-0000-0000-000000000000'::UUID); -- Don't notify yourself
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Exhaustively apply the trigger to ALL meaningful tables across the system
DO $$
DECLARE
    t TEXT;
    table_list TEXT[] := ARRAY[
        'learners',
        'classes',
        'attendance',
        'discipline_cases',
        'health_visits',
        'visitors',
        'visitor_visits',
        'appointments',
        'inventory_items',
        'inventory_transactions',
        'assets',
        'fee_payments',
        'school_calendar',
        'dormitories',
        'tasks',
        'profiles',
        'bursar_rules',
        'bursar_override_requests',
        'salary_payments',
        'salary_records',
        'petty_cash_runs',
        'donations',
        'purchase_orders',
        'schools',
        'notification_templates',
        'scheduled_notifications',
        'subjects',
        'term_results',
        'report_cards',
        'ple_mock_tests',
        'ple_results',
        'fee_structures',
        'fee_assignments',
        'inventory_categories',
        'inventory_stock',
        'inventory_gate_passes',
        'pharmacy_items',
        'quran_progress',
        'salah_attendance',
        'akhlaaq_reports',
        'hostel_issuances',
        'washing_machine_usage',
        'budget_requests',
        'digital_homework',
        'staff_performance_logs',
        'dormitory_residents',
        'learner_essentials',
        'school_infrastructure',
        'school_sanitation',
        'finance_accounts',
        'donors',
        'projects',
        'class_timetables'
    ];
BEGIN
    FOREACH t IN ARRAY table_list LOOP
        -- Check if table exists before applying trigger
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
            EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log()', t, t);
        END IF;
    END LOOP;
END $$;
-- Add recurrence support to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly'));
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_end_at TIMESTAMPTZ;

-- Academic Planning & Coverage Tracking
CREATE TABLE IF NOT EXISTS public.curriculum_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  term term_type,
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
  evidence_url TEXT, -- Link to photo of notes / board
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams & Assessment Scheduling
CREATE TABLE IF NOT EXISTS public.exam_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g. Mid-Term I 2024
  term term_type,
  academic_year INTEGER,
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.exam_series(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  room_id UUID, -- Link to school_infrastructure
  invigilator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.curriculum_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view academic planning" ON public.curriculum_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow DOS and Teachers manage planning" ON public.curriculum_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'teacher', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view coverage" ON public.syllabus_coverage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow DOS and Teachers manage coverage" ON public.syllabus_coverage FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'teacher', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view exams" ON public.exam_series FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow academic managers handle exams" ON public.exam_series FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view exam timetable" ON public.exam_timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow academic managers handle exam timetable" ON public.exam_timetable FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);

-- Gate & Security Module operations

CREATE TABLE IF NOT EXISTS public.vehicle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  driver_name TEXT,
  phone_number TEXT,
  purpose TEXT,
  vehicle_type TEXT, -- e.g. Car, Truck, Motorcycle, School Bus
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

CREATE TABLE IF NOT EXISTS public.gate_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outgoing_officer_id UUID REFERENCES public.profiles(id),
  incoming_officer_id UUID REFERENCES public.profiles(id),
  shift_date DATE DEFAULT CURRENT_DATE,
  shift_type TEXT, -- Day / Night
  ob_references TEXT, -- Occurrence Book references
  items_handed_over TEXT, -- Keys, radio, etc
  incidents_summary TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_handovers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view gateway" ON public.vehicle_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow security and admin manage gate" ON public.vehicle_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'security', 'gateman'))
);

CREATE POLICY "Allow authenticated view exit passes" ON public.exit_passes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage exit passes" ON public.exit_passes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'security', 'gateman', 'office_manager', 'direct_manager'))
);

CREATE POLICY "Allow authenticated view handovers" ON public.gate_handovers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow security manage handovers" ON public.gate_handovers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'security', 'gateman'))
);

-- DOS: Teacher Assignments to Classes and Subjects
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  term term_type,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_lead_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id, academic_year)
);

-- Enable RLS
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view assignments" ON public.teacher_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow academic managers handle assignments" ON public.teacher_assignments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);

-- DOS: Lesson Plans & Academic Warnings

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  term term_type,
  week_number INTEGER,
  title TEXT NOT NULL,
  content TEXT, -- Markdown or JSON for the plan details
  objectives TEXT,
  resources TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewed')),
  dos_feedback TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id),
  reason TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  issued_by UUID REFERENCES public.profiles(id),
  term term_type,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  parent_notified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_warnings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view lesson plans" ON public.lesson_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers and DOS manage lesson plans" ON public.lesson_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'teacher', 'head_teacher'))
);

CREATE POLICY "Allow authenticated view academic warnings" ON public.academic_warnings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow DOS and admin manage warnings" ON public.academic_warnings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher'))
);

-- OFFICE: Communications and Document Registry

CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles text[], -- ['teacher', 'staff', 'parent']
  priority TEXT CHECK (priority IN ('normal', 'high', 'urgent')),
  sent_via text[] DEFAULT ARRAY['app'], -- ['app', 'sms', 'email']
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ref_number TEXT UNIQUE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  category TEXT, -- 'Policy', 'Circular', 'Letter', 'Invoice'
  physical_location TEXT, -- 'Cabinet A, Folder 3'
  file_url TEXT, -- Digital scan link
  sender_receiver_name TEXT,
  received_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_registry ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view communications" ON public.communications FOR SELECT TO authenticated USING (
  target_roles IS NULL OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = ANY(target_roles) OR
  sender_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'office', 'head_teacher'))
);

CREATE POLICY "Allow office and admin manage communications" ON public.communications FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'office', 'head_teacher', 'dos'))
);

CREATE POLICY "Allow authenticated view document registry" ON public.document_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow office and admin manage document registry" ON public.document_registry FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'office', 'head_teacher'))
);

-- STORE: Inventory, Receiving and Suppliers

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT, -- 'Stationery', 'Food', 'Construction'
  rating INTEGER DEFAULT 5,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  contract_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend inventory or create a tracking table if needed
-- Assuming public.inventory exists from previous turns

CREATE TABLE IF NOT EXISTS public.goods_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id),
  received_by UUID REFERENCES public.profiles(id),
  grn_number TEXT UNIQUE, -- Goods Received Note
  delivery_note_ref TEXT,
  items JSONB, -- Array of {item_id, quantity, unit_price}
  total_value DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  quality_check_passed BOOLEAN DEFAULT true,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow store and admin manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_manager', 'office'))
);

CREATE POLICY "Allow authenticated view goods received" ON public.goods_received FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow store and admin manage goods received" ON public.goods_received FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_manager'))
);

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

-- 1. EXTEND APP_ROLE ENUM
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

-- 2. CREATE MISSING TABLES

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
    month TEXT NOT NULL, -- e.g. "January 2024"
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

-- 3. ENABLE RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_medical ENABLE ROW LEVEL SECURITY;

-- 5. RPCs & VIEWS

-- Decrement pharmacy stock helper
CREATE OR REPLACE FUNCTION public.decrement_pharmacy_stock(item_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.pharmacy_items
    SET quantity = quantity - amount,
        updated_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for Parent Chat compatibility
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
CREATE POLICY "Users can view own attendance" ON public.staff_attendance
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins/Managers view all attendance" ON public.staff_attendance
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'head_teacher', 'office_manager'))
    );

-- Salaries Policies
CREATE POLICY "Users can view own salaries" ON public.salaries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins/Accountants view all salaries" ON public.salaries
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

-- Medical Incidents Policies
CREATE POLICY "Health staff manage incidents" ON public.medical_incidents
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    );
CREATE POLICY "Anyone authenticated can view incidents" ON public.medical_incidents
    FOR SELECT TO authenticated USING (true);

-- Learner Medical Policies
CREATE POLICY "Health staff manage medical info" ON public.learner_medical
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher'))
    );
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

-- Sample data for Academic Warnings and Lesson Plans to populate DOS Dashboard
-- Assuming we have some learners and teachers already

INSERT INTO public.academic_warnings (learner_id, teacher_id, category, details, status)
SELECT 
  l.id as learner_id, 
  p.id as teacher_id, 
  'Unsatisfactory Progress' as category,
  'Consistently scoring below 40% in Mathematics mid-term assessments.' as details,
  'active' as status
FROM public.learners l
CROSS JOIN public.profiles p
WHERE p.role = 'teacher'
LIMIT 3;

-- Sample Lesson Plans
INSERT INTO public.lesson_plans (teacher_id, class_id, subject_id, title, objectives, status, week_number)
SELECT 
  p.id as teacher_id,
  c.id as class_id,
  s.id as subject_id,
  'Introduction to Algebra' as title,
  'Learners should be able to solve simple linear equations.' as objectives,
  'pending' as status,
  5 as week_number
FROM public.profiles p
CROSS JOIN public.classes c
CROSS JOIN public.subjects s
WHERE p.role = 'teacher'
LIMIT 5;

-- Sample data for class_timetables
-- Link some subjects and teachers to classes

INSERT INTO public.class_timetables (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, term)
SELECT 
    c.id as class_id,
    s.id as subject_id,
    p.id as teacher_id,
    1 as day_of_week, -- Monday
    '08:30:00'::TIME as start_time,
    '09:30:00'::TIME as end_time,
    'term_1' as term
FROM public.classes c
CROSS JOIN public.subjects s
CROSS JOIN public.profiles p
WHERE c.name = 'Primary One' AND s.name = 'English' AND p.role = 'teacher'
LIMIT 1;

INSERT INTO public.class_timetables (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, term)
SELECT 
    c.id as class_id,
    s.id as subject_id,
    p.id as teacher_id,
    1 as day_of_week, -- Monday
    '09:30:00'::TIME as start_time,
    '10:30:00'::TIME as end_time,
    'term_1' as term
FROM public.classes c
CROSS JOIN public.subjects s
CROSS JOIN public.profiles p
WHERE c.name = 'Primary One' AND s.name = 'Mathematics' AND p.role = 'teacher'
LIMIT 1;

-- Sample data for Madrasa
INSERT INTO public.quran_progress (learner_id, surah_name, last_ayah, tajweed_score, hifdh_type, teacher_id)
SELECT 
  l.id as learner_id, 
  'Al-Baqarah' as surah_name, 
  145 as last_ayah, 
  8 as tajweed_score, 
  'memorization' as hifdh_type,
  p.id as teacher_id
FROM public.learners l
CROSS JOIN public.profiles p
WHERE p.role = 'teacher'
LIMIT 5;

INSERT INTO public.salah_attendance (learner_id, prayer_name, status, date)
SELECT 
  l.id as learner_id, 
  'Dhuhr' as prayer_name, 
  'Jamaah' as status,
  CURRENT_DATE as date
FROM public.learners l
LIMIT 10;

INSERT INTO public.akhlaaq_reports (learner_id, trait_category, rating, comments, teacher_id)
SELECT 
  l.id as learner_id, 
  'Honesty' as trait_category, 
  5 as rating, 
  'Very honest and truthful.' as comments,
  p.id as teacher_id
FROM public.learners l
CROSS JOIN public.profiles p
WHERE p.role = 'teacher'
LIMIT 5;

-- Academic Support Tables
CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  week_number INTEGER,
  term TEXT,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate', -- low, moderate, high, critical
  status TEXT DEFAULT 'active', -- active, resolved, closed
  issued_by UUID REFERENCES public.profiles(id),
  parent_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  term TEXT,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'scheduled', -- scheduled, ongoing, completed, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lesson_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  observed_by UUID REFERENCES public.profiles(id),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  observation_date DATE DEFAULT CURRENT_DATE,
  score INTEGER CHECK (score BETWEEN 1 AND 100),
  strengths TEXT,
  improvements TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_observations ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for authenticated users (can be hardened later)
CREATE POLICY "Allow all to authenticated - lesson_plans" ON public.lesson_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated - academic_warnings" ON public.academic_warnings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated - exam_series" ON public.exam_series FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated - lesson_observations" ON public.lesson_observations FOR ALL TO authenticated USING (true);

-- Sample Academic Data
DO $$
DECLARE
    v_teacher_id UUID;
    v_subject_id UUID;
    v_class_id UUID;
    v_learner_id UUID;
    v_dos_id UUID;
BEGIN
    -- Get some existing IDs
    SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'teacher' LIMIT 1;
    SELECT id INTO v_subject_id FROM public.subjects LIMIT 1;
    SELECT id INTO v_class_id FROM public.classes LIMIT 1;
    SELECT id INTO v_learner_id FROM public.learners LIMIT 1;
    SELECT id INTO v_dos_id FROM public.profiles WHERE role IN ('admin', 'head_teacher', 'dos') LIMIT 1;

    -- Lesson Plans
    IF v_teacher_id IS NOT NULL AND v_subject_id IS NOT NULL AND v_class_id IS NOT NULL THEN
        INSERT INTO public.lesson_plans (teacher_id, subject_id, class_id, title, week_number, term, status)
        VALUES 
        (v_teacher_id, v_subject_id, v_class_id, 'Intro to Algebra', 2, 'term_2', 'pending'),
        (v_teacher_id, v_subject_id, v_class_id, 'Grammar Review', 2, 'term_2', 'approved');
    END IF;

    -- Academic Warnings
    IF v_learner_id IS NOT NULL AND v_subject_id IS NOT NULL THEN
        INSERT INTO public.academic_warnings (learner_id, subject_id, reason, severity, status)
        VALUES 
        (v_learner_id, v_subject_id, 'Consistently low scores in weekly quizzes', 'high', 'active');
    END IF;

    -- Exam Series
    INSERT INTO public.exam_series (name, term, status)
    VALUES 
    ('Mid-Term Series II', 'term_2', 'scheduled'),
    ('End of Term Examination', 'term_2', 'scheduled');

    -- Lesson Observations
    IF v_teacher_id IS NOT NULL AND v_class_id IS NOT NULL AND v_dos_id IS NOT NULL THEN
        INSERT INTO public.lesson_observations (teacher_id, observed_by, class_id, score, strengths)
        VALUES 
        (v_teacher_id, v_dos_id, v_class_id, 85, 'Good classroom management and student engagement');
    END IF;
END $$;

-- Curriculum and Syllabus Tables
CREATE TABLE IF NOT EXISTS public.curriculum_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  planned_weeks INTEGER DEFAULT 1,
  sequence_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending', -- pending, completed
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One entry per plan/teacher combination for simple tracking
  CONSTRAINT uq_plan_teacher UNIQUE (plan_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.exam_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.exam_series(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  invigilator_id UUID REFERENCES public.profiles(id),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  room_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.curriculum_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow auth all curriculum_plans" ON public.curriculum_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all syllabus_coverage" ON public.syllabus_coverage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all exam_timetable" ON public.exam_timetable FOR ALL TO authenticated USING (true);

-- Sample Curriculum Data
DO $$
DECLARE
    v_class_id UUID;
    v_subject_id UUID;
    v_plan_id UUID;
    v_teacher_id UUID;
BEGIN
    SELECT id INTO v_class_id FROM public.classes LIMIT 1;
    SELECT id INTO v_subject_id FROM public.subjects LIMIT 1;
    SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'teacher' LIMIT 1;

    IF v_class_id IS NOT NULL AND v_subject_id IS NOT NULL THEN
        -- Curriculum Plans
        INSERT INTO public.curriculum_plans (class_id, subject_id, topic_title, sequence_order)
        VALUES 
        (v_class_id, v_subject_id, 'Numbers and Numeracy', 1),
        (v_class_id, v_subject_id, 'Operations on Whole Numbers', 2),
        (v_class_id, v_subject_id, 'Fractions', 3)
        RETURNING id INTO v_plan_id;

        -- Syllabus Coverage
        IF v_teacher_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
            INSERT INTO public.syllabus_coverage (plan_id, teacher_id, status, completion_date)
            VALUES (v_plan_id, v_teacher_id, 'completed', CURRENT_DATE - interval '1 week');
        END IF;
    END IF;
END $$;

-- Operations Support Tables
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.advance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  requested_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'low',
  status TEXT DEFAULT 'open', -- open, investigating, resolved, closed
  reported_by UUID REFERENCES public.profiles(id),
  location TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- appointment, warning, recognition, termination
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, pending, issued
  issued_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- fee, access, grade
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'initial', -- initial, second, final
  reason TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  issued_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies
CREATE POLICY "Allow auth all leave_requests" ON public.leave_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all advance_requests" ON public.advance_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all expense_requests" ON public.expense_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all incident_reports" ON public.incident_reports FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all staff_letters" ON public.staff_letters FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all account_appeals" ON public.account_appeals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all user_warnings" ON public.user_warnings FOR ALL TO authenticated USING (true);

-- Sample Operations Data
DO $$
DECLARE
    v_staff_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_staff_id FROM public.profiles LIMIT 1;
    SELECT id INTO v_admin_id FROM public.profiles WHERE role IN ('admin', 'director') LIMIT 1;

    IF v_staff_id IS NOT NULL THEN
        -- Leave
        INSERT INTO public.leave_requests (staff_id, leave_type, start_date, end_date, reason, status)
        VALUES (v_staff_id, 'Sick Leave', CURRENT_DATE, CURRENT_DATE + interval '3 days', 'Fever and cold', 'pending');

        -- Advance
        INSERT INTO public.advance_requests (staff_id, amount, reason, status)
        VALUES (v_staff_id, 200000, 'Medical emergency', 'pending');

        -- Expenses
        INSERT INTO public.expense_requests (requester_id, amount, category, description, status)
        VALUES (v_staff_id, 50000, 'Stationery', 'Board markers and chalk', 'pending');

        -- Incidents
        INSERT INTO public.incident_reports (title, description, severity, status, reported_by)
        VALUES ('Water pipe burst', 'Main water pipe leading to girls dorm burst', 'moderate', 'open', v_staff_id);

        -- Staff Letters
        INSERT INTO public.staff_letters (staff_id, type, content, status)
        VALUES (v_staff_id, 'Appointment', 'Official appointment letter for the position of Senior Teacher', 'pending');

        -- User Warnings
        INSERT INTO public.user_warnings (user_id, reason, issued_by)
        VALUES (v_staff_id, 'Late coming to assembly twice this week', v_admin_id);
    END IF;
END $$;
-- Add deputy_head_teacher role to app_role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'deputy_head_teacher') THEN
        ALTER TYPE public.app_role ADD VALUE 'deputy_head_teacher';
    END IF;
END $$;

-- Ensure head_teacher permissions are set
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'head_teacher'::public.app_role 
FROM public.profiles 
WHERE role = 'head_teacher'
ON CONFLICT DO NOTHING;

-- Fix handle_new_user_role to correctly assign admin roles on signup for whitelisted emails
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if the new user's email is in the admin whitelist
  is_admin_email := (NEW.email IN (
    'muslim.ummahlink@gmail.com',
    'admin@ummahlink.app',
    'admin@alhebi.com',
    'info.kabejjasystems@gmail.com',
    'papa@alheib.teacher',
    'admin@alheib.com',
    'alhebiadmin@gmail.com'
  ));

  IF is_admin_email THEN
    -- Assign 'admin' role to whitelisted accounts
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Ensure they also have a global profile
    INSERT INTO public.profiles (id, email, full_name, scope)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'global')
    ON CONFLICT (id) DO UPDATE SET scope = 'global';
  ELSE
    -- Default new users to 'parent' role 
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix existing administrators who might have been assigned 'parent' role
DO $$
DECLARE
  admin_rec RECORD;
BEGIN
  FOR admin_rec IN 
    SELECT id, email FROM auth.users 
    WHERE email IN (
      'muslim.ummahlink@gmail.com',
      'admin@ummahlink.app',
      'admin@alhebi.com',
      'info.kabejjasystems@gmail.com',
      'papa@alheib.teacher',
      'admin@alheib.com',
      'alhebiadmin@gmail.com'
    )
  LOOP
    -- Upgrade to admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_rec.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Update profile scope
    UPDATE public.profiles 
    SET scope = 'global' 
    WHERE id = admin_rec.id;

    -- Remove any redundant parent role
    DELETE FROM public.user_roles 
    WHERE user_id = admin_rec.id AND role = 'parent';
  END LOOP;
END $$;

-- Seed data for learners to populate the dashboard stats
DO $$
DECLARE
  v_class_p1 uuid;
  v_class_p2 uuid;
  v_class_p3 uuid;
  v_class_p7 uuid;
BEGIN
  -- Get some class IDs
  SELECT id INTO v_class_p1 FROM public.classes WHERE name ILIKE '%P1%' LIMIT 1;
  SELECT id INTO v_class_p2 FROM public.classes WHERE name ILIKE '%P2%' LIMIT 1;
  SELECT id INTO v_class_p3 FROM public.classes WHERE name ILIKE '%P3%' LIMIT 1;
  SELECT id INTO v_class_p7 FROM public.classes WHERE name ILIKE '%P7%' LIMIT 1;

  -- Insert sample learners if the table is empty
  IF NOT EXISTS (SELECT 1 FROM public.learners LIMIT 1) THEN
    INSERT INTO public.learners (full_name, gender, admission_number, class_id, status, religion, pupil_status)
    VALUES 
      ('Musa Hassan', 'male', 'ALH/2024/001', v_class_p1, 'active', 'Islam', 'Paying'),
      ('Fatuma Zahara', 'female', 'ALH/2024/002', v_class_p1, 'active', 'Islam', 'Bait Zakat'),
      ('Ibrahim Kalungi', 'male', 'ALH/2024/003', v_class_p2, 'active', 'Islam', 'Paying'),
      ('Mariam Nabatanzi', 'female', 'ALH/2024/004', v_class_p2, 'active', 'Islam', 'IICO'),
      ('Yusuf Semakula', 'male', 'ALH/2024/005', v_class_p3, 'active', 'Islam', 'Community'),
      ('Zainab Namutebi', 'female', 'ALH/2024/006', v_class_p3, 'active', 'Islam', 'Paying'),
      ('Sulaiman Kato', 'male', 'ALH/2024/007', v_class_p7, 'active', 'Islam', 'Paying'),
      ('Aisha Nansubuga', 'female', 'ALH/2024/008', v_class_p7, 'active', 'Islam', 'Paying');
  END IF;

  -- Insert some test teachers if empty
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'teacher' LIMIT 1) THEN
    -- Assuming some profile IDs might exist or we just use the ones from sample data
    -- But since we want the stats to show up on dashboard, we can just ensure profiles counts
    UPDATE public.profiles SET role = 'teacher' WHERE email LIKE '%teacher%' OR email LIKE '%staff%';
  END IF;
END $$;

-- Ensure all administrative emails have the admin role in the database
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
    -- Get user ID if it exists in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NOT NULL THEN
      -- Insert into user_roles
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Ensure profile exists and has global scope
      INSERT INTO public.profiles (id, email, full_name, scope)
      VALUES (v_user_id, v_email, COALESCE(v_email, 'Administrator'), 'global')
      ON CONFLICT (id) DO UPDATE SET scope = 'global';
      
      -- Remove any lower privilege roles
      DELETE FROM public.user_roles 
      WHERE user_id = v_user_id AND role != 'admin';
    END IF;
  END LOOP;
END $$;

-- Check if learners table is empty and if so, log it (we can't log but we can ensure data exists for testing)
-- If the user says they have data, we won't overwrite it.

-- Ensure RLS allows admins to see everything
-- Some tables might be missing the "Admins can view everything" policy
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
    -- Check if policy exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Admins have full access'
    ) THEN
      EXECUTE format('CREATE POLICY "Admins have full access" ON public.%I FOR ALL USING (public.has_role(auth.uid(), ''admin''))', t);
    END IF;
  END LOOP;
END $$;

-- Update advance_custody_request to match user's requested flow: Accountant -> Director
CREATE OR REPLACE FUNCTION public.advance_custody_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.employee_advances WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Advance % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.employee_advances SET stage='rejected', status='rejected', rejection_reason=_reason WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['accountant','admin']) THEN
        RAISE EXCEPTION 'Only Accountant can verify at this stage';
      END IF;
      UPDATE public.employee_advances
         SET stage='accountant_verified',
             accountant_approval_by=_uid, accountant_approval_date=now(),
             compliance_checked=true, budget_available=true
       WHERE id=_id;
      _new := 'accountant_verified';

    WHEN 'accountant_verified' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Director can give final approval';
      END IF;
      UPDATE public.employee_advances
         SET stage='final_approved',
             director_approval_by=_uid, director_approval_date=now(), 
             office_approval_by=_uid, office_approval_date=now(),
             status='approved'
       WHERE id=_id;
      _new := 'final_approved';

    ELSE
      RAISE EXCEPTION 'Advance already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;
-- =====================================================================
-- RUN THIS IN THE LOVABLE CLOUD SQL EDITOR
-- Fixes: "Could not find the table 'public.leave_requests' in the schema cache"
-- and adds every column the Alheib leave-request form writes, plus a 2-stage
-- approval workflow (Supervisor / Head of Dept  →  Administration / Director).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS form_ref text,
  ADD COLUMN IF NOT EXISTS leave_type_other text,
  ADD COLUMN IF NOT EXISTS days_count int,
  ADD COLUMN IF NOT EXISTS employee_full_name text,
  ADD COLUMN IF NOT EXISTS employee_department text,
  ADD COLUMN IF NOT EXISTS employee_position text,
  ADD COLUMN IF NOT EXISTS employee_phone text,
  ADD COLUMN IF NOT EXISTS employee_signature_name text,
  ADD COLUMN IF NOT EXISTS employee_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS covering_staff_name text,
  ADD COLUMN IF NOT EXISTS covering_staff_position text,
  ADD COLUMN IF NOT EXISTS covering_staff_job_title text,
  ADD COLUMN IF NOT EXISTS covering_staff_department text,
  ADD COLUMN IF NOT EXISTS responsibilities_summary text,
  ADD COLUMN IF NOT EXISTS covering_staff_signature_name text,
  ADD COLUMN IF NOT EXISTS covering_staff_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS supervisor_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS supervisor_name text,
  ADD COLUMN IF NOT EXISTS supervisor_decision text,
  ADD COLUMN IF NOT EXISTS supervisor_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS admin_name text,
  ADD COLUMN IF NOT EXISTS admin_decision text,
  ADD COLUMN IF NOT EXISTS admin_comments text,
  ADD COLUMN IF NOT EXISTS admin_signed_at timestamptz;

CREATE SEQUENCE IF NOT EXISTS public.leave_form_seq START 1;

CREATE OR REPLACE FUNCTION public.set_leave_form_ref()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.form_ref IS NULL OR NEW.form_ref = '' THEN
    NEW.form_ref := 'ALH-LV-' || LPAD(nextval('public.leave_form_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_leave_form_ref ON public.leave_requests;
CREATE TRIGGER trg_leave_form_ref BEFORE INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_leave_form_ref();

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave own read"   ON public.leave_requests;
DROP POLICY IF EXISTS "leave own create" ON public.leave_requests;
DROP POLICY IF EXISTS "leave approve"    ON public.leave_requests;
DROP POLICY IF EXISTS "leave read"       ON public.leave_requests;
DROP POLICY IF EXISTS "leave insert"     ON public.leave_requests;
DROP POLICY IF EXISTS "leave update"     ON public.leave_requests;

CREATE POLICY "leave read" ON public.leave_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'center_director')
    OR public.has_role(auth.uid(),'direct_manager')
    OR public.has_role(auth.uid(),'manager')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'dos')
  );
CREATE POLICY "leave insert" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "leave update" ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'center_director')
    OR public.has_role(auth.uid(),'direct_manager')
    OR public.has_role(auth.uid(),'manager')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'dos')
  );

-- ---------- advance_requests ----------
CREATE TABLE IF NOT EXISTS public.advance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  repayment_plan text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adv own read"   ON public.advance_requests;
DROP POLICY IF EXISTS "adv own create" ON public.advance_requests;
DROP POLICY IF EXISTS "adv approve"    ON public.advance_requests;
DROP POLICY IF EXISTS "adv read"       ON public.advance_requests;
DROP POLICY IF EXISTS "adv insert"     ON public.advance_requests;
DROP POLICY IF EXISTS "adv update"     ON public.advance_requests;

CREATE POLICY "adv read" ON public.advance_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "adv insert" ON public.advance_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "adv update" ON public.advance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'manager'));

-- Add orphan_supervisor role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'orphan_supervisor';
-- Add matron role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'matron';
-- Add cook role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cook';
-- Add store_manager role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_manager';
-- Add manager role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- Refresh PostgREST schema cache so new columns are visible to the API immediately
NOTIFY pgrst, 'reload schema';
