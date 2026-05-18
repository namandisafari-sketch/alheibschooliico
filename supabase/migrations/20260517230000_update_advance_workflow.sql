
-- Update advance_custody_request to match user's requested flow: Accountant -> Director
CREATE OR REPLACE FUNCTION public.advance_custody_request(_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS public.approval_stage
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cur public.approval_stage; _new public.approval_stage;
BEGIN
  SELECT stage INTO _cur FROM public.employee_advances WHERE id = _id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'Advance % not found', _id; END IF;

  IF _action = 'reject' THEN
    UPDATE public.employee_advances SET stage='rejected', status='rejected', rejection_reason=_reason WHERE id=_id;
    RETURN 'rejected';
  END IF;

  CASE _cur
    WHEN 'submitted' THEN
      IF NOT has_any_role(_uid, ARRAY['accountant','admin']) THEN
        RAISE EXCEPTION 'Only Accountant can verify at this stage';
      END IF;
      UPDATE public.employee_advances
         SET stage='accountant_verified',
             accountant_approval_by=_uid, accountant_approval_date=now(),
             compliance_checked=true, budget_available=true
       WHERE id=_id;
      _new := 'accountant_verified';

    WHEN 'accountant_verified' THEN
      IF NOT has_any_role(_uid, ARRAY['center_director','head_teacher','admin']) THEN
        RAISE EXCEPTION 'Only Director can give final approval';
      END IF;
      UPDATE public.employee_advances
         SET stage='final_approved',
             director_approval_by=_uid, director_approval_date=now(), 
             office_approval_by=_uid, office_approval_date=now(),
             status='approved'
       WHERE id=_id;
      _new := 'final_approved';

    ELSE
      RAISE EXCEPTION 'Advance already at terminal stage: %', _cur;
  END CASE;

  RETURN _new;
END $$;
