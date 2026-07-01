-- Add optional unique receipt numbers to salary payments
ALTER TABLE public.salary_payments
  ADD COLUMN receipt_number TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_salary_payments_receipt ON public.salary_payments(receipt_number);
