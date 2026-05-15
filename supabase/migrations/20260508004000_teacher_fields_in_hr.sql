
-- Further enhance employees for teacher integration
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS assigned_class TEXT,
ADD COLUMN IF NOT EXISTS subjects TEXT;
