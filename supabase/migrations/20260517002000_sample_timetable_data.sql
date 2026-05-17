
-- Sample data for class_timetables
-- Link some subjects and teachers to classes

INSERT INTO public.class_timetables (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, term)
SELECT 
    c.id as class_id,
    s.id as subject_id,
    p.id as teacher_id,
    1 as day_of_week, -- Monday
    '08:30:00'::TIME as start_time,
    '09:30:00'::TIME as end_time,
    'term_1' as term
FROM public.classes c
CROSS JOIN public.subjects s
CROSS JOIN public.profiles p
WHERE c.name = 'Primary One' AND s.name = 'English' AND p.role = 'teacher'
LIMIT 1;

INSERT INTO public.class_timetables (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, term)
SELECT 
    c.id as class_id,
    s.id as subject_id,
    p.id as teacher_id,
    1 as day_of_week, -- Monday
    '09:30:00'::TIME as start_time,
    '10:30:00'::TIME as end_time,
    'term_1' as term
FROM public.classes c
CROSS JOIN public.subjects s
CROSS JOIN public.profiles p
WHERE c.name = 'Primary One' AND s.name = 'Mathematics' AND p.role = 'teacher'
LIMIT 1;
