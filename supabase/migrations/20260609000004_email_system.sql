-- Email System: Settings, Logs, and Queue for automated transactional emails

-- Email configuration (singleton row, keyed by id=1)
CREATE TABLE IF NOT EXISTS public.email_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  smtp_host TEXT NOT NULL DEFAULT '',
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN NOT NULL DEFAULT false,
  smtp_user TEXT NOT NULL DEFAULT '',
  smtp_pass TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT 'Al-Heib School',
  from_email TEXT NOT NULL DEFAULT 'noreply@alheibschool.org',
  reply_to TEXT DEFAULT '',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  daily_limit INTEGER NOT NULL DEFAULT 300,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email_settings"
  ON public.email_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Email log for tracking all outgoing emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  reference_type TEXT,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','bounced','opened')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read email_logs"
  ON public.email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service can insert email_logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

-- Scheduled automated emails (reminders, alerts, etc.)
CREATE TABLE IF NOT EXISTS public.email_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL, -- e.g. 'fee_reminder', 'attendance_alert', 'approval_needed', 'sponsor_report'
  target_role TEXT, -- send to all users with this role
  target_audience TEXT, -- 'all', 'guardians', 'staff', 'sponsors'
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  schedule_cron TEXT, -- cron expression for recurring emails
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.email_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email_schedules"
  ON public.email_schedules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Email queue for pending outgoing emails
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','sent','failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  process_after TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can manage email_queue"
  ON public.email_queue FOR ALL
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_schedules_active ON public.email_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_email_schedules_trigger ON public.email_schedules(trigger_event);
