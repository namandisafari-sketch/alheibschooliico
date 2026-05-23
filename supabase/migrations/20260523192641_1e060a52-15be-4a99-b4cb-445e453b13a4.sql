
-- Round 2: more cleanup

-- Fix remaining function search_paths
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.generate_tracking_number() SET search_path = public;
ALTER FUNCTION public.generate_discipline_case_number() SET search_path = public;
ALTER FUNCTION public.set_leave_form_ref() SET search_path = public;

-- Drop remaining blanket "USING (true)" non-SELECT policies, replace with role-scoped
DROP POLICY IF EXISTS "Allow auth manage assets" ON public.assets;
CREATE POLICY "assets staff manage" ON public.assets FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'director'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'director'));

DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.attendance;
CREATE POLICY "attendance staff manage" ON public.attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'));

DROP POLICY IF EXISTS "Allow auth all class_timetables" ON public.class_timetables;
CREATE POLICY "timetables staff manage" ON public.class_timetables FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'));

DROP POLICY IF EXISTS "Authenticated users can manage classes" ON public.classes;
CREATE POLICY "classes staff manage" ON public.classes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'));

DROP POLICY IF EXISTS "Allow auth all curriculum_plans" ON public.curriculum_plans;
CREATE POLICY "curriculum staff manage" ON public.curriculum_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Allow auth manage digital_homework" ON public.digital_homework;
CREATE POLICY "digital_homework staff manage" ON public.digital_homework FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Allow all to authenticated - exam_series" ON public.exam_series;
CREATE POLICY "exam_series staff manage" ON public.exam_series FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'teacher'));

DROP POLICY IF EXISTS "Allow auth all exam_timetable" ON public.exam_timetable;
CREATE POLICY "exam_timetable staff manage" ON public.exam_timetable FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Allow auth manage hostel_issuances" ON public.hostel_issuances;
CREATE POLICY "hostel_issuances staff manage" ON public.hostel_issuances FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager'));

DROP POLICY IF EXISTS "Allow auth manage categories" ON public.inventory_categories;
CREATE POLICY "inv_cat staff manage" ON public.inventory_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper'));

DROP POLICY IF EXISTS "Allow auth manage gate passes" ON public.inventory_gate_passes;
CREATE POLICY "gate_passes staff manage" ON public.inventory_gate_passes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'security') OR has_role(auth.uid(),'gateman') OR has_role(auth.uid(),'director'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'security') OR has_role(auth.uid(),'gateman') OR has_role(auth.uid(),'director'));

DROP POLICY IF EXISTS "Allow auth manage items" ON public.inventory_items;
CREATE POLICY "inv_items staff manage" ON public.inventory_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper'));

DROP POLICY IF EXISTS "Allow auth insert transactions" ON public.inventory_transactions;
CREATE POLICY "inv_tx staff insert" ON public.inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager'));

DROP POLICY IF EXISTS "Allow all to authenticated - lesson_observations" ON public.lesson_observations;
CREATE POLICY "lesson_obs staff manage" ON public.lesson_observations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'deputy_head_teacher'));

DROP POLICY IF EXISTS "Allow all to authenticated - lesson_plans" ON public.lesson_plans;
CREATE POLICY "lesson_plans staff manage" ON public.lesson_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Authenticated users can manage PLE mock tests" ON public.ple_mock_tests;
CREATE POLICY "ple_mock staff manage" ON public.ple_mock_tests FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Authenticated users can manage PLE results" ON public.ple_results;
CREATE POLICY "ple_results staff manage" ON public.ple_results FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Allow auth manage quran_progress" ON public.quran_progress;
CREATE POLICY "quran_progress staff manage" ON public.quran_progress FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher'));

DROP POLICY IF EXISTS "Allow auth manage salah_attendance" ON public.salah_attendance;
CREATE POLICY "salah_attendance staff manage" ON public.salah_attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher'));

DROP POLICY IF EXISTS "Allow auth manage staff_performance_logs" ON public.staff_performance_logs;
CREATE POLICY "staff_perf staff manage" ON public.staff_performance_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Authenticated users can manage subjects" ON public.subjects;
CREATE POLICY "subjects staff manage" ON public.subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Allow auth all syllabus_coverage" ON public.syllabus_coverage;
CREATE POLICY "syllabus_coverage staff manage" ON public.syllabus_coverage FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Authenticated users can manage term results" ON public.term_results;
CREATE POLICY "term_results staff manage" ON public.term_results FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

DROP POLICY IF EXISTS "Allow auth manage washing_machine_usage" ON public.washing_machine_usage;
CREATE POLICY "washing_machine staff manage" ON public.washing_machine_usage FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'storekeeper') OR has_role(auth.uid(),'office_manager'));
