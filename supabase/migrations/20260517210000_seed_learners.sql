
-- Seed data for learners to populate the dashboard stats
DO $$
DECLARE
  v_class_p1 uuid;
  v_class_p2 uuid;
  v_class_p3 uuid;
  v_class_p7 uuid;
BEGIN
  -- Get some class IDs
  SELECT id INTO v_class_p1 FROM public.classes WHERE name ILIKE '%P1%' LIMIT 1;
  SELECT id INTO v_class_p2 FROM public.classes WHERE name ILIKE '%P2%' LIMIT 1;
  SELECT id INTO v_class_p3 FROM public.classes WHERE name ILIKE '%P3%' LIMIT 1;
  SELECT id INTO v_class_p7 FROM public.classes WHERE name ILIKE '%P7%' LIMIT 1;

  -- Insert sample learners if the table is empty
  IF NOT EXISTS (SELECT 1 FROM public.learners LIMIT 1) THEN
    INSERT INTO public.learners (full_name, gender, admission_number, class_id, status, religion, pupil_status)
    VALUES 
      ('Musa Hassan', 'male', 'ALH/2024/001', v_class_p1, 'active', 'Islam', 'Paying'),
      ('Fatuma Zahara', 'female', 'ALH/2024/002', v_class_p1, 'active', 'Islam', 'Bait Zakat'),
      ('Ibrahim Kalungi', 'male', 'ALH/2024/003', v_class_p2, 'active', 'Islam', 'Paying'),
      ('Mariam Nabatanzi', 'female', 'ALH/2024/004', v_class_p2, 'active', 'Islam', 'IICO'),
      ('Yusuf Semakula', 'male', 'ALH/2024/005', v_class_p3, 'active', 'Islam', 'Community'),
      ('Zainab Namutebi', 'female', 'ALH/2024/006', v_class_p3, 'active', 'Islam', 'Paying'),
      ('Sulaiman Kato', 'male', 'ALH/2024/007', v_class_p7, 'active', 'Islam', 'Paying'),
      ('Aisha Nansubuga', 'female', 'ALH/2024/008', v_class_p7, 'active', 'Islam', 'Paying');
  END IF;

  -- Insert some test teachers if empty
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'teacher' LIMIT 1) THEN
    -- Assuming some profile IDs might exist or we just use the ones from sample data
    -- But since we want the stats to show up on dashboard, we can just ensure profiles counts
    UPDATE public.profiles SET role = 'teacher' WHERE email LIKE '%teacher%' OR email LIKE '%staff%';
  END IF;
END $$;
