
-- Sample data for Academic Warnings and Lesson Plans to populate DOS Dashboard
-- Assuming we have some learners and teachers already

INSERT INTO public.academic_warnings (learner_id, teacher_id, category, details, status)
SELECT 
  l.id as learner_id, 
  p.id as teacher_id, 
  'Unsatisfactory Progress' as category,
  'Consistently scoring below 40% in Mathematics mid-term assessments.' as details,
  'active' as status
FROM public.learners l
CROSS JOIN public.profiles p
WHERE p.role = 'teacher'
LIMIT 3;

-- Sample Lesson Plans
INSERT INTO public.lesson_plans (teacher_id, class_id, subject_id, title, objectives, status, week_number)
SELECT 
  p.id as teacher_id,
  c.id as class_id,
  s.id as subject_id,
  'Introduction to Algebra' as title,
  'Learners should be able to solve simple linear equations.' as objectives,
  'pending' as status,
  5 as week_number
FROM public.profiles p
CROSS JOIN public.classes c
CROSS JOIN public.subjects s
WHERE p.role = 'teacher'
LIMIT 5;
