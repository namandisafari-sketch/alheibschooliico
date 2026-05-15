
-- Gate & Security Module operations

CREATE TABLE IF NOT EXISTS public.vehicle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  driver_name TEXT,
  phone_number TEXT,
  purpose TEXT,
  vehicle_type TEXT, -- e.g. Car, Truck, Motorcycle, School Bus
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  recorded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exit_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id),
  staff_id UUID REFERENCES public.profiles(id),
  pass_type TEXT CHECK (pass_type IN ('learner', 'staff')),
  reason TEXT,
  departure_target_time TIMESTAMP WITH TIME ZONE,
  return_target_time TIMESTAMP WITH TIME ZONE,
  actual_exit_time TIMESTAMP WITH TIME ZONE,
  actual_return_time TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  verified_by_gate UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'exit', 'returned', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gate_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outgoing_officer_id UUID REFERENCES public.profiles(id),
  incoming_officer_id UUID REFERENCES public.profiles(id),
  shift_date DATE DEFAULT CURRENT_DATE,
  shift_type TEXT, -- Day / Night
  ob_references TEXT, -- Occurrence Book references
  items_handed_over TEXT, -- Keys, radio, etc
  incidents_summary TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_handovers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated view gateway" ON public.vehicle_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow security and admin manage gate" ON public.vehicle_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'security', 'gateman'))
);

CREATE POLICY "Allow authenticated view exit passes" ON public.exit_passes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth manage exit passes" ON public.exit_passes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'security', 'gateman', 'office_manager', 'direct_manager'))
);

CREATE POLICY "Allow authenticated view handovers" ON public.gate_handovers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow security manage handovers" ON public.gate_handovers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'security', 'gateman'))
);
