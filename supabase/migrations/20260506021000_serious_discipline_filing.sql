
-- Serious Discipline Filing System (Police Style)
-- Adds unique case numbers and authoritative metadata

-- 1. Add case_number column if it doesn't exist
ALTER TABLE public.discipline_cases 
ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE;

-- 2. Create function to generate Case Number (Format: ALH/DIS/YYYY/0001)
CREATE OR REPLACE FUNCTION generate_discipline_case_number() 
RETURNS TRIGGER AS $$
DECLARE
    year_val TEXT;
    next_val INTEGER;
BEGIN
    year_val := TO_CHAR(NOW(), 'YYYY');
    
    -- Count cases in current year
    SELECT COUNT(*) + 1 INTO next_val 
    FROM public.discipline_cases 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    NEW.case_number := 'ALH/DIS/' || year_val || '/' || LPAD(next_val::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger to auto-assign case number on insert
DROP TRIGGER IF EXISTS tr_assign_case_number ON public.discipline_cases;
CREATE TRIGGER tr_assign_case_number
BEFORE INSERT ON public.discipline_cases
FOR EACH ROW
EXECUTE FUNCTION generate_discipline_case_number();

-- 4. Backfill existing cases if any
UPDATE public.discipline_cases 
SET case_number = 'ALH/DIS/' || TO_CHAR(created_at, 'YYYY') || '/' || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 4, '0')
WHERE case_number IS NULL;
