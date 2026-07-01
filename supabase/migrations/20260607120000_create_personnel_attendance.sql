-- Create personnel_attendance table used by attendance and payroll
CREATE TABLE IF NOT EXISTS public.personnel_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  check_in_time time,
  recorded_by uuid,
  is_finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, date)
);

-- Optional index to speed queries by date
CREATE INDEX IF NOT EXISTS personnel_attendance_date_idx ON public.personnel_attendance (date);
CREATE INDEX IF NOT EXISTS personnel_attendance_employee_idx ON public.personnel_attendance (employee_id);
