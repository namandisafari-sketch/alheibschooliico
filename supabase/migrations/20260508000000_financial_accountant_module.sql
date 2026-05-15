
-- Financial & Accountant Module Schema
-- Prepared May 2026

-- 1. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donor_type') THEN
        CREATE TYPE donor_type AS ENUM ('individual', 'organization', 'grant');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
        CREATE TYPE po_status AS ENUM ('draft', 'committee', 'head_office', 'kuwait', 'approved', 'rejected', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_type') THEN
        CREATE TYPE doc_type AS ENUM ('invoice', 'delivery_note', 'receipt', 'quotation');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_step_type') THEN
        CREATE TYPE approval_step_type AS ENUM ('committee', 'head_office', 'kuwait');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_order_category') THEN
        CREATE TYPE store_order_category AS ENUM ('food', 'stationery');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_order_status') THEN
        CREATE TYPE store_order_status AS ENUM ('pending_director', 'pending_accountant', 'pending_storekeeper', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category_type') THEN
        CREATE TYPE asset_category_type AS ENUM ('furniture', 'equipment', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'petty_cash_status') THEN
        CREATE TYPE petty_cash_status AS ENUM ('open', 'closed', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_status') THEN
        CREATE TYPE payroll_status AS ENUM ('draft', 'approved', 'paid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repayment_plan') THEN
        CREATE TYPE repayment_plan AS ENUM ('single', 'installment');
    END IF;
END $$;

-- 2. Financial Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type account_type NOT NULL,
    parent_id UUID REFERENCES public.finance_accounts(id),
    currency TEXT DEFAULT 'UGX',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC(15,6) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Donors & Donations
CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type donor_type NOT NULL,
    contact TEXT,
    currency TEXT DEFAULT 'UGX',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE,
    project_id UUID, -- Links to projects (if any)
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'UGX',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Procurement (Purchase Orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    title TEXT NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    status po_status DEFAULT 'draft',
    total_amount NUMERIC(15,2),
    currency TEXT DEFAULT 'UGX',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    type doc_type NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    step approval_step_type NOT NULL,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 6. Store Management
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category store_order_category NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT,
    requested_by UUID REFERENCES auth.users(id),
    status store_order_status DEFAULT 'pending_director',
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assets Extensions & Custodians
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS useful_life_years INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS current_value NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.asset_custodians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    employee_id UUID, -- Link to employee table
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    returned_date DATE,
    signed_form_url TEXT,
    notes TEXT
);

-- 8. Petty Cash
CREATE TABLE IF NOT EXISTS public.petty_cash_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    opened_by UUID REFERENCES auth.users(id),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    total_float NUMERIC(15,2) NOT NULL,
    status petty_cash_status DEFAULT 'open',
    report_url TEXT,
    signed_image_url TEXT
);

CREATE TABLE IF NOT EXISTS public.petty_cash_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.petty_cash_runs(id) ON DELETE CASCADE,
    product_category TEXT,
    item_description TEXT NOT NULL,
    invoice_number TEXT,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'UGX',
    invoice_image_url TEXT,
    entered_by UUID REFERENCES auth.users(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Employees & Payroll
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    full_name TEXT NOT NULL,
    role TEXT,
    tin_number TEXT,
    nssf_number TEXT,
    base_salary NUMERIC(15,2),
    currency TEXT DEFAULT 'UGX',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link asset_custodians to employees
ALTER TABLE public.asset_custodians 
ADD CONSTRAINT fk_custodian_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    run_by UUID REFERENCES auth.users(id),
    status payroll_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id),
    base_salary NUMERIC(15,2) NOT NULL,
    overtime_amount NUMERIC(15,2) DEFAULT 0,
    advances_deducted NUMERIC(15,2) DEFAULT 0,
    other_deductions NUMERIC(15,2) DEFAULT 0,
    nssf_deduction NUMERIC(15,2) DEFAULT 0,
    net_pay NUMERIC(15,2) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.employee_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id),
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'UGX',
    disbursed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    repayment_schedule repayment_plan DEFAULT 'single',
    outstanding_balance NUMERIC(15,2) NOT NULL,
    notes TEXT
);

-- 10. Audit Log & Notifications
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. RLS Enable
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_custodians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies
CREATE POLICY "Allow auth view accounts" ON public.finance_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view exchange_rates" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view donors" ON public.donors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view donations" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view store_orders" ON public.store_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view petty_cash" ON public.petty_cash_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view payroll" ON public.payroll_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth view notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
