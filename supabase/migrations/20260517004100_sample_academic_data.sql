
-- Sample Academic Data
DO $$
DECLARE
    v_teacher_id UUID;
    v_subject_id UUID;
    v_class_id UUID;
    v_learner_id UUID;
    v_dos_id UUID;
BEGIN
    -- Get some existing IDs
    SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'teacher' LIMIT 1;
    SELECT id INTO v_subject_id FROM public.subjects LIMIT 1;
    SELECT id INTO v_class_id FROM public.classes LIMIT 1;
    SELECT id INTO v_learner_id FROM public.learners LIMIT 1;
    SELECT id INTO v_dos_id FROM public.profiles WHERE role IN ('admin', 'head_teacher', 'dos') LIMIT 1;

    -- Lesson Plans
    IF v_teacher_id IS NOT NULL AND v_subject_id IS NOT NULL AND v_class_id IS NOT NULL THEN
        INSERT INTO public.lesson_plans (teacher_id, subject_id, class_id, title, week_number, term, status)
        VALUES 
        (v_teacher_id, v_subject_id, v_class_id, 'Intro to Algebra', 2, 'term_2', 'pending'),
        (v_teacher_id, v_subject_id, v_class_id, 'Grammar Review', 2, 'term_2', 'approved');
    END IF;

    -- Academic Warnings
    IF v_learner_id IS NOT NULL AND v_subject_id IS NOT NULL THEN
        INSERT INTO public.academic_warnings (learner_id, subject_id, reason, severity, status)
        VALUES 
        (v_learner_id, v_subject_id, 'Consistently low scores in weekly quizzes', 'high', 'active');
    END IF;

    -- Exam Series
    INSERT INTO public.exam_series (name, term, status)
    VALUES 
    ('Mid-Term Series II', 'term_2', 'scheduled'),
    ('End of Term Examination', 'term_2', 'scheduled');

    -- Lesson Observations
    IF v_teacher_id IS NOT NULL AND v_class_id IS NOT NULL AND v_dos_id IS NOT NULL THEN
        INSERT INTO public.lesson_observations (teacher_id, observed_by, class_id, score, strengths)
        VALUES 
        (v_teacher_id, v_dos_id, v_class_id, 85, 'Good classroom management and student engagement');
    END IF;
END $$;
