-- Fix duplicate assets: add quantity column and merge duplicate rows
-- that were bulk-imported as individual rows instead of quantities

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1);

WITH grouped AS (
  SELECT MIN(id) as keep_id, name, COALESCE(location, '') as loc, COUNT(*) as total
  FROM public.assets
  WHERE serial_number IS NULL AND asset_tag_id IS NULL
  GROUP BY name, COALESCE(location, '')
  HAVING COUNT(*) > 1
)
UPDATE public.assets a
SET quantity = g.total
FROM grouped g
WHERE a.id = g.keep_id;

DELETE FROM public.assets a
USING (
  SELECT id, name, COALESCE(location, '') as loc,
         ROW_NUMBER() OVER (PARTITION BY name, COALESCE(location, '') ORDER BY id) as rn
  FROM public.assets
  WHERE serial_number IS NULL AND asset_tag_id IS NULL
) dup
WHERE a.id = dup.id AND dup.rn > 1;

-- Fix timetable UNIQUE constraint to include term
ALTER TABLE public.class_timetables
  DROP CONSTRAINT IF EXISTS uq_class_slot;

ALTER TABLE public.class_timetables
  ADD CONSTRAINT uq_class_slot UNIQUE (class_id, day_of_week, start_time, term);
