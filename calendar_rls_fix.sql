-- =====================================================================
-- RUN THIS IN THE LOVABLE CLOUD SQL EDITOR
-- Fixes:
--  1) school_calendar RLS so admin / director / dos / head_teacher can add events
--  2) Adds helper is_calendar_manager() that checks BOTH profiles.role and user_roles
-- =====================================================================

ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage calendar"     ON public.school_calendar;
DROP POLICY IF EXISTS "Anyone can view public calendar" ON public.school_calendar;
DROP POLICY IF EXISTS "Anyone can view calendar"        ON public.school_calendar;
DROP POLICY IF EXISTS "Managers can insert calendar"    ON public.school_calendar;
DROP POLICY IF EXISTS "Managers can update calendar"    ON public.school_calendar;
DROP POLICY IF EXISTS "Managers can delete calendar"    ON public.school_calendar;

CREATE OR REPLACE FUNCTION public.is_calendar_manager(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = _uid
       AND p.role IN ('admin','head_teacher','director','dos')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles r
     WHERE r.user_id = _uid
       AND r.role::text IN ('admin','head_teacher','director','dos')
  );
$$;

CREATE POLICY "Anyone can view calendar"
  ON public.school_calendar FOR SELECT USING (true);

CREATE POLICY "Managers can insert calendar"
  ON public.school_calendar FOR INSERT
  WITH CHECK (public.is_calendar_manager(auth.uid()));

CREATE POLICY "Managers can update calendar"
  ON public.school_calendar FOR UPDATE
  USING (public.is_calendar_manager(auth.uid()));

CREATE POLICY "Managers can delete calendar"
  ON public.school_calendar FOR DELETE
  USING (public.is_calendar_manager(auth.uid()));
