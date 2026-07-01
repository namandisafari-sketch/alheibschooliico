-- Make English available for P1-P2
UPDATE public.subjects
SET min_class_level = 1
WHERE code = 'ENG' AND min_class_level > 1;

-- Insert Primary One English Term 1 syllabus
DO $$
DECLARE
    p1_id UUID;
    eng_id UUID;
    plan_id UUID;
BEGIN
    SELECT id INTO p1_id FROM public.classes WHERE level = 1 LIMIT 1;
    SELECT id INTO eng_id FROM public.subjects WHERE code = 'ENG' LIMIT 1;

    IF p1_id IS NULL THEN
        RAISE NOTICE 'P1 class not found, skipping';
        RETURN;
    END IF;
    IF eng_id IS NULL THEN
        RAISE NOTICE 'English subject not found, skipping';
        RETURN;
    END IF;

    -- ── Plan 1: Our School - People in Our School (seq 1) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our School – People in Our School', 1, 'Week 1-2: Greetings, titles, nouns, and a poem about school')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Vocabulary – Titles', '["sir", "Madam", "teacher", "miss", "Mrs.", "Mr."]'::jsonb, 2, 1),
    (plan_id, 'Greetings', '["Good morning", "Good afternoon", "Greeting each other"]'::jsonb, 2, 2),
    (plan_id, 'Comprehension – Dialogue', '["Names: Birungi, Kamya, Kalyango, Kizito", "Acting a dialogue"]'::jsonb, 2, 3),
    (plan_id, 'Nouns – Classroom Objects', '["chair, duster, table, window, book, desk, pen, pencil", "chalk, wall, roof, register", "Structures: What is this? That is a…"]'::jsonb, 3, 4),
    (plan_id, 'Poem – Our School', '["Reading a poem", "Answering questions in full sentences"]'::jsonb, 1, 5);

    -- ── Plan 2: Our School - Activities Done at School (seq 2) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our School – Activities Done at School', 2, 'Week 2-3: Letters, alphabetical order, articles, present continuous tense')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Small Letters A–Z', '["A B C D E F G H", "a b c d e f g h i", "Ordering letters and words"]'::jsonb, 3, 1),
    (plan_id, 'Alphabetical Ordering', '["Ordering letters: d, a, c, b", "Ordering words: bag, car, axe, van, tin, window"]'::jsonb, 2, 2),
    (plan_id, 'Articles – a / an', '["Words that take a", "Words that take an"]'::jsonb, 2, 3),
    (plan_id, 'Present Continuous Tense', '["Adding -ing to verbs: sweep→sweeping", "Use of is and are"]'::jsonb, 3, 4),
    (plan_id, 'Pronouns', '["He, she, I, it, we, you, they", "Talking about oneself"]'::jsonb, 2, 5),
    (plan_id, 'Comprehension – Story about School', '["Reading a story", "Answering questions"]'::jsonb, 1, 6),
    (plan_id, 'Composition – Substitution Table', '["I am reading", "She is writing", "We are listening"]'::jsonb, 1, 7);

    -- ── Plan 3: Our Home – People in Our Home (seq 3) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our Home – People in Our Home', 3, 'Week 3-4: Family vocabulary, plural nouns')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Family Vocabulary', '["father, mother, son, sister, brother", "Structures: What is … doing?"]'::jsonb, 2, 1),
    (plan_id, 'Plural Nouns – Add s', '["son→sons", "sister→sisters"]'::jsonb, 1, 2),
    (plan_id, 'Plural Nouns – Add es', '["bench→benches", "mango→mangoes"]'::jsonb, 1, 3),
    (plan_id, 'Plural Nouns – f to ves', '["Changing f to v and adding es"]'::jsonb, 1, 4),
    (plan_id, 'Plural Nouns – y to ies', '["baby→babies", "fly→flies"]'::jsonb, 1, 5),
    (plan_id, 'Comprehension – My Family', '["Reading a story about family", "Answering questions in full sentences"]'::jsonb, 1, 6);

    -- ── Plan 4: Our Home – Things Found in Our Home (seq 4) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our Home – Things Found in Our Home', 4, 'Week 4-6: Opposites, number words, comprehension, composition')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Opposites', '["good–bad, small–big, thin–fat, black–white, soft–hard"]'::jsonb, 2, 1),
    (plan_id, 'Number Words 0–20', '["zero to twenty", "How many are there?"]'::jsonb, 2, 2),
    (plan_id, 'Comprehension – My Home', '["Reading a story about home", "Answering questions in full sentences"]'::jsonb, 1, 3),
    (plan_id, 'Role Play – Activities at Home', '["Role playing activities done at home", "Writing sentences about home activities"]'::jsonb, 2, 4);

    -- ── Plan 5: Our Home – Activities Done at Home – Verbs (seq 5) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our Home – Activities Done at Home', 5, 'Week 5: Present continuous (drop e), guided composition')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Present Continuous – Drop e', '["write→writing", "Structures: What is he/she doing?"]'::jsonb, 2, 1),
    (plan_id, 'Home Vocabulary', '["cup, house, dog, spoon, kitchen, goat, plate, toilet", "cow, table, latrine, sheep, radio, cat, hen", "television, rabbit, pot, duck, bed, mortar, turkey", "shoes, pestle, bird, towel"]'::jsonb, 3, 2),
    (plan_id, 'Comprehension – Dialogue with Milkman', '["Reading and role playing a dialogue", "Answering questions in full sentences"]'::jsonb, 1, 3),
    (plan_id, 'Guided Composition', '["Filling in missing words", "This is a… Her name is Jane…"]'::jsonb, 1, 4);

    -- ── Plan 6: Our Community – People in Our Community (seq 6) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our Community – People in Our Community', 6, 'Week 6-7: Community workers, punctuation, comprehension')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Community Workers Vocabulary', '["teacher, doctor, pastor, policeman, nurse, carpenter", "barber, bishop, priest, imam, pilot, driver"]'::jsonb, 3, 1),
    (plan_id, 'Punctuation – Capital Letters', '["Names of people, places, days, months", "Starting a sentence"]'::jsonb, 2, 2),
    (plan_id, 'Comprehension – People in Our Community', '["Reading a story", "Answering questions in full sentences"]'::jsonb, 1, 3),
    (plan_id, 'Composition – Jumbled Words', '["Arranging words to make sentences"]'::jsonb, 1, 4);

    -- ── Plan 7: Our Community – Important Places (seq 7) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our Community – Important Places', 7, 'Week 7-8: Places, prepositions, comprehension dialogue')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Places Vocabulary', '["market, church, mosque, shop, school, bank", "hospital, police station, post office, radio station", "Structures: Where is the…? Show me a…?"]'::jsonb, 2, 1),
    (plan_id, 'Prepositions', '["under, near, in, on, over, behind, in front of, between"]'::jsonb, 2, 2),
    (plan_id, 'Comprehension – Dialogue', '["Dialogue between Ritah and Peter", "Role play"]'::jsonb, 1, 3),
    (plan_id, 'Composition – Substitution Table', '["They go to school to learn", "They go to church to pray"]'::jsonb, 1, 4);

    -- ── Plan 8: Our Community – Activities in Our Community (seq 8) ──
    INSERT INTO public.curriculum_plans (class_id, subject_id, term, academic_year, topic_title, sequence_order, description)
    VALUES (p1_id, eng_id, 'term_1', 2026, 'Our Community – Activities in Our Community', 8, 'Week 8: Action verbs, continuous tense (double consonant), places of work')
    RETURNING id INTO plan_id;

    INSERT INTO public.curriculum_topics (curriculum_plan_id, title, sub_topics, expected_lessons, sequence_order) VALUES
    (plan_id, 'Action Verbs', '["harvest, sell, plant, dry, weed, farm, wash, trade, build"]'::jsonb, 2, 1),
    (plan_id, 'Present Continuous – Double Consonant', '["cut→cutting, skip→skipping", "Structures: What is he/she doing?"]'::jsonb, 2, 2),
    (plan_id, 'People and Their Places of Work', '["teacher→school, farmer→garden, priest→church", "Interpreting pictures and writing sentences"]'::jsonb, 2, 3),
    (plan_id, 'Comprehension – Important Places Story', '["Reading a story on important places in our community"]'::jsonb, 1, 4);

    RAISE NOTICE 'P1 English Term 1 scheme inserted successfully';
END $$;
