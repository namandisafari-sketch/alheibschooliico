-- Allow teachers (including theology_teachers) to manage their own assignments (onboarding, etc.)
CREATE POLICY "Allow teachers manage own assignments" ON public.teacher_assignments
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
