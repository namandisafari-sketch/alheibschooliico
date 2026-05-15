-- Create storage bucket for learner documents (private by default)
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
EXECUTE FUNCTION public.update_updated_at_column();