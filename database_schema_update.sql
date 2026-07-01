-- Update school_calendar table to support recurring events
ALTER TABLE school_calendar 
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' 
CHECK (recurrence IN ('none', 'weekly', 'monthly', 'annually', 'termly'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_calendar_dates ON school_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_school_calendar_type ON school_calendar(event_type);

-- Commentary:
-- 'none' - One time event
-- 'weekly' - Repeats every week on the same day of week
-- 'monthly' - Repeats every month on the same day of month
-- 'annually' - Repeats every year on same month/day
-- 'termly' - Heuristic repeat every 4 months (aligned with standard 3-term system)

-- Teacher onboarding tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ============================================================
-- IPLE (Islamic Primary Leaving Examination) Infrastructure
-- ============================================================

-- Curriculum track for learners
DO $$ BEGIN
  CREATE TYPE curriculum_track AS ENUM ('standard', 'islamic', 'dual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- IPLE board affiliations
DO $$ BEGIN
  CREATE TYPE iple_board AS ENUM ('umsc', 'uqsa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- IPLE core subjects
DO $$ BEGIN
  CREATE TYPE iple_subject_name AS ENUM ('quran', 'fiqh', 'arabic', 'tarbia');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- IPLE exam status
DO $$ BEGIN
  CREATE TYPE iple_exam_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Oral exam status
DO $$ BEGIN
  CREATE TYPE oral_exam_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add curriculum track to learners
ALTER TABLE learners ADD COLUMN IF NOT EXISTS curriculum_track curriculum_track DEFAULT 'standard';
ALTER TABLE learners ADD COLUMN IF NOT EXISTS iple_registration_number TEXT UNIQUE;

-- IPLE Exam Center Registration (school-level)
CREATE TABLE IF NOT EXISTS iple_center_registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board iple_board NOT NULL DEFAULT 'umsc',
  center_code TEXT NOT NULL,
  center_name TEXT NOT NULL,
  registered_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_active BOOLEAN DEFAULT true,
  affiliation_body TEXT,
  inspector_name TEXT,
  inspector_contact TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  police_station TEXT,
  security_clearance_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board, registered_year)
);

-- IPLE Candidates (students registered for IPLE)
CREATE TABLE IF NOT EXISTS iple_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  board iple_board NOT NULL DEFAULT 'umsc',
  center_id UUID REFERENCES iple_center_registration(id),
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, academic_year)
);

-- IPLE Subject Scores (per-student, per-subject exam results)
CREATE TABLE IF NOT EXISTS iple_subject_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES iple_candidates(id) ON DELETE CASCADE NOT NULL,
  subject iple_subject_name NOT NULL,
  written_score DECIMAL(5,2) CHECK (written_score >= 0 AND written_score <= 100),
  oral_score DECIMAL(5,2) CHECK (oral_score >= 0 AND oral_score <= 100),
  total_score DECIMAL(5,2) GENERATED ALWAYS AS (
    ROUND((COALESCE(written_score, 0) + COALESCE(oral_score, 0)) / 2.0, 2)
  ) STORED,
  letter_grade TEXT CHECK (letter_grade IN ('A', 'B+', 'B', 'C+', 'C', 'D', 'E')),
  remarks TEXT,
  assessed_by UUID REFERENCES profiles(id),
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, subject)
);

-- IPLE Oral Examinations (tracking oral exam sessions)
CREATE TABLE IF NOT EXISTS iple_oral_examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES iple_candidates(id) ON DELETE CASCADE NOT NULL,
  subject iple_subject_name NOT NULL,
  examiner_id UUID REFERENCES profiles(id),
  exam_date DATE NOT NULL,
  status oral_exam_status DEFAULT 'scheduled',
  fluency_score DECIMAL(5,2) CHECK (fluency_score >= 0 AND fluency_score <= 100),
  accuracy_score DECIMAL(5,2) CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  comprehension_score DECIMAL(5,2) CHECK (comprehension_score >= 0 AND comprehension_score <= 100),
  total_score DECIMAL(5,2) GENERATED ALWAYS AS (
    ROUND((COALESCE(fluency_score, 0) + COALESCE(accuracy_score, 0) + COALESCE(comprehension_score, 0)) / 3.0, 2)
  ) STORED,
  examiner_notes TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(candidate_id, subject, exam_date)
);

-- View: IPLE aggregated results per candidate per year
CREATE OR REPLACE VIEW iple_aggregated_results AS
SELECT
  c.id AS candidate_id,
  c.learner_id,
  c.registration_number,
  c.academic_year,
  l.full_name AS learner_name,
  l.class_id,
  cl.name AS class_name,
  jsonb_object_agg(
    s.subject,
    jsonb_build_object(
      'written_score', s.written_score,
      'oral_score', s.oral_score,
      'total_score', s.total_score,
      'letter_grade', s.letter_grade
    )
  ) AS subject_scores,
  ROUND(AVG(s.total_score), 2) AS aggregate_score,
  COUNT(s.id) FILTER (WHERE s.letter_grade IN ('A', 'B+', 'B')) AS passed_subjects
FROM iple_candidates c
JOIN learners l ON l.id = c.learner_id
LEFT JOIN classes cl ON cl.id = l.class_id
LEFT JOIN iple_subject_scores s ON s.candidate_id = c.id
GROUP BY c.id, c.learner_id, c.registration_number, c.academic_year, l.full_name, l.class_id, cl.name;

-- Indexes for IPLE performance
CREATE INDEX IF NOT EXISTS idx_iple_candidates_learner ON iple_candidates(learner_id);
CREATE INDEX IF NOT EXISTS idx_iple_candidates_year ON iple_candidates(academic_year);
CREATE INDEX IF NOT EXISTS idx_iple_scores_candidate ON iple_subject_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_iple_oral_candidate ON iple_oral_examinations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_iple_oral_date ON iple_oral_examinations(exam_date);
