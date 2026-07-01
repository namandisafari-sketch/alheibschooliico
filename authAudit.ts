import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY;

type AuthEventType =
  | "login"
  | "logout"
  | "login_failed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "account_created"
  | "account_disconnected"
  | "account_reconnected"
  | "session_expired"
  | "mfa_enabled"
  | "mfa_disabled"
  | "mfa_verified"
  | "role_changed"
  | "permission_changed";

export async function logAuthEvent(
  event: AuthEventType,
  userId: string | null,
  metadata: Record<string, any> = {},
) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    await supabase.from("auth_audit_log").insert({
      event,
      user_id: userId,
      ip_address: metadata.ip || null,
      user_agent: metadata.userAgent || null,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Auth audit log error:", err);
  }
}
