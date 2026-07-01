-- Add unique constraint for teacher onboarding upsert (teacher_id + subject_id + academic_year without class_id)
ALTER TABLE public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_teacher_id_subject_id_academic_year_key;
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_teacher_id_subject_id_academic_year_key UNIQUE (teacher_id, subject_id, academic_year);
