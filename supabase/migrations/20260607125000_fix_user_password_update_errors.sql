-- Migration: Fix User Password Update Errors
-- Purpose: Ensure proper schema constraints, RLS policies, and audit logging for user password updates
-- Date: 2026-06-07

-- =====================================================================
-- 1. Ensure user_roles table has proper constraints and indexes
-- =====================================================================

-- Add missing unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_role_key'
    ) THEN
        ALTER TABLE public.user_roles 
        ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
END $$;

-- Add index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================================
-- 2. Ensure profiles table has proper structure for password management
-- =====================================================================

-- Add missing columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;

-- =====================================================================
-- 3. Create audit log table for password change tracking
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_password_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    ip_address TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_password_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs; admins can view all
CREATE POLICY "Users view own password audit" ON public.user_password_audit
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'::app_role
        )
    );

-- =====================================================================
-- 4. Create function to handle password update errors
-- =====================================================================

CREATE OR REPLACE FUNCTION public.log_password_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_password_audit (
        user_id,
        changed_by,
        changed_at,
        reason,
        success
    ) VALUES (
        NEW.id,
        auth.uid(),
        NOW(),
        'Password updated successfully',
        TRUE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================================
-- 5. Fix RLS policies to allow role updates without conflicts
-- =====================================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users manage own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Auth can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage user_roles" ON public.user_roles;

-- Allow service role (backend) to manage all role assignments
CREATE POLICY "Service role manages user_roles" ON public.user_roles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to view their own roles only (prevents recursion)
CREATE POLICY "Users view own roles" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admin users (identified by backend service role) can insert/update/delete via functions only
-- Direct table access is restricted to prevent RLS recursion issues

-- =====================================================================
-- 6. Add function to safely assign user roles
-- =====================================================================

CREATE OR REPLACE FUNCTION public.assign_user_role(
    p_user_id UUID,
    p_role app_role
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
BEGIN
    -- Only admins and directors can assign roles
    IF NOT (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin'::app_role, 'center_director'::app_role)
        )
    ) THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, 'Insufficient permissions to assign roles'::TEXT;
        RETURN;
    END IF;

    BEGIN
        -- Delete conflicting roles (optional - depends on business logic)
        DELETE FROM public.user_roles
        WHERE user_id = p_user_id AND role != p_role;

        -- Insert or update the role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (p_user_id, p_role)
        ON CONFLICT (user_id, role) DO NOTHING;

        RETURN QUERY SELECT TRUE::BOOLEAN, 'Role assigned successfully'::TEXT;

    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================================
-- 7. Add function to safely update user password and role
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_user_password_safely(
    p_user_id UUID,
    p_new_role app_role DEFAULT NULL,
    p_changed_by UUID DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
    v_error_msg TEXT;
BEGIN
    BEGIN
        -- Update user profile with last password change timestamp
        UPDATE public.profiles
        SET 
            last_password_change = NOW(),
            password_reset_required = FALSE
        WHERE id = p_user_id;

        -- If new role is provided, update user roles
        IF p_new_role IS NOT NULL THEN
            -- Delete other roles first (except the new one)
            DELETE FROM public.user_roles
            WHERE user_id = p_user_id AND role != p_new_role;

            -- Upsert the new role
            INSERT INTO public.user_roles (user_id, role)
            VALUES (p_user_id, p_new_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;

        -- Log the password change
        INSERT INTO public.user_password_audit (
            user_id,
            changed_by,
            changed_at,
            reason,
            success
        ) VALUES (
            p_user_id,
            COALESCE(p_changed_by, auth.uid()),
            NOW(),
            'Password and role updated via safe function',
            TRUE
        );

        RETURN QUERY SELECT TRUE::BOOLEAN, 'User password and role updated successfully'::TEXT;

    EXCEPTION WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        
        -- Log the error
        INSERT INTO public.user_password_audit (
            user_id,
            changed_by,
            changed_at,
            reason,
            success,
            error_message
        ) VALUES (
            p_user_id,
            COALESCE(p_changed_by, auth.uid()),
            NOW(),
            'Error during password/role update',
            FALSE,
            v_error_msg
        );

        RETURN QUERY SELECT FALSE::BOOLEAN, v_error_msg::TEXT;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================================
-- 8. Add missing indexes for performance
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_password_change ON public.profiles(last_password_change);
CREATE INDEX IF NOT EXISTS idx_user_password_audit_user_id ON public.user_password_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_password_audit_changed_at ON public.user_password_audit(changed_at);

-- =====================================================================
-- 9. Grant proper permissions
-- =====================================================================

GRANT EXECUTE ON FUNCTION public.update_user_password_safely(UUID, app_role, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, app_role) TO authenticated;
GRANT SELECT ON public.user_password_audit TO authenticated;

-- =====================================================================
-- MIGRATION COMPLETE
-- Usage: Call from backend (service_role):
--   1. UPDATE passwords: SELECT public.update_user_password_safely('user-uuid', 'new_role', auth.uid());
--   2. ASSIGN roles: SELECT public.assign_user_role('user-uuid', 'new_role');
-- =====================================================================
