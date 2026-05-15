
-- Update Audit Log Function to include Global Notifications
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    audit_user_id UUID;
    audit_user_email TEXT;
BEGIN
    -- Get Current User Info
    audit_user_id := auth.uid();
    
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

    -- Notify Admins and Directors
    -- We skip notifications for the notification table itself to avoid recursion
    IF TG_TABLE_NAME != 'in_app_notifications' AND TG_TABLE_NAME != 'notifications' AND TG_TABLE_NAME != 'audit_log' THEN
        INSERT INTO public.in_app_notifications (
            user_id, 
            title, 
            message, 
            type,
            created_by
        )
        SELECT 
            p.id, 
            'System Activity: ' || INITCAP(TG_TABLE_NAME), 
            'Action ' || TG_OP || ' performed on ' || TG_TABLE_NAME || ' by staff member.',
            'activity',
            audit_user_id
        FROM public.profiles p
        WHERE p.role IN ('admin', 'director')
        AND p.id != audit_user_id; -- Don't notify yourself of your own action
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers to Additional Critical Tables
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
        'purchase_orders'
    ];
BEGIN
    FOREACH t IN ARRAY table_list LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log()', t, t);
    END LOOP;
END $$;
