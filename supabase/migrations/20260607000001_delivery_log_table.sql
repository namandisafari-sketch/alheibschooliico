-- Delivery Log Table for Secretary/Office Operations
-- Track incoming packages and deliveries to the school

CREATE TABLE IF NOT EXISTS public.delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  sender text,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  logged_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_delivery_status CHECK (status IN ('pending', 'delivered', 'unclaimed'))
);

ALTER TABLE public.delivery_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "delivery_log read" ON public.delivery_log;
CREATE POLICY "delivery_log read" ON public.delivery_log FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "delivery_log insert" ON public.delivery_log;
CREATE POLICY "delivery_log insert" ON public.delivery_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "delivery_log update" ON public.delivery_log;
CREATE POLICY "delivery_log update" ON public.delivery_log FOR UPDATE TO authenticated
  USING (
    logged_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary', 'office_manager')
    )
  );

DROP POLICY IF EXISTS "delivery_log delete" ON public.delivery_log;
CREATE POLICY "delivery_log delete" ON public.delivery_log FOR DELETE TO authenticated
  USING (
    logged_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary', 'office_manager')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_status ON public.delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_delivery_logged_by ON public.delivery_log(logged_by);
CREATE INDEX IF NOT EXISTS idx_delivery_created_at ON public.delivery_log(created_at DESC);
