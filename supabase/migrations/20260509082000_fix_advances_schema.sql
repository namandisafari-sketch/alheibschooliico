
-- Add missing created_at column to employee_advances
ALTER TABLE public.employee_advances ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
