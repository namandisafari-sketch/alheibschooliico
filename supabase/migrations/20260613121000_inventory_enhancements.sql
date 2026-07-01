-- Enhance Inventory to match the physical forms (Fixed/Mobile asset classification)

-- 1. Add classification to inventory_items (matches form: Fixed/مثاب or Mobile/متحرك)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'mobile' CHECK (classification IN ('fixed', 'mobile'));

-- 2. Add classification to assets 
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'fixed' CHECK (classification IN ('fixed', 'mobile'));

-- 3. Add custodian acknowledgment fields (matches form signature section)
ALTER TABLE public.inventory_transactions
ADD COLUMN IF NOT EXISTS custodian_acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custodian_acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auditor_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS auditor_approved_at TIMESTAMP WITH TIME ZONE;

-- 4. Add WhatsApp notification preferences table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  notify_low_stock BOOLEAN DEFAULT true,
  notify_issuance BOOLEAN DEFAULT true,
  notify_receiving BOOLEAN DEFAULT true,
  notify_gate_pass BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow auth manage whatsapp settings"
  ON public.whatsapp_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 5. Refresh realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.whatsapp_settings;
