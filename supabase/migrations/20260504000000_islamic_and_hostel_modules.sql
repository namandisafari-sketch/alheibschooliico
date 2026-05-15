
-- Islamic Education and Hostel Management Modules

-- 1. Quran and Hifdh Tracking
CREATE TABLE IF NOT EXISTS public.quran_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  surah_name TEXT NOT NULL,
  last_ayah INTEGER NOT NULL,
  tajweed_score INTEGER CHECK (tajweed_score BETWEEN 1 AND 10),
  hifdh_type TEXT CHECK (hifdh_type IN ('memorization', 'revision', 'reading')),
  teacher_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Salah Attendance Tracking
CREATE TABLE IF NOT EXISTS public.salah_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  prayer_name TEXT CHECK (prayer_name IN ('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Tahajjud')),
  status TEXT CHECK (status IN ('Jamaah', 'Individual', 'Excused', 'Missed')),
  date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_id, prayer_name, date)
);

-- 3. Character Building (Akhlaaq)
CREATE TABLE IF NOT EXISTS public.akhlaaq_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  trait_category TEXT NOT NULL, -- e.g., 'Honesty', 'Respect', 'Cleanliness'
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  term term_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Hostel Logistics & Inventory Extensions
-- (Using existing inventory_items for buckets, boots, etc. to link to learners)
CREATE TABLE IF NOT EXISTS public.hostel_issuances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory_items(id),
  status TEXT CHECK (status IN ('Issued', 'Returned', 'Damaged', 'Lost')),
  condition_at_issue TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE
);

-- 5. Washing Machine Management
CREATE TABLE IF NOT EXISTS public.washing_machine_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES public.assets(id),
  operator_id UUID REFERENCES public.profiles(id),
  soap_detergent_id UUID REFERENCES public.inventory_items(id),
  soap_quantity_used DECIMAL(10,2),
  loads_count INTEGER DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'completed',
  notes TEXT
);

-- 6. Visitor Management Extension
-- (Existing Visitors table likely exists, adding Visitor ID generation support)
ALTER TABLE IF EXISTS public.visitors 
ADD COLUMN IF NOT EXISTS visitor_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_printed BOOLEAN DEFAULT false;

-- 7. Procurement & Budgeting
CREATE TABLE IF NOT EXISTS public.budget_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id),
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partially_funded')),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on all new tables
ALTER TABLE public.quran_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salah_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akhlaaq_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washing_machine_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_requests ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Allow auth manage quran_progress" ON public.quran_progress FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage salah_attendance" ON public.salah_attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage akhlaaq_reports" ON public.akhlaaq_reports FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage hostel_issuances" ON public.hostel_issuances FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage washing_machine_usage" ON public.washing_machine_usage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth manage budget_requests" ON public.budget_requests FOR ALL TO authenticated USING (true);
