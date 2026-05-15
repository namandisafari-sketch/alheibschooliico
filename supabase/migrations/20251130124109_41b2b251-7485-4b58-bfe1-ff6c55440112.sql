-- Create site settings table for landing page content
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (public landing page)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can update site settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default landing page content
INSERT INTO public.site_settings (key, value) VALUES
('landing_hero', '{
  "school_name": "Alheb Islamic Primary School",
  "tagline": "Nurturing Minds, Building Character, Inspiring Excellence",
  "description": "Where Islamic values meet academic excellence. We provide quality education in a nurturing environment that prepares students for success in this life and the hereafter.",
  "cta_text": "Apply Now",
  "cta_link": "/auth"
}'::jsonb),
('landing_features', '{
  "title": "Why Choose Us?",
  "items": [
    {"icon": "BookOpen", "title": "Islamic Education", "description": "Comprehensive Islamic studies integrated with modern curriculum"},
    {"icon": "GraduationCap", "title": "Academic Excellence", "description": "High-quality education with experienced and dedicated teachers"},
    {"icon": "Users", "title": "Character Building", "description": "Focus on moral development and Islamic values"},
    {"icon": "Shield", "title": "Safe Environment", "description": "Secure and nurturing campus for your children"}
  ]
}'::jsonb),
('landing_stats', '{
  "items": [
    {"value": "500+", "label": "Students"},
    {"value": "25+", "label": "Teachers"},
    {"value": "15+", "label": "Years Experience"},
    {"value": "98%", "label": "Pass Rate"}
  ]
}'::jsonb),
('landing_contact', '{
  "title": "Contact Us",
  "address": "123 Education Road, Kampala, Uganda",
  "phone": "+256 700 123 456",
  "email": "info@alheb.edu",
  "hours": "Monday - Friday: 7:00 AM - 5:00 PM"
}'::jsonb),
('landing_theme', '{
  "primary_color": "hsl(142, 76%, 36%)",
  "hero_bg_gradient": "linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 60%, 25%) 100%)",
  "show_stats": true,
  "show_features": true,
  "show_contact": true
}'::jsonb);

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();