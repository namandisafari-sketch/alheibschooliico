
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
