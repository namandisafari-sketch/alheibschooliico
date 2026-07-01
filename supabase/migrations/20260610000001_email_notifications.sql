-- Add Resend API key and notification settings to email_settings
ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS resend_api_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT '{}';

-- Create notification event log for tracking what triggered emails
CREATE TABLE IF NOT EXISTS public.email_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'attendance_recorded', 'gate_checkin', 'appointment_created', 'request_approved', 'request_rejected', 'daily_report'
  reference_type TEXT,
  reference_id TEXT,
  summary TEXT NOT NULL,
  recipients_sent INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admins can read notification events"
  ON public.email_notification_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Service can insert notification events"
  ON public.email_notification_events FOR INSERT
  WITH CHECK (true);
