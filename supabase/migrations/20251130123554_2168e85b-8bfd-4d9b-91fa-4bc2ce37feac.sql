-- Create notification templates table
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  channel text NOT NULL DEFAULT 'sms', -- 'sms', 'whatsapp'
  subject text,
  message_body text NOT NULL,
  variables text[], -- e.g. ['learner_name', 'class_name', 'date']
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.notification_templates(id),
  recipient_phone text NOT NULL,
  recipient_name text,
  learner_id uuid REFERENCES public.learners(id),
  guardian_id uuid REFERENCES public.guardians(id),
  channel text NOT NULL, -- 'sms', 'whatsapp'
  message_content text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create scheduled notifications table
CREATE TABLE public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.notification_templates(id) NOT NULL,
  target_audience text NOT NULL, -- 'all_parents', 'class', 'individual'
  target_class_id uuid REFERENCES public.classes(id),
  target_learner_ids uuid[],
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'scheduled', -- 'scheduled', 'processing', 'completed', 'cancelled'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates
CREATE POLICY "Staff can view notification templates"
ON public.notification_templates FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for notification_logs
CREATE POLICY "Staff can view notification logs"
ON public.notification_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage notification logs"
ON public.notification_logs FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for scheduled_notifications
CREATE POLICY "Staff can view scheduled notifications"
ON public.scheduled_notifications FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage scheduled notifications"
ON public.scheduled_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default templates (inactive)
INSERT INTO public.notification_templates (name, description, channel, message_body, variables, is_active) VALUES
('Attendance Alert', 'Notify parent when learner is absent', 'sms', 'Dear {guardian_name}, your child {learner_name} was marked absent today ({date}). Please contact the school if you have any concerns.', ARRAY['guardian_name', 'learner_name', 'date'], false),
('Fee Reminder', 'Remind parents about pending fees', 'sms', 'Dear {guardian_name}, this is a reminder that school fees for {learner_name} ({class_name}) are due. Please make payment at your earliest convenience.', ARRAY['guardian_name', 'learner_name', 'class_name'], false),
('Report Card Ready', 'Notify when report card is available', 'whatsapp', 'Dear {guardian_name}, the {term} report card for {learner_name} is now available. Please visit the school to collect it or check the parent portal.', ARRAY['guardian_name', 'learner_name', 'term'], false),
('General Announcement', 'General school announcements', 'sms', '{message}', ARRAY['message'], false),
('Event Reminder', 'Remind about upcoming events', 'whatsapp', 'Dear {guardian_name}, reminder: {event_name} is scheduled for {event_date}. We look forward to seeing you!', ARRAY['guardian_name', 'event_name', 'event_date'], false);

-- Triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();