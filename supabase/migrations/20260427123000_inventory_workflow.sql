
-- Advanced Inventory Tracking & Approval System

-- 1. Update items to include Custodian (Person in Charge)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS custodian_id UUID REFERENCES public.profiles(id);

-- 2. Update Transactions to support Approval Workflow and Tracking Numbers
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'dispatched', 'completed'));
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS gate_pass_id TEXT UNIQUE;

-- 3. Create Gate Passes Table
CREATE TABLE IF NOT EXISTS public.inventory_gate_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.inventory_transactions(id) ON DELETE CASCADE,
  pass_number TEXT UNIQUE NOT NULL,
  security_checked_by UUID REFERENCES public.profiles(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Function to generate tracking numbers automatically
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
BEGIN
    IF NEW.tracking_number IS NULL THEN
        prefix := CASE 
            WHEN NEW.type = 'issuance' THEN 'ISS-'
            WHEN NEW.type = 'restock' THEN 'REC-'
            ELSE 'TRX-'
        END;
        NEW.tracking_number := prefix || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_generate_tracking_number
BEFORE INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

-- 5. Update the stock update trigger to ONLY update stock when status is 'approved' or if it's a 'restock'
-- Restocks are usually immediate, but issuances need approval.
-- 5. Update the stock update trigger to ONLY update stock when status is 'approved' or if it's an immediate type
-- Restocks, Returns, and Damages are usually immediate, but issuances need approval.
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
DECLARE
    is_becoming_approved BOOLEAN;
BEGIN
    -- Ensure stock record exists
    INSERT INTO public.inventory_stock (item_id, quantity)
    VALUES (NEW.item_id, 0)
    ON CONFLICT (item_id) DO NOTHING;

    -- Determine if this is a new approved transaction or an existing one becoming approved
    is_becoming_approved := (NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status = 'pending'));

    -- Update quantity based on type
    IF (NEW.type = 'restock' OR NEW.type = 'return') THEN
        -- Additions: Restocks and Returns are usually auto-approved or immediate
        IF (TG_OP = 'INSERT' OR (NEW.status = 'approved' AND OLD.status = 'pending')) THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity + NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        END IF;
    ELSIF (NEW.type = 'issuance' OR NEW.type = 'damage' OR NEW.type = 'adjustment') THEN
        -- Deductions: Only subtract when it becomes approved
        IF (is_becoming_approved) THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity - NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger as AFTER INSERT OR UPDATE
DROP TRIGGER IF EXISTS tr_update_inventory_stock ON public.inventory_transactions;
CREATE TRIGGER tr_update_inventory_stock
AFTER INSERT OR UPDATE ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();

-- 6. RLS for Gate Passes
ALTER TABLE public.inventory_gate_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow auth view gate passes" ON public.inventory_gate_passes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage gate passes" ON public.inventory_gate_passes FOR ALL TO authenticated USING (true);
