
-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (old_val->>'id')::UUID
            ELSE (new_val->>'id')::UUID
        END,
        old_val,
        new_val
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers to Financial Tables
CREATE TRIGGER trg_audit_finance_accounts AFTER INSERT OR UPDATE OR DELETE ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_donors AFTER INSERT OR UPDATE OR DELETE ON public.donors FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_donations AFTER INSERT OR UPDATE OR DELETE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_purchase_orders AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_petty_cash_runs AFTER INSERT OR UPDATE OR DELETE ON public.petty_cash_runs FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_petty_cash_invoices AFTER INSERT OR UPDATE OR DELETE ON public.petty_cash_invoices FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_employee_advances AFTER INSERT OR UPDATE OR DELETE ON public.employee_advances FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
CREATE TRIGGER trg_audit_payroll_runs AFTER INSERT OR UPDATE OR DELETE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();
