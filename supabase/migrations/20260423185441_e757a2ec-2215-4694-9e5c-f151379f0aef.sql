
-- ============== VISITORS ==============
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  id_number TEXT,
  photo_url TEXT,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage visitors" ON public.visitors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Teachers view visitors" ON public.visitors FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role));
CREATE TRIGGER trg_visitors_updated_at BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== APPOINTMENTS ==============
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  purpose TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT,
  host_staff_id UUID,
  host_name TEXT,
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  notes TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage appointments" ON public.appointments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Teachers view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role) OR host_staff_id = auth.uid());
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_appointments_scheduled_for ON public.appointments(scheduled_for);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============== VISITOR VISITS (gate log) ==============
CREATE TABLE public.visitor_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_photo_url TEXT,
  purpose TEXT,
  host_staff_id UUID,
  host_name TEXT,
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  badge_number TEXT,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in',
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage visitor visits" ON public.visitor_visits FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Teachers view visitor visits" ON public.visitor_visits FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role));
CREATE INDEX idx_visitor_visits_check_in ON public.visitor_visits(check_in_at DESC);
CREATE INDEX idx_visitor_visits_status ON public.visitor_visits(status);

-- ============== IN-APP NOTIFICATIONS ==============
CREATE TABLE public.in_app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.in_app_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.in_app_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.in_app_notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Staff create notifications" ON public.in_app_notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE INDEX idx_in_app_notifications_user_unread ON public.in_app_notifications(user_id, is_read, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
