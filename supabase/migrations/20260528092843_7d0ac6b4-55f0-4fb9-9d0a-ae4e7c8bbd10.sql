
-- Books catalog
CREATE TABLE public.library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  publisher TEXT,
  publication_year INT,
  language TEXT DEFAULT 'English',
  description TEXT,
  cover_url TEXT,
  shelf_location TEXT,
  total_copies INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_books_title ON public.library_books (lower(title));
CREATE INDEX idx_library_books_category ON public.library_books (category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view books"
ON public.library_books FOR SELECT TO authenticated USING (true);

CREATE POLICY "Library managers can insert books"
ON public.library_books FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'head_teacher')
  OR public.has_role(auth.uid(),'deputy_head_teacher')
  OR public.has_role(auth.uid(),'secretary')
  OR public.has_role(auth.uid(),'office_manager')
  OR public.has_role(auth.uid(),'director')
);

CREATE POLICY "Library managers can update books"
ON public.library_books FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'head_teacher')
  OR public.has_role(auth.uid(),'deputy_head_teacher')
  OR public.has_role(auth.uid(),'secretary')
  OR public.has_role(auth.uid(),'office_manager')
  OR public.has_role(auth.uid(),'director')
);

CREATE POLICY "Library managers can delete books"
ON public.library_books FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'director')
);

CREATE TRIGGER trg_library_books_updated
BEFORE UPDATE ON public.library_books
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Loans
CREATE TABLE public.library_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL,
  borrower_name TEXT,
  issued_by UUID,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','returned','overdue','lost')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_loans_borrower ON public.library_loans (borrower_id);
CREATE INDEX idx_library_loans_book ON public.library_loans (book_id);
CREATE INDEX idx_library_loans_status ON public.library_loans (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_loans TO authenticated;
GRANT ALL ON public.library_loans TO service_role;

ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Borrowers view own loans, managers view all"
ON public.library_loans FOR SELECT TO authenticated
USING (
  borrower_id = auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'head_teacher')
  OR public.has_role(auth.uid(),'deputy_head_teacher')
  OR public.has_role(auth.uid(),'secretary')
  OR public.has_role(auth.uid(),'office_manager')
  OR public.has_role(auth.uid(),'director')
  OR public.has_role(auth.uid(),'teacher')
);

CREATE POLICY "Library managers can issue loans"
ON public.library_loans FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'head_teacher')
  OR public.has_role(auth.uid(),'deputy_head_teacher')
  OR public.has_role(auth.uid(),'secretary')
  OR public.has_role(auth.uid(),'office_manager')
  OR public.has_role(auth.uid(),'director')
);

CREATE POLICY "Library managers can update loans"
ON public.library_loans FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'head_teacher')
  OR public.has_role(auth.uid(),'deputy_head_teacher')
  OR public.has_role(auth.uid(),'secretary')
  OR public.has_role(auth.uid(),'office_manager')
  OR public.has_role(auth.uid(),'director')
);

CREATE POLICY "Library managers can delete loans"
ON public.library_loans FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'director')
);

CREATE TRIGGER trg_library_loans_updated
BEFORE UPDATE ON public.library_loans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-adjust available_copies
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
      -- 'lost' permanently reduces stock: decrement total too
      IF NEW.status = 'lost' THEN
        UPDATE public.library_books
           SET total_copies = GREATEST(total_copies - 1, 0)
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

CREATE TRIGGER trg_library_loans_stock
AFTER INSERT OR UPDATE OR DELETE ON public.library_loans
FOR EACH ROW EXECUTE FUNCTION public.library_adjust_stock();
