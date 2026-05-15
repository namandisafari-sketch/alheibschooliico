
-- 1. Create Gate Pass Table for more detailed tracking if it doesn't exist
-- Based on the previous session, we already had some columns, but we'll formalize the flow.

-- Add specific flow columns to inventory_transactions
ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS manager_approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS director_approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gateman_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS gate_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gate_notes TEXT,
ADD COLUMN IF NOT EXISTS qr_verification_code TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Update status constraint to match the new flow
ALTER TABLE public.inventory_transactions 
DROP CONSTRAINT IF EXISTS inventory_transactions_status_check;

ALTER TABLE public.inventory_transactions 
ADD CONSTRAINT inventory_transactions_status_check 
CHECK (status IN ('pending', 'manager_approved', 'director_approved', 'rejected', 'dispatched', 'verified_at_gate', 'completed'));

-- Create a View for the Gateman (simplified)
CREATE OR REPLACE VIEW public.active_gate_passes AS
SELECT 
    t.id,
    t.tracking_number,
    t.qr_verification_code,
    i.name as item_name,
    t.quantity,
    p.full_name as requester_name,
    t.status,
    t.director_approval_date
FROM public.inventory_transactions t
JOIN public.inventory_items i ON t.item_id = i.id
LEFT JOIN public.profiles p ON t.staff_id = p.id
WHERE t.status IN ('director_approved', 'dispatched');

-- Enable RLS for the view if possible (Supabase handles views well)
GRANT SELECT ON public.active_gate_passes TO authenticated;
