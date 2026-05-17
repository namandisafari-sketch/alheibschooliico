
-- Sample Operations Data
DO $$
DECLARE
    v_staff_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_staff_id FROM public.profiles LIMIT 1;
    SELECT id INTO v_admin_id FROM public.profiles WHERE role IN ('admin', 'director') LIMIT 1;

    IF v_staff_id IS NOT NULL THEN
        -- Leave
        INSERT INTO public.leave_requests (staff_id, leave_type, start_date, end_date, reason, status)
        VALUES (v_staff_id, 'Sick Leave', CURRENT_DATE, CURRENT_DATE + interval '3 days', 'Fever and cold', 'pending');

        -- Advance
        INSERT INTO public.advance_requests (staff_id, amount, reason, status)
        VALUES (v_staff_id, 200000, 'Medical emergency', 'pending');

        -- Expenses
        INSERT INTO public.expense_requests (requester_id, amount, category, description, status)
        VALUES (v_staff_id, 50000, 'Stationery', 'Board markers and chalk', 'pending');

        -- Incidents
        INSERT INTO public.incident_reports (title, description, severity, status, reported_by)
        VALUES ('Water pipe burst', 'Main water pipe leading to girls dorm burst', 'moderate', 'open', v_staff_id);

        -- Staff Letters
        INSERT INTO public.staff_letters (staff_id, type, content, status)
        VALUES (v_staff_id, 'Appointment', 'Official appointment letter for the position of Senior Teacher', 'pending');

        -- User Warnings
        INSERT INTO public.user_warnings (user_id, reason, issued_by)
        VALUES (v_staff_id, 'Late coming to assembly twice this week', v_admin_id);
    END IF;
END $$;
