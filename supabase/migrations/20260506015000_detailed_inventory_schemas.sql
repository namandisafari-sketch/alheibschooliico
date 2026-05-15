
-- Enhance Inventory Items with more details
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS storage_location TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb;

-- Enhance Assets with more details
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS next_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS asset_tag_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS technical_details JSONB DEFAULT '{}'::jsonb;

-- Create a helper function to get full item details including stock
CREATE OR REPLACE VIEW public.inventory_details AS
SELECT 
    i.*,
    s.quantity as current_stock,
    c.name as category_name
FROM public.inventory_items i
LEFT JOIN public.inventory_stock s ON i.id = s.item_id
LEFT JOIN public.inventory_categories c ON i.category_id = c.id;

GRANT SELECT ON public.inventory_details TO authenticated;
