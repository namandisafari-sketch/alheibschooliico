CREATE TABLE public.learner_academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  class_id UUID REFERENCES public.classes(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'repeated', 'left', 'graduated')),
  exit_reason TEXT,
  exit_date DATE,
  destination_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learner_academic_records_learner_year ON public.learner_academic_records(learner_id, academic_year);
CREATE INDEX idx_learner_academic_records_status ON public.learner_academic_records(status);

ALTER TABLE public.learner_academic_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read academic records"
  ON public.learner_academic_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert academic records"
  ON public.learner_academic_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update academic records"
  ON public.learner_academic_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
