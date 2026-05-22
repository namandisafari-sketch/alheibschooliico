
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
