
-- Update employees table to include essential HR contact and qualification info
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT;

-- Update employee registration to handle teacher specific data if needed
-- (Assigned class can be handled via position/role string for now)
