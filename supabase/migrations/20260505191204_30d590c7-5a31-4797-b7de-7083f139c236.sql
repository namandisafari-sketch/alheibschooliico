
-- Dormitories
CREATE TABLE public.dormitories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('boys','girls','mixed')),
  capacity integer NOT NULL DEFAULT 30,
  matron_staff_id uuid,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage dormitories" ON public.dormitories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Authenticated view dormitories" ON public.dormitories
  FOR SELECT TO authenticated USING (true);

-- Residency assignments
CREATE TABLE public.dormitory_residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dormitory_id uuid NOT NULL REFERENCES public.dormitories(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL,
  bed_number text,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  released_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_active_resident ON public.dormitory_residents(learner_id) WHERE is_active = true;
ALTER TABLE public.dormitory_residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage residents" ON public.dormitory_residents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Authenticated view residents" ON public.dormitory_residents
  FOR SELECT TO authenticated USING (true);

-- Per-learner essentials issuance log (references inventory_items)
CREATE TABLE public.learner_essentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  issued_by uuid,
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('good','damaged','missing','returned','replaced')),
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','missing','damaged','returned')),
  returned_date date,
  replacement_for uuid REFERENCES public.learner_essentials(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_learner_essentials_learner ON public.learner_essentials(learner_id);
ALTER TABLE public.learner_essentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and staff manage essentials" ON public.learner_essentials
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Teachers view essentials" ON public.learner_essentials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Parents view linked children essentials" ON public.learner_essentials
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_learner_links WHERE parent_user_id = auth.uid() AND learner_id = learner_essentials.learner_id));

CREATE TRIGGER trg_dorms_updated BEFORE UPDATE ON public.dormitories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_essentials_updated BEFORE UPDATE ON public.learner_essentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Hostel Essentials category if missing
INSERT INTO public.inventory_categories (name, description)
SELECT 'Hostel Essentials', 'Personal items issued to dormitory residents (sheets, mattresses, cups, buckets, mosquito nets, etc.)'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_categories WHERE name = 'Hostel Essentials');
