-- Add new roles to app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_of_internal';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dos_theology';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Registration tokens table for self-registration confirmation
CREATE TABLE IF NOT EXISTS public.registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_email ON registration_tokens(email);

ALTER TABLE registration_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read registration tokens" ON registration_tokens
  FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE registration_tokens;
