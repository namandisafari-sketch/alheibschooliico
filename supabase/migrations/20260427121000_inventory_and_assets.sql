
-- Inventory and Assets Tracking System

-- 1. Create Categories for Items
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pieces',
  sku TEXT UNIQUE,
  min_stock_level INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Stock Table
CREATE TABLE IF NOT EXISTS public.inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Transaction Types Enum if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transaction_type') THEN
        CREATE TYPE inventory_transaction_type AS ENUM ('restock', 'issuance', 'return', 'adjustment', 'damage');
    END IF;
END $$;

-- 5. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type inventory_transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  learner_id UUID REFERENCES public.learners(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  serial_number TEXT UNIQUE,
  purchase_date DATE,
  purchase_cost NUMERIC(12,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'disposed')),
  condition TEXT DEFAULT 'good',
  location TEXT,
  assigned_to_staff UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Trigger to Update Stock automatically
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- For new transactions, update the stock level
    IF (TG_OP = 'INSERT') THEN
        -- Ensure stock record exists
        INSERT INTO public.inventory_stock (item_id, quantity)
        VALUES (NEW.item_id, 0)
        ON CONFLICT (item_id) DO NOTHING;

        IF (NEW.type = 'restock' OR NEW.type = 'return') THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity + NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        ELSIF (NEW.type = 'issuance' OR NEW.type = 'damage' OR NEW.type = 'adjustment') THEN
            UPDATE public.inventory_stock 
            SET quantity = quantity - NEW.quantity, last_updated = NOW()
            WHERE item_id = NEW.item_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_inventory_stock ON public.inventory_transactions;
CREATE TRIGGER tr_update_inventory_stock
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();

-- 8. Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (Allow authenticated users to manage)
CREATE POLICY "Allow auth view categories" ON public.inventory_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage categories" ON public.inventory_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow auth view items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage items" ON public.inventory_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow auth view stock" ON public.inventory_stock FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow auth view transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth insert transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow auth view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage assets" ON public.assets FOR ALL TO authenticated USING (true);

-- 10. Seed some initial categories
INSERT INTO public.inventory_categories (name, description) VALUES
('Stationery', 'Pens, pencils, notebooks, and office supplies'),
('Uniforms', 'Student and staff uniforms'),
('Electronics', 'Computers, printers, and teaching aids'),
('Furniture', 'Desks, chairs, and cupboards'),
('Sports', 'Balls, nets, and sports equipment')
ON CONFLICT (name) DO NOTHING;

-- 11. Ensure every item HAS a stock record and initialize/recalculate
-- This fixes any existing data inconsistencies
DO $$
BEGIN
    -- 1. Create missing stock records
    INSERT INTO public.inventory_stock (item_id, quantity)
    SELECT id, 0 FROM public.inventory_items
    ON CONFLICT (item_id) DO NOTHING;

    -- 2. Reset all stock to 0 before recalculating
    UPDATE public.inventory_stock SET quantity = 0;

    -- 3. Add Restocks and Returns
    UPDATE public.inventory_stock s
    SET quantity = s.quantity + t.sum_qty
    FROM (
        SELECT item_id, SUM(quantity) as sum_qty
        FROM public.inventory_transactions
        WHERE type IN ('restock', 'return')
        GROUP BY item_id
    ) t
    WHERE s.item_id = t.item_id;

    -- 4. Subtract Issuances, Damages, and Adjustments
    -- Note: This assumes 'adjustment' in transactions is always a positive number representing a deduction.
    -- If adjustments can be positive or negative, this logic would need to be split.
    UPDATE public.inventory_stock s
    SET quantity = s.quantity - t.sum_qty
    FROM (
        SELECT item_id, SUM(quantity) as sum_qty
        FROM public.inventory_transactions
        WHERE type IN ('issuance', 'damage', 'adjustment')
        GROUP BY item_id
    ) t
    WHERE s.item_id = t.item_id;
END $$;
