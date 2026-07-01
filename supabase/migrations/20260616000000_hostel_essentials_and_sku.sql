-- Auto-generate SKU for inventory_items on insert
CREATE OR REPLACE FUNCTION public.generate_item_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL THEN
    NEW.sku := 'ITM-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_item_sku ON public.inventory_items;
CREATE TRIGGER tr_generate_item_sku
BEFORE INSERT ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.generate_item_sku();

-- Seed Hostel Essentials items (skip any that already exist by name)
WITH cat AS (
  SELECT id FROM public.inventory_categories WHERE name = 'Hostel Essentials' LIMIT 1
),
items_to_insert (name, unit, min_stock) AS (VALUES
  ('Bucket',                  'pieces', 50),
  ('Cleaning Soap',           'pieces', 30),
  ('Broom',                   'pieces', 40),
  ('Disinfectant',            'litres', 20),
  ('Mattress',                'pieces', 30),
  ('Mosquito Net',            'pieces', 30),
  ('Bed Sheet',               'pieces', 40),
  ('Pillow',                  'pieces', 30),
  ('Pillow Case',             'pieces', 40),
  ('Blanket',                 'pieces', 20),
  ('Cup / Mug',               'pieces', 50),
  ('Plate',                   'pieces', 50),
  ('Spoon',                   'pieces', 50),
  ('Toothbrush',              'pieces', 50),
  ('Toothpaste',              'pieces', 30),
  ('Towel',                   'pieces', 40),
  ('Soap (Laundry)',          'pieces', 40),
  ('Shoe Polish',             'pieces', 20),
  ('Vaseline / Body Lotion',  'pieces', 20),
  ('School Uniform (Set)',    'pieces', 20),
  ('Sweater',                 'pieces', 20),
  ('Track Suit',              'pieces', 15)
)
INSERT INTO public.inventory_items (name, unit, category_id, min_stock_level)
SELECT ti.name, ti.unit, cat.id, ti.min_stock
FROM cat, items_to_insert ti
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_items WHERE name = ti.name
);

-- Initialize stock at 0 for newly inserted items
INSERT INTO public.inventory_stock (item_id, quantity)
SELECT i.id, 0
FROM public.inventory_items i
WHERE i.sku IS NOT NULL
  AND i.id NOT IN (SELECT item_id FROM public.inventory_stock);
