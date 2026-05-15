-- Create app_role enum for different user types
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent', 'staff');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create parent_learner_links table to link parents to their children
CREATE TABLE public.parent_learner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (parent_user_id, learner_id)
);

-- Enable RLS on parent_learner_links
ALTER TABLE public.parent_learner_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for parent_learner_links
CREATE POLICY "Parents can view their own links"
  ON public.parent_learner_links
  FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Admins can manage all links"
  ON public.parent_learner_links
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles table to ensure it works with auth
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create trigger to assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default new users to 'parent' role (can be changed by admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');
  RETURN NEW;
END;
$$;

-- Create trigger for new user role assignment
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Update RLS policies for learners table to allow parents to view their children
CREATE POLICY "Parents can view their linked learners"
  ON public.learners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_learner_links
      WHERE parent_user_id = auth.uid()
      AND learner_id = id
    )
  );

-- Update RLS policies for attendance to allow parents to view their children's attendance
CREATE POLICY "Parents can view their children's attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_learner_links
      WHERE parent_user_id = auth.uid()
      AND learner_id = attendance.learner_id
    )
  );