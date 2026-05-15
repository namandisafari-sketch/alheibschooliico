
-- Reorganizing System to match official Alheib School Workflows
-- Based on: doc_1.docx (Liquidity), doc_2.docx (Custody), doc_3-6.docx (Stock)

-- 1. Inventory / Stock Request Extensions
ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_days INTEGER, -- For Kitchen requests
ADD COLUMN IF NOT EXISTS manager_approval_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS accountant_approval_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS director_approval_by UUID REFERENCES auth.users(id);

-- 1b. Inventory Transactions Extensions
ALTER TABLE public.inventory_transactions
ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_days INTEGER;

-- 2. Petty Cash Liquidity & Snapshots (Matching doc_1.docx)
CREATE TABLE IF NOT EXISTS public.liquidity_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID REFERENCES auth.users(id),
    custody_balance NUMERIC(15,2) DEFAULT 0,
    awards_balance NUMERIC(15,2) DEFAULT 0,
    other_balance NUMERIC(15,2) DEFAULT 0,
    receivables_balance NUMERIC(15,2) DEFAULT 0,
    payables_due NUMERIC(15,2) DEFAULT 0,
    bills_value NUMERIC(15,2) DEFAULT 0,
    total_liquidity NUMERIC(15,2) GENERATED ALWAYS AS (custody_balance + awards_balance + other_balance + receivables_balance - payables_due) STORED,
    requested_amount NUMERIC(15,2) NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, received
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Temporary Custody / Project Advances (Matching doc_2.docx)
ALTER TABLE public.employee_advances
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.finance_projects(id),
ADD COLUMN IF NOT EXISTS duration_text TEXT, -- e.g., '15 days', '1 month'
ADD COLUMN IF NOT EXISTS purpose_details TEXT,
ADD COLUMN IF NOT EXISTS compliance_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_advances_settled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS office_approval_by UUID REFERENCES auth.users(id);

-- 4. Enable RLS
ALTER TABLE public.liquidity_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow auth view liquidity" ON public.liquidity_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth request liquidity" ON public.liquidity_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

-- 5. Grants
GRANT ALL ON public.liquidity_requests TO authenticated;
