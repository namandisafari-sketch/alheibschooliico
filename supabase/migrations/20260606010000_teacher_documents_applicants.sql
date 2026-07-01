-- Teacher Documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-documents', 'teacher-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Teacher Documents table
CREATE TABLE IF NOT EXISTS public.teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view teacher documents" ON public.teacher_documents;
CREATE POLICY "Staff can view teacher documents"
  ON public.teacher_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'head_teacher') OR has_role(auth.uid(), 'deputy_head_teacher'));

DROP POLICY IF EXISTS "Admins can manage teacher documents" ON public.teacher_documents;
CREATE POLICY "Admins can manage teacher documents"
  ON public.teacher_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_teacher_documents_updated_at ON public.teacher_documents;
CREATE TRIGGER update_teacher_documents_updated_at
  BEFORE UPDATE ON public.teacher_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for teacher-documents
DROP POLICY IF EXISTS "Staff can view teacher document files" ON storage.objects;
CREATE POLICY "Staff can view teacher document files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'teacher-documents' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'head_teacher') OR has_role(auth.uid(), 'deputy_head_teacher')));

DROP POLICY IF EXISTS "Admins can upload teacher document files" ON storage.objects;
CREATE POLICY "Admins can upload teacher document files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'teacher-documents' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update teacher document files" ON storage.objects;
CREATE POLICY "Admins can update teacher document files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'teacher-documents' AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete teacher document files" ON storage.objects;
CREATE POLICY "Admins can delete teacher document files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'teacher-documents' AND has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_documents;

-- Teacher Applicants & Interview Scoring
CREATE TABLE IF NOT EXISTS public.teacher_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  position text NOT NULL,
  qualifications text,
  experience_years integer DEFAULT 0,
  specialized_subjects text,
  
  -- Interview scores stored as JSONB array: [{"criteria": "...", "score": 0, "max_score": 10, "notes": ""}, ...]
  interview_scores jsonb DEFAULT '[]'::jsonb,
  total_score numeric(5,2),
  max_total_score numeric(5,2) DEFAULT 50,
  interviewer_remarks text,
  
  -- Status & decision
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'interviewed', 'hired', 'rejected', 'withdrawn')),
  decision text CHECK (decision IN ('hire', 'reject', 'hold')),
  decision_date timestamptz,
  decided_by uuid REFERENCES auth.users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.teacher_applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view applicants" ON public.teacher_applicants;
CREATE POLICY "Staff can view applicants"
  ON public.teacher_applicants FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'head_teacher') OR has_role(auth.uid(), 'deputy_head_teacher'));

DROP POLICY IF EXISTS "Admins can manage applicants" ON public.teacher_applicants;
CREATE POLICY "Admins can manage applicants"
  ON public.teacher_applicants FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_teacher_applicants_updated_at ON public.teacher_applicants;
CREATE TRIGGER update_teacher_applicants_updated_at
  BEFORE UPDATE ON public.teacher_applicants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_applicants;
