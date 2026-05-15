
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
