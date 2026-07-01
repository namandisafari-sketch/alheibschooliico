-- Temporary Workers / Contractors Gate Management

CREATE TABLE IF NOT EXISTS public.temp_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  id_number TEXT,
  photo_url TEXT,
  purpose TEXT,
  supervised_by TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.temp_worker_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_worker_id UUID NOT NULL REFERENCES public.temp_workers(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.temp_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temp_worker_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gate staff manage temp workers" ON public.temp_workers;
CREATE POLICY "Gate staff manage temp workers"
  ON public.temp_workers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'gateman') OR public.has_role(auth.uid(), 'security'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'gateman') OR public.has_role(auth.uid(), 'security'));

DROP POLICY IF EXISTS "Gate staff manage temp worker logs" ON public.temp_worker_logs;
CREATE POLICY "Gate staff manage temp worker logs"
  ON public.temp_worker_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'gateman') OR public.has_role(auth.uid(), 'security'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'gateman') OR public.has_role(auth.uid(), 'security'));

CREATE INDEX IF NOT EXISTS idx_temp_workers_status ON public.temp_workers(status);
CREATE INDEX IF NOT EXISTS idx_temp_worker_logs_worker ON public.temp_worker_logs(temp_worker_id);
CREATE INDEX IF NOT EXISTS idx_temp_worker_logs_check_in ON public.temp_worker_logs(check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_temp_worker_logs_status ON public.temp_worker_logs(status);
