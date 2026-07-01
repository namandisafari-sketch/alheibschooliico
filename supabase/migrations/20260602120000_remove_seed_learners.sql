-- Remove seed learner data to prepare for real import
DELETE FROM public.learner_documents WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.learner_essentials WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.learner_medical WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.parent_learner_links WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.student_progress_snapshots WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.attendance WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.term_results WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.discipline_cases WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.fee_payments WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.learner_essentials WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.learner_medical WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.homework_submissions WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.library_loans WHERE borrower_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.library_members WHERE learner_id IN (
  SELECT id FROM public.learners WHERE admission_number LIKE 'ALH/2024/%'
);
DELETE FROM public.learners WHERE admission_number LIKE 'ALH/2024/%';
