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

    const initializeAuth = async () => {
      // Safety timeout: don't stay stuck on loading for more than 15 seconds
      const timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.warn("Auth initialization timed out, forcing loading to false");
          // If we have a user but no role yet, maybe the fetches are just slow
          if (session?.user && !role) {
            console.warn("User exists but role not fetched yet during timeout");
          }
          setRoleFetched(true);
          setLoading(false);
        }
      }, 15000);

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session fetch error:", error);
          if (error.message?.includes("Refresh Token") || error.message?.includes("Invalid Refresh Token")) {
            await supabase.auth.signOut().catch(() => {});
            if (mounted) {
              setSession(null);
              setUser(null);
              setRole(null);
            }
          }
        } else if (currentSession) {
          if (mounted) {
            const user = currentSession.user;
            setSession(currentSession);
            setUser(user);
            
            if (isWhitelistedAdmin(user.email)) {
              console.log("Auth: Pre-emptive admin access granted for", user.email);
              setRole("admin");
              setProfile({ scope: "global", district_id: null, school_id: null });
            }

            // Still fetch from DB to see if there are updates or specific profile data
            await fetchUserRole(user.id, user.email).catch(err => {
              console.error("Error in fetchUserRole:", err);
            });
            setRoleFetched(true);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const user = session.user;
          // PRE-EMPTIVE ADMIN CHECK: Ensure system administrators always have access
          const adminEmails = [
            "muslim.ummahlink@gmail.com",
            "admin@ummahlink.app",
            "admin@alhebi.com",
            "info.kabejjasystems@gmail.com",
            "papa@alheib.teacher",
            "admin@alheib.com",
            "alhebiadmin@gmail.com"
          ];
          
          if (user.email && adminEmails.includes(user.email.toLowerCase().trim())) {
            console.log("Auth: Pre-emptive admin access granted via StateChange for", user.email);
            setRole("admin");
            setProfile({ scope: "global", district_id: null, school_id: null });
          }
          
          await fetchUserRole(user.id, user.email);
          setRoleFetched(true);
        } else {
          setRole(null);
          setRoleFetched(false);
          setProfile(null);
        }
      }
    );

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

