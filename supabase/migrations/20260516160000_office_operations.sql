
-- OFFICE: Communications and Document Registry

CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles text[], -- ['teacher', 'staff', 'parent']
  priority TEXT CHECK (priority IN ('normal', 'high', 'urgent')),
  sent_via text[] DEFAULT ARRAY['app'], -- ['app', 'sms', 'email']
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ref_number TEXT UNIQUE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  category TEXT, -- 'Policy', 'Circular', 'Letter', 'Invoice'
  physical_location TEXT, -- 'Cabinet A, Folder 3'
  file_url TEXT, -- Digital scan link
  sender_receiver_name TEXT,
  received_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_registry ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view communications" ON public.communications FOR SELECT TO authenticated USING (
  target_roles IS NULL OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = ANY(target_roles) OR
  sender_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'office', 'head_teacher'))
);

CREATE POLICY "Allow office and admin manage communications" ON public.communications FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'office', 'head_teacher', 'dos'))
);

CREATE POLICY "Allow authenticated view document registry" ON public.document_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow office and admin manage document registry" ON public.document_registry FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'office', 'head_teacher'))
);
