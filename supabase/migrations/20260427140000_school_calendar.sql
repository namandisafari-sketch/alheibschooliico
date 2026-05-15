
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
