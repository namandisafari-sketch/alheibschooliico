-- Fix inventory duplication issues

-- 1. Drop and recreate the inventory_details view to ensure it includes all columns
DROP VIEW IF EXISTS public.inventory_details;
CREATE OR REPLACE VIEW public.inventory_details AS
SELECT 
    i.*,
    s.quantity as current_stock,
    c.name as category_name
FROM public.inventory_items i
LEFT JOIN public.inventory_stock s ON i.id = s.item_id
LEFT JOIN public.inventory_categories c ON i.category_id = c.id;

GRANT SELECT ON public.inventory_details TO authenticated;

-- 2. Add category TEXT column for backward compatibility (some code may reference it directly)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Populate category from category_id join for existing records
UPDATE public.inventory_items i
SET category = c.name
FROM public.inventory_categories c
WHERE i.category_id = c.id
  AND i.category IS NULL;

-- 4. Ensure inventory_stock has a record for every item (fix missing stock records)
INSERT INTO public.inventory_stock (item_id, quantity)
SELECT id, 0 FROM public.inventory_items
ON CONFLICT (item_id) DO NOTHING;

-- 5. Recalculate stock quantities from transactions
UPDATE public.inventory_stock SET quantity = 0;
UPDATE public.inventory_stock s
SET quantity = s.quantity + t.sum_qty
FROM (
    SELECT item_id, SUM(quantity) as sum_qty
    FROM public.inventory_transactions
    WHERE type IN ('restock', 'return')
    GROUP BY item_id
) t
WHERE s.item_id = t.item_id;
UPDATE public.inventory_stock s
SET quantity = s.quantity - t.sum_qty
FROM (
    SELECT item_id, SUM(quantity) as sum_qty
    FROM public.inventory_transactions
    WHERE type IN ('issuance', 'damage', 'adjustment')
    GROUP BY item_id
) t
WHERE s.item_id = t.item_id;
