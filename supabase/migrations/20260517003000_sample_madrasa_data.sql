
-- Sample data for Madrasa
INSERT INTO public.quran_progress (learner_id, surah_name, last_ayah, tajweed_score, hifdh_type, teacher_id)
SELECT 
  l.id as learner_id, 
  'Al-Baqarah' as surah_name, 
  145 as last_ayah, 
  8 as tajweed_score, 
  'memorization' as hifdh_type,
  p.id as teacher_id
FROM public.learners l
CROSS JOIN public.profiles p
WHERE p.role = 'teacher'
LIMIT 5;

INSERT INTO public.salah_attendance (learner_id, prayer_name, status, date)
SELECT 
  l.id as learner_id, 
  'Dhuhr' as prayer_name, 
  'Jamaah' as status,
  CURRENT_DATE as date
FROM public.learners l
LIMIT 10;

INSERT INTO public.akhlaaq_reports (learner_id, trait_category, rating, comments, teacher_id)
SELECT 
  l.id as learner_id, 
  'Honesty' as trait_category, 
  5 as rating, 
  'Very honest and truthful.' as comments,
  p.id as teacher_id
FROM public.learners l
CROSS JOIN public.profiles p
WHERE p.role = 'teacher'
LIMIT 5;
