
-- Sample Curriculum Data
DO $$
DECLARE
    v_class_id UUID;
    v_subject_id UUID;
    v_plan_id UUID;
    v_teacher_id UUID;
BEGIN
    SELECT id INTO v_class_id FROM public.classes LIMIT 1;
    SELECT id INTO v_subject_id FROM public.subjects LIMIT 1;
    SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'teacher' LIMIT 1;

    IF v_class_id IS NOT NULL AND v_subject_id IS NOT NULL THEN
        -- Curriculum Plans
        INSERT INTO public.curriculum_plans (class_id, subject_id, topic_title, sequence_order)
        VALUES 
        (v_class_id, v_subject_id, 'Numbers and Numeracy', 1),
        (v_class_id, v_subject_id, 'Operations on Whole Numbers', 2),
        (v_class_id, v_subject_id, 'Fractions', 3)
        RETURNING id INTO v_plan_id;

        -- Syllabus Coverage
        IF v_teacher_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
            INSERT INTO public.syllabus_coverage (plan_id, teacher_id, status, completion_date)
            VALUES (v_plan_id, v_teacher_id, 'completed', CURRENT_DATE - interval '1 week');
        END IF;
    END IF;
END $$;
