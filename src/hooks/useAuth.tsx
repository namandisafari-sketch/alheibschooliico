// @ts-nocheck
import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
const isSupabaseConfigured = true;
import { isWhitelistedAdmin } from "@/config/admins";

export type AppRole = 
  | "admin" 
  | "teacher" 
  | "parent" 
  | "staff" 
  | "security" 
  | "accountant" 
  | "head_teacher"
  | "gateman"
  | "nurse"
  | "matron"
  | "cook"
  | "dos"
  | "director"
  | "manager"
  | "secretary"
  | "office_manager"
  | "orphan_supervisor"
  | "center_director"
  | "direct_manager"
  | "storekeeper"
  | "deputy_head_teacher"
  | "store_manager"
  | "head_of_internal"
  | "dos_theology"
  | "theology_teacher"
  | "nurse"
  | "tailor";

export interface AuthSession {
  id: string;
  user_id: string;
  created_at: string;
  last_active: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_current: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roleFetched: boolean;
  profile: {
    scope: "global" | "district" | "school";
    district_id: string | null;
    school_id: string | null;
  } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; status?: string; reason?: string }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  getSessions: () => Promise<AuthSession[]>;
  revokeSession: (sessionId: string) => Promise<{ error: Error | null }>;
  revokeAllSessions: () => Promise<{ error: Error | null }>;
  getAuthAuditLog: (page?: number, limit?: number) => Promise<{ data: any[]; total: number }>;
  enableMfa: () => Promise<{ error: Error | null; qrCode?: string }>;
  disableMfa: () => Promise<{ error: Error | null }>;
  verifyMfa: (code: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleFetched, setRoleFetched] = useState(false);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId: string, email?: string) => {
    try {
      const isAdminEmail = isWhitelistedAdmin(email);

      // Priority 1: Admin override - set immediately, do not wait on DB
      if (isAdminEmail) {
        setRole("admin");
        setProfile({ scope: "global", district_id: null, school_id: null });
        setRoleFetched(true);
        // Best-effort refresh of profile in background; do not block UI
        supabase
          .from("profiles")
          .select("scope, district_id, school_id")
          .eq("id", userId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setProfile({ ...data, scope: "global" } as any);
          });
        return;
      }

      const [rolesRes, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("scope, district_id, school_id").eq("id", userId).maybeSingle()
      ]);

      // Resolve role from potentially multiple role rows using a priority list
      let resolvedRole: AppRole | null = null;
      if (!rolesRes.error && Array.isArray(rolesRes.data) && rolesRes.data.length) {
        const roles = rolesRes.data.map((r: any) => r.role);
        const priority: AppRole[] = [
          "admin",
          "director",
          "center_director",
          "head_teacher",
          "deputy_head_teacher",
          "accountant",
          "manager",
          "direct_manager",
          "office_manager",
          "store_manager",
          "storekeeper",
          "teacher",
          "dos",
          "dos_theology",
          "theology_teacher",
          "nurse",
          "matron",
          "cook",
          "security",
          "gateman",
          "orphan_supervisor",
          "staff",
          "parent",
        ];
        for (const p of priority) {
          if (roles.includes(p)) {
            resolvedRole = p;
            break;
          }
        }
        if (!resolvedRole) resolvedRole = roles[0] as AppRole;
      } else {
        resolvedRole = null;
      }

      setRole(resolvedRole);

      if (profileResult.data) {
        setProfile(profileResult.data as any);
      } else {
        setProfile({ scope: "school", district_id: null, school_id: null });
      }

      setRoleFetched(true);
    } catch (error) {
      console.error("Error fetching user role and profile:", error);
      setRoleFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock demo user for preview
      const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('demo_logged_in') === 'true';
      if (isLoggedIn) {
        const mockUser: any = {
          id: "demo-user-id",
          email: "demo@example.com",
          user_metadata: { full_name: "Demo User" }
        };
        setUser(mockUser);
        setRole("admin");
        setRoleFetched(true);
        setProfile({ scope: "global", district_id: null, school_id: null });
      } else {
        setUser(null);
        setRole(null);
        setRoleFetched(false);
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    let mounted = true;

    // Set up auth state listener FIRST (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession?.user) {
          const u = newSession.user;
          if (isWhitelistedAdmin(u.email)) {
            setRole("admin");
            setProfile({ scope: "global", district_id: null, school_id: null });
            setRoleFetched(true);
          }
          // Defer DB calls to avoid deadlocking the auth callback
          setTimeout(() => {
            if (mounted) fetchUserRole(u.id, u.email);
          }, 0);
        } else {
          setRole(null);
          setRoleFetched(false);
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("Auth session fetch error:", error);
        setLoading(false);
        return;
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        const u = currentSession.user;
        if (isWhitelistedAdmin(u.email)) {
          setRole("admin");
          setProfile({ scope: "global", district_id: null, school_id: null });
          setRoleFetched(true);
        }
        fetchUserRole(u.id, u.email);
      }
    }).catch((err) => {
      console.error("Auth initialization error:", err);
      if (mounted) setLoading(false);
    });


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };

    // Block disconnected/suspended accounts — but never block whitelisted admins
    if (data?.user && !isWhitelistedAdmin(data.user.email)) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("account_status, suspension_reason, suspended_until")
        .eq("id", data.user.id)
        .maybeSingle();

      const status = (prof as any)?.account_status;
      if (status === "disconnected" || status === "suspended") {
        const until = (prof as any)?.suspended_until;
        const stillSuspended =
          status === "suspended" && until ? new Date(until) > new Date() : true;
        if (status === "disconnected" || stillSuspended) {
          await supabase.auth.signOut();
          return {
            error: null,
            status: "disconnected",
            reason:
              (prof as any)?.suspension_reason ||
              (status === "disconnected"
                ? "Your account has been disconnected by the director."
                : "Your account is currently suspended."),
          } as any;
        }
      }
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Auth: Error during Supabase remote signOut, clearing local state anyway:", err);
    } finally {
      // Always clear local memory/storage states to prevent stuck UI
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      localStorage.clear();
      sessionStorage.clear();
      
      // Force direct clean redirection to /auth to guarantee page transitions
      window.location.href = "/auth";
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const getSessions = async (): Promise<AuthSession[]> => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return [];

      const res = await fetch("/api/auth/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.sessions || [];
    } catch {
      return [];
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke session");
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const revokeAllSessions = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke sessions");
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const getAuthAuditLog = async (page = 1, limit = 50) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return { data: [], total: 0 };

      const res = await fetch(`/api/auth/audit-log?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return { data: data.data || [], total: data.total || 0 };
    } catch {
      return { data: [], total: 0 };
    }
  };

  const enableMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      // Generate QR code URL from the factor
      const qrCode = `otpauth://totp/AlheibSchool:${user?.email}?secret=${data.totp?.qr_code}&issuer=AlheibSchool`;
      return { error: null, qrCode };
    } catch (error: any) {
      return { error, qrCode: undefined };
    }
  };

  const disableMfa = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.all?.find((f: any) => f.factor_type === "totp");
      if (!totpFactor) return { error: null };

      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const verifyMfa = async (code: string) => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.all?.find((f: any) => f.factor_type === "totp" && f.status === "unverified");
      if (!totpFactor) throw new Error("No unverified TOTP factor found");

      const { error } = await supabase.auth.mfa.verify({ factorId: totpFactor.id, code });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    user,
    session,
    role,
    roleFetched,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    updatePassword,
    getSessions,
    revokeSession,
    revokeAllSessions,
    getAuthAuditLog,
    enableMfa,
    disableMfa,
    verifyMfa,
  };
};

export { AuthContext };
export type { AuthContextType, AppRole };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authState = useAuthState();
  return <AuthContext.Provider value={authState as any}>{children}</AuthContext.Provider>;
};

