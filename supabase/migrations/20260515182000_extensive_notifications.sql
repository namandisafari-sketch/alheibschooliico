
-- 1. Add 'director' role to app_role enum and profiles constraint
DO $$ 
BEGIN 
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- Update profiles table check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'teacher', 'head_teacher', 'accountant', 'security', 'director', 'staff'));

-- 2. Update the audit and notification function to be more descriptive and robust
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    audit_user_id UUID;
    staff_name TEXT := 'System';
BEGIN
    -- Get Current User Context
    audit_user_id := auth.uid();
    
    -- Try to get the name of the person performing the action
    IF audit_user_id IS NOT NULL THEN
        SELECT full_name INTO staff_name FROM public.profiles WHERE id = audit_user_id;
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
    END IF;

    -- Insert into Audit Log
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        audit_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (old_val->>'id')::UUID
            ELSE (new_val->>'id')::UUID
        END,
        old_val,
        new_val
    );

    -- Notify Admins and Directors of EVERY system activity
    -- Exclude internal log tables to prevent infinite recursion
    IF TG_TABLE_NAME NOT IN ('in_app_notifications', 'notifications', 'audit_log', 'notification_logs', 'medication_logs') THEN
        INSERT INTO public.in_app_notifications (
            user_id, 
            title, 
            message, 
            type,
            created_by
        )
        SELECT 
            p.id, 
            'Activity in ' || INITCAP(REPLACE(TG_TABLE_NAME, '_', ' ')), 
            staff_name || ' performed ' || TG_OP || ' on ' || REPLACE(TG_TABLE_NAME, '_', ' ') || '.',
            'activity',
            audit_user_id
        FROM public.profiles p
        WHERE p.role IN ('admin', 'director')
        AND p.id != COALESCE(audit_user_id, '00000000-0000-0000-0000-000000000000'::UUID); -- Don't notify yourself
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Exhaustively apply the trigger to ALL meaningful tables across the system
DO $$
DECLARE
    t TEXT;
    table_list TEXT[] := ARRAY[
        'learners',
        'classes',
        'attendance',
        'discipline_cases',
        'health_visits',
        'visitors',
        'visitor_visits',
        'appointments',
        'inventory_items',
        'inventory_transactions',
        'assets',
        'fee_payments',
        'school_calendar',
        'dormitories',
        'tasks',
        'profiles',
        'bursar_rules',
        'bursar_override_requests',
        'salary_payments',
        'salary_records',
        'petty_cash_runs',
        'donations',
        'purchase_orders',
        'schools',
        'notification_templates',
        'scheduled_notifications',
        'subjects',
        'term_results',
        'report_cards',
        'ple_mock_tests',
        'ple_results',
        'fee_structures',
        'fee_assignments',
        'inventory_categories',
        'inventory_stock',
        'inventory_gate_passes',
        'pharmacy_items',
        'quran_progress',
        'salah_attendance',
        'akhlaaq_reports',
        'hostel_issuances',
        'washing_machine_usage',
        'budget_requests',
        'digital_homework',
        'staff_performance_logs',
        'dormitory_residents',
        'learner_essentials',
        'school_infrastructure',
        'school_sanitation',
        'finance_accounts',
        'donors',
        'projects',
        'class_timetables'
    ];
BEGIN
    FOREACH t IN ARRAY table_list LOOP
        -- Check if table exists before applying trigger
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
            EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log()', t, t);
        END IF;
    END LOOP;
END $$;
