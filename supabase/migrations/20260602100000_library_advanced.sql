-- Add extra columns to library_books
ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS class_level TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','damaged','lost','withdrawn')),
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS publisher TEXT,
  ADD COLUMN IF NOT EXISTS publication_year INT;

CREATE INDEX IF NOT EXISTS idx_library_books_status ON public.library_books (status);

-- Create library_members table
CREATE TABLE IF NOT EXISTS public.library_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  id_card_number TEXT UNIQUE NOT NULL,
  member_type TEXT NOT NULL DEFAULT 'student' CHECK (member_type IN ('student','teacher','staff','external')),
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  max_loans INT NOT NULL DEFAULT 3,
  active_loans INT NOT NULL DEFAULT 0 CHECK (active_loans >= 0),
  total_fines NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_fines >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','expired','banned')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_members_profile ON public.library_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_library_members_learner ON public.library_members (learner_id);
CREATE INDEX IF NOT EXISTS idx_library_members_card ON public.library_members (id_card_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_members TO authenticated;
GRANT ALL ON public.library_members TO service_role;

ALTER TABLE public.library_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members"
  ON public.library_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Library managers can insert members"
  ON public.library_members FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can update members"
  ON public.library_members FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can delete members"
  ON public.library_members FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));

CREATE TRIGGER trg_library_members_updated
  BEFORE UPDATE ON public.library_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create library_reservations table
CREATE TABLE IF NOT EXISTS public.library_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.library_members(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '3 days'),
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','fulfilled','expired','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_reservations_book ON public.library_reservations (book_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_member ON public.library_reservations (member_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_status ON public.library_reservations (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_reservations TO authenticated;
GRANT ALL ON public.library_reservations TO service_role;

ALTER TABLE public.library_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own reservations, managers view all"
  ON public.library_reservations FOR SELECT TO authenticated
  USING (member_id IN (SELECT id FROM public.library_members WHERE profile_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can insert reservations"
  ON public.library_reservations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can update reservations"
  ON public.library_reservations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can delete reservations"
  ON public.library_reservations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));

-- Create library_fines table
CREATE TABLE IF NOT EXISTS public.library_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.library_loans(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES public.library_members(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','waived')),
  issued_by UUID,
  waived_by UUID,
  waived_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_fines_member ON public.library_fines (member_id);
CREATE INDEX IF NOT EXISTS idx_library_fines_status ON public.library_fines (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_fines TO authenticated;
GRANT ALL ON public.library_fines TO service_role;

ALTER TABLE public.library_fines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own fines, managers view all"
  ON public.library_fines FOR SELECT TO authenticated
  USING (member_id IN (SELECT id FROM public.library_members WHERE profile_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can insert fines"
  ON public.library_fines FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can update fines"
  ON public.library_fines FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'head_teacher')
    OR public.has_role(auth.uid(),'deputy_head_teacher')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'office_manager')
    OR public.has_role(auth.uid(),'director'));

CREATE POLICY "Library managers can delete fines"
  ON public.library_fines FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));

-- Update library_adjust_stock to handle reservations too
CREATE OR REPLACE FUNCTION public.library_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.library_books
       SET available_copies = GREATEST(available_copies - 1, 0)
     WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status IN ('returned','lost') THEN
      IF NEW.status = 'returned' THEN
        UPDATE public.library_books
           SET available_copies = LEAST(available_copies + 1, total_copies)
         WHERE id = NEW.book_id;
      END IF;
      IF NEW.status = 'lost' THEN
        UPDATE public.library_books
           SET total_copies = GREATEST(total_copies - 1, 0),
               available_copies = GREATEST(available_copies - 1, 0)
         WHERE id = NEW.book_id;
      END IF;
    ELSIF OLD.status IN ('returned','lost') AND NEW.status = 'active' THEN
      UPDATE public.library_books
         SET available_copies = GREATEST(available_copies - 1, 0)
       WHERE id = NEW.book_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.library_books
       SET available_copies = LEAST(available_copies + 1, total_copies)
     WHERE id = OLD.book_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Auto-create library_member when a profile is created (if they don't have one)
CREATE OR REPLACE FUNCTION public.auto_create_library_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_num TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.library_members WHERE profile_id = NEW.id) THEN
    card_num := 'L-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8));
    INSERT INTO public.library_members (profile_id, id_card_number, member_type, email, active_loans, total_fines)
    VALUES (
      NEW.id,
      card_num,
      CASE
        WHEN NEW.role IN ('student','learner') THEN 'student'
        WHEN NEW.role IN ('teacher','head_teacher','deputy_head_teacher') THEN 'teacher'
        ELSE 'staff'
      END,
      NEW.email,
      0,
      0
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_library_member
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_library_member();
