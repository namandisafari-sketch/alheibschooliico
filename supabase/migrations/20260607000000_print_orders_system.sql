-- Print Orders System
-- Tables for uploading work and managing download permissions

CREATE TABLE IF NOT EXISTS public.print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  file_url text,
  file_path text,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'printing', 'completed'))
);

ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "print_orders read own" ON public.print_orders;
CREATE POLICY "print_orders read own" ON public.print_orders FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM print_order_permissions 
           WHERE order_id = print_orders.id AND user_id = auth.uid()
         ));

DROP POLICY IF EXISTS "print_orders create" ON public.print_orders;
CREATE POLICY "print_orders create" ON public.print_orders FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "print_orders update own" ON public.print_orders;
CREATE POLICY "print_orders update own" ON public.print_orders FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "print_orders delete own" ON public.print_orders;
CREATE POLICY "print_orders delete own" ON public.print_orders FOR DELETE TO authenticated
  USING (created_by = auth.uid());


CREATE TABLE IF NOT EXISTS public.print_order_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.print_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_download boolean NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(order_id, user_id)
);

ALTER TABLE public.print_order_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perms read" ON public.print_order_permissions;
CREATE POLICY "perms read" ON public.print_order_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM print_orders WHERE id = order_id AND created_by = auth.uid()
         ));

DROP POLICY IF EXISTS "perms write" ON public.print_order_permissions;
CREATE POLICY "perms write" ON public.print_order_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM print_orders WHERE id = order_id AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM print_orders WHERE id = order_id AND created_by = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_print_orders_created_by ON public.print_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON public.print_orders(status);
CREATE INDEX IF NOT EXISTS idx_print_order_permissions_user ON public.print_order_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_print_order_permissions_order ON public.print_order_permissions(order_id);
