
-- Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_id TEXT, -- GeoNames ID
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add scoping columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'school' CHECK (scope IN ('global', 'district', 'school')),
ADD COLUMN IF NOT EXISTS district_id TEXT, -- GeoNames ID
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view schools' AND tablename = 'schools') THEN
    CREATE POLICY "Anyone can view schools" ON public.schools
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage schools' AND tablename = 'schools') THEN
    CREATE POLICY "Admins can manage schools" ON public.schools
      FOR ALL TO authenticated USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Update profile handle function to set default scope
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, scope)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'school');
  RETURN NEW;
END;
$$;
