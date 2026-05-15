
-- STORE: Inventory, Receiving and Suppliers

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT, -- 'Stationery', 'Food', 'Construction'
  rating INTEGER DEFAULT 5,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  contract_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend inventory or create a tracking table if needed
-- Assuming public.inventory exists from previous turns

CREATE TABLE IF NOT EXISTS public.goods_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id),
  received_by UUID REFERENCES public.profiles(id),
  grn_number TEXT UNIQUE, -- Goods Received Note
  delivery_note_ref TEXT,
  items JSONB, -- Array of {item_id, quantity, unit_price}
  total_value DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  quality_check_passed BOOLEAN DEFAULT true,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow store and admin manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_manager', 'office'))
);

CREATE POLICY "Allow authenticated view goods received" ON public.goods_received FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow store and admin manage goods received" ON public.goods_received FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_manager'))
);
