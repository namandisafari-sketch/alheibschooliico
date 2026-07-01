-- Pharmacy Enhancement: Prescriptions, Inventory Batches, Emergencies, Realtime

-- 1. Prescriptions - full prescription management
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  doctor_name TEXT,
  diagnosis TEXT,
  medication TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  quantity INTEGER DEFAULT 1,
  prescribed_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled', 'completed')),
  pharmacy_item_id UUID REFERENCES public.pharmacy_items(id) ON DELETE SET NULL,
  notes TEXT,
  prescribed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescriptions read" ON public.prescriptions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher', 'deputy_head_teacher', 'teacher'))
  );

CREATE POLICY "prescriptions write" ON public.prescriptions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')));

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Pharmacy inventory batches
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_item_id UUID REFERENCES public.pharmacy_items(id) ON DELETE CASCADE,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  received_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pharmacy_inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_batches read" ON public.pharmacy_inventory_batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inventory_batches write" ON public.pharmacy_inventory_batches
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')));

-- 3. Pharmacy emergencies
CREATE TABLE IF NOT EXISTS public.pharmacy_emergencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  emergency_type TEXT NOT NULL,
  description TEXT,
  action_taken TEXT,
  medication_administered TEXT,
  referred_to TEXT,
  reported_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stabilized', 'referred', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pharmacy_emergencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergencies read" ON public.pharmacy_emergencies
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher', 'deputy_head_teacher'))
  );

CREATE POLICY "emergencies write" ON public.pharmacy_emergencies
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher')));

DROP TRIGGER IF EXISTS update_pharmacy_emergencies_updated_at ON public.pharmacy_emergencies;
CREATE TRIGGER update_pharmacy_emergencies_updated_at BEFORE UPDATE ON public.pharmacy_emergencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Reorder requests for low stock items
CREATE TABLE IF NOT EXISTS public.pharmacy_reorder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_item_id UUID REFERENCES public.pharmacy_items(id) ON DELETE CASCADE,
  quantity_needed INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  requested_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pharmacy_reorder_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reorder read" ON public.pharmacy_reorder_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reorder write" ON public.pharmacy_reorder_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')));

DROP TRIGGER IF EXISTS update_reorder_requests_updated_at ON public.pharmacy_reorder_requests;
CREATE TRIGGER update_reorder_requests_updated_at BEFORE UPDATE ON public.pharmacy_reorder_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Add columns to pharmacy_items for real pharmacy tracking
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 5;
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.pharmacy_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 6. Add status column to health_visits for active/discharged tracking
ALTER TABLE public.health_visits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'referred'));

-- 7. Notification table for realtime pharmacy alerts
CREATE TABLE IF NOT EXISTS public.pharmacy_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  related_entity TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pharmacy_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications read" ON public.pharmacy_notifications
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'head_teacher', 'deputy_head_teacher'))
  );

CREATE POLICY "notifications write" ON public.pharmacy_notifications
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'nurse')));

-- 8. Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_inventory_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_reorder_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_notifications;
