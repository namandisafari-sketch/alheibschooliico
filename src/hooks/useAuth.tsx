// @ts-nocheck
import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
const isSupabaseConfigured = true;
import { isWhitelistedAdmin } from "@/config/admins";

type AppRole = 
  | "admin" 
  | "teacher" 
  | "parent" 
  | "staff" 
  | "security" 
  | "accountant" 
  | "head_teacher" 
  | "dos" 
  | "nurse" 
  | "storekeeper" 
  | "gateman" 
  | "office_manager" 
  | "direct_manager" 
  | "center_director"
  | "deputy_head_teacher"
  | "director"
  | "bursar"
  | "store_manager"
  | "secretary";

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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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

      const [roleResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("scope, district_id, school_id").eq("id", userId).maybeSingle()
      ]);

      if (!roleResult.error && roleResult.data?.role) {
        setRole(roleResult.data.role as AppRole);
      } else {
        setRole(null);
      }

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
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
  };
};

export { AuthContext };
export type { AuthContextType, AppRole };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authState = useAuthState();
  return <AuthContext.Provider value={authState as any}>{children}</AuthContext.Provider>;
};

