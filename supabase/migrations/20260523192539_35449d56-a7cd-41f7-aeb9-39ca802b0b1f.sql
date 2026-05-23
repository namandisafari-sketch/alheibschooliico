
-- SECURITY HARDENING MIGRATION (v2)

DROP POLICY IF EXISTS "Allow all to authenticated - academic_warnings" ON public.academic_warnings;
DROP POLICY IF EXISTS "Allow authenticated view academic warnings" ON public.academic_warnings;
DROP POLICY IF EXISTS "Public select academic_warnings" ON public.academic_warnings;
DROP POLICY IF EXISTS "Allow auth all account_appeals" ON public.account_appeals;
DROP POLICY IF EXISTS "Allow auth all advance_requests" ON public.advance_requests;
DROP POLICY IF EXISTS "Allow auth manage akhlaaq_reports" ON public.akhlaaq_reports;
DROP POLICY IF EXISTS "Allow auth manage budget_requests" ON public.budget_requests;
DROP POLICY IF EXISTS "Allow auth manage discipline_cases" ON public.discipline_cases;
DROP POLICY IF EXISTS "Allow auth view discipline_cases" ON public.discipline_cases;
DROP POLICY IF EXISTS "Allow auth all expense_requests" ON public.expense_requests;
DROP POLICY IF EXISTS "Authenticated users can manage guardians" ON public.guardians;
DROP POLICY IF EXISTS "Authenticated users can view guardians" ON public.guardians;
DROP POLICY IF EXISTS "hws view" ON public.homework_submissions;
DROP POLICY IF EXISTS "Allow auth all incident_reports" ON public.incident_reports;
DROP POLICY IF EXISTS "lm view" ON public.learner_medical;
DROP POLICY IF EXISTS "Authenticated users can manage learners" ON public.learners;
DROP POLICY IF EXISTS "Authenticated users can view learners" ON public.learners;
DROP POLICY IF EXISTS "Allow auth all leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Staff can view notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Allow auth view payroll" ON public.payroll_runs;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow auth all staff_letters" ON public.staff_letters;
DROP POLICY IF EXISTS "Allow auth all user_warnings" ON public.user_warnings;

CREATE POLICY "academic_warnings staff view" ON public.academic_warnings
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'teacher')
  );

CREATE POLICY "akhlaaq read" ON public.akhlaaq_reports
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'director')
  );
CREATE POLICY "akhlaaq write" ON public.akhlaaq_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'head_teacher'));

CREATE POLICY "budget admin manage" ON public.budget_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'accountant'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'accountant'));

CREATE POLICY "expense admin manage" ON public.expense_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'accountant'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'accountant'));

CREATE POLICY "incident admin manage" ON public.incident_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'security'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'security'));

CREATE POLICY "discipline staff read" ON public.discipline_cases
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos')
  );
CREATE POLICY "discipline staff write" ON public.discipline_cases
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos'));

CREATE POLICY "guardians staff read" ON public.guardians
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'teacher')
    OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary')
    OR has_role(auth.uid(),'nurse')
  );
CREATE POLICY "guardians office write" ON public.guardians
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary'));

CREATE POLICY "hws staff read" ON public.homework_submissions
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'dos')
  );

CREATE POLICY "lm staff read" ON public.learner_medical
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'nurse')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'director')
  );

CREATE POLICY "learners staff read" ON public.learners
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'deputy_head_teacher')
    OR has_role(auth.uid(),'dos') OR has_role(auth.uid(),'teacher')
    OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary')
    OR has_role(auth.uid(),'nurse') OR has_role(auth.uid(),'accountant')
    OR has_role(auth.uid(),'security') OR has_role(auth.uid(),'gateman')
  );
CREATE POLICY "learners office write" ON public.learners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary'));

CREATE POLICY "notif logs office read" ON public.notification_logs
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director')
    OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary')
  );

CREATE POLICY "payroll accountant read" ON public.payroll_runs
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'director')
  );

CREATE POLICY "profiles own read" ON public.profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'head_teacher')
  );

ALTER FUNCTION public.proc_audit_log() SET search_path = public;
ALTER FUNCTION public.update_inventory_stock() SET search_path = public;

DROP VIEW IF EXISTS public.active_gate_passes;
CREATE VIEW public.active_gate_passes WITH (security_invoker = true) AS
SELECT t.id, t.tracking_number, t.qr_verification_code, i.name AS item_name,
    t.quantity, p.full_name AS requester_name, t.status, t.director_approval_date
FROM inventory_transactions t
JOIN inventory_items i ON t.item_id = i.id
LEFT JOIN profiles p ON t.staff_id = p.id
WHERE t.status = ANY (ARRAY['director_approved'::text, 'dispatched'::text]);

DROP VIEW IF EXISTS public.inventory_details;
CREATE VIEW public.inventory_details WITH (security_invoker = true) AS
SELECT i.id, i.category_id, i.name, i.description, i.unit, i.sku,
    i.min_stock_level, i.created_at, i.updated_at, i.custodian_id,
    i.supplier_name, i.supplier_contact, i.brand, i.model,
    i.storage_location, i.expiry_date, i.technical_specs,
    s.quantity AS current_stock, c.name AS category_name
FROM inventory_items i
LEFT JOIN inventory_stock s ON i.id = s.item_id
LEFT JOIN inventory_categories c ON i.category_id = c.id;

CREATE POLICY "learner-docs staff read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'learner-documents' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'nurse')
      OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'director')
      OR has_role(auth.uid(),'office_manager') OR has_role(auth.uid(),'secretary')
    )
  );
CREATE POLICY "learner-docs staff write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'learner-documents' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'nurse')
      OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'office_manager')
      OR has_role(auth.uid(),'secretary')
    )
  );
CREATE POLICY "learner-docs staff update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'learner-documents' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'head_teacher') OR has_role(auth.uid(),'office_manager')
    )
  );
CREATE POLICY "learner-docs admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'learner-documents' AND has_role(auth.uid(),'admin')
  );
