-- Create salary records table for all staff
CREATE TABLE public.salary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) GENERATED ALWAYS AS (basic_salary + COALESCE(allowances, 0) - COALESCE(deductions, 0)) STORED,
  currency TEXT DEFAULT 'UGX',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create salary payments table for payment history
CREATE TABLE public.salary_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salary_record_id UUID NOT NULL REFERENCES public.salary_records(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  reference_number TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  paid_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add language preference to site settings
INSERT INTO public.site_settings (key, value)
VALUES ('language_settings', '{"default_language": "en", "supported_languages": ["en", "ar"], "rtl_enabled": true}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for salary_records
CREATE POLICY "Admins can manage salary records"
ON public.salary_records FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own salary"
ON public.salary_records FOR SELECT
USING (staff_id = auth.uid());

-- RLS policies for salary_payments
CREATE POLICY "Admins can manage salary payments"
ON public.salary_payments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own payments"
ON public.salary_payments FOR SELECT
USING (staff_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_salary_records_updated_at
BEFORE UPDATE ON public.salary_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();