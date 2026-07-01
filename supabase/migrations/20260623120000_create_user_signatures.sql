CREATE TABLE IF NOT EXISTS public.user_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  label TEXT DEFAULT 'My Signature',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signatures"
  ON public.user_signatures
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signatures"
  ON public.user_signatures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
  ON public.user_signatures
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
  ON public.user_signatures
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to view all signatures (for documents)
CREATE POLICY "Admins can view all signatures"
  ON public.user_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
