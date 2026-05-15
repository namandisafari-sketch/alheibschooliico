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
ALTER PUBLICATION supabase_realtime ADD TABLE public.learners;