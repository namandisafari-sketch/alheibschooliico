-- Grading Scales Configuration for DOS
-- Allows the Director of Studies to define and manage grading scales per subject type.

CREATE TABLE IF NOT EXISTS public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grading_type public.grading_type NOT NULL DEFAULT 'numeric',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id UUID REFERENCES public.grading_scales(id) ON DELETE CASCADE NOT NULL,
  grade TEXT NOT NULL,
  min_score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  remark TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scale_id, grade)
);

ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view grading scales"
  ON public.grading_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and DOS can manage grading scales"
  ON public.grading_scales FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher')));

CREATE POLICY "Authenticated users can view grade boundaries"
  ON public.grade_boundaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and DOS can manage grade boundaries"
  ON public.grade_boundaries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'dos', 'head_teacher')));

-- Seed default grading scales
INSERT INTO public.grading_scales (name, grading_type, description, is_default) VALUES
  ('PLE Standard', 'numeric', 'Uganda PLE standard grading (D1-F9) for upper primary', true),
  ('Lower Primary', 'numeric', 'Simple A-E scale for lower primary classes', false),
  ('Islamic Letter Grade', 'letter', 'Letter-based grading for Islamic studies subjects', false),
  ('Competency Rating', 'descriptive', 'Uganda competency-based curriculum rating', false)
ON CONFLICT DO NOTHING;

-- Seed PLE Standard boundaries
INSERT INTO public.grade_boundaries (scale_id, grade, min_score, max_score, remark, color, sort_order)
SELECT id, 'D1', 80, 100, 'Distinction', 'emerald', 1 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'D2', 75, 79, 'Distinction', 'emerald', 2 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'C3', 70, 74, 'Credit', 'blue', 3 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'C4', 65, 69, 'Credit', 'blue', 4 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'C5', 60, 64, 'Credit', 'blue', 5 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'C6', 55, 59, 'Credit', 'blue', 6 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'P7', 50, 54, 'Pass', 'amber', 7 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'P8', 45, 49, 'Pass', 'amber', 8 FROM public.grading_scales WHERE name = 'PLE Standard'
UNION ALL SELECT id, 'F9', 0, 44, 'Fail', 'red', 9 FROM public.grading_scales WHERE name = 'PLE Standard';

-- Seed Lower Primary boundaries
INSERT INTO public.grade_boundaries (scale_id, grade, min_score, max_score, remark, color, sort_order)
SELECT id, 'A', 80, 100, 'Excellent', 'emerald', 1 FROM public.grading_scales WHERE name = 'Lower Primary'
UNION ALL SELECT id, 'B', 70, 79, 'Very Good', 'blue', 2 FROM public.grading_scales WHERE name = 'Lower Primary'
UNION ALL SELECT id, 'C', 60, 69, 'Good', 'blue', 3 FROM public.grading_scales WHERE name = 'Lower Primary'
UNION ALL SELECT id, 'D', 50, 59, 'Fair', 'amber', 4 FROM public.grading_scales WHERE name = 'Lower Primary'
UNION ALL SELECT id, 'E', 0, 49, 'Needs Improvement', 'red', 5 FROM public.grading_scales WHERE name = 'Lower Primary';

-- Seed Islamic Letter Grade options
INSERT INTO public.grade_boundaries (scale_id, grade, min_score, max_score, remark, color, sort_order)
SELECT id, 'A', 90, 100, 'Outstanding', 'emerald', 1 FROM public.grading_scales WHERE name = 'Islamic Letter Grade'
UNION ALL SELECT id, 'B+', 80, 89, 'Very Good', 'blue', 2 FROM public.grading_scales WHERE name = 'Islamic Letter Grade'
UNION ALL SELECT id, 'B', 70, 79, 'Good', 'blue', 3 FROM public.grading_scales WHERE name = 'Islamic Letter Grade'
UNION ALL SELECT id, 'C+', 60, 69, 'Above Average', 'amber', 4 FROM public.grading_scales WHERE name = 'Islamic Letter Grade'
UNION ALL SELECT id, 'C', 50, 59, 'Average', 'amber', 5 FROM public.grading_scales WHERE name = 'Islamic Letter Grade'
UNION ALL SELECT id, 'D', 40, 49, 'Below Average', 'orange', 6 FROM public.grading_scales WHERE name = 'Islamic Letter Grade'
UNION ALL SELECT id, 'E', 0, 39, 'Needs Improvement', 'red', 7 FROM public.grading_scales WHERE name = 'Islamic Letter Grade';

-- Seed Competency Rating boundaries
INSERT INTO public.grade_boundaries (scale_id, grade, min_score, max_score, remark, color, sort_order)
SELECT id, 'Exceeding', 75, 100, 'Exceeding Expectations', 'emerald', 1 FROM public.grading_scales WHERE name = 'Competency Rating'
UNION ALL SELECT id, 'Meeting', 60, 74, 'Meeting Expectations', 'blue', 2 FROM public.grading_scales WHERE name = 'Competency Rating'
UNION ALL SELECT id, 'Approaching', 45, 59, 'Approaching Expectations', 'amber', 3 FROM public.grading_scales WHERE name = 'Competency Rating'
UNION ALL SELECT id, 'Beginning', 0, 44, 'Beginning', 'red', 4 FROM public.grading_scales WHERE name = 'Competency Rating';
