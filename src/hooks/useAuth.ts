import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

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
  | "deputy_head_teacher";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
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
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock demo user for preview
      const mockUser: any = {
        id: "demo-user-id",
        email: "demo@example.com",
        user_metadata: { full_name: "Demo User" }
      };
      setUser(mockUser);
      setRole("admin");
      setProfile({ scope: "global", district_id: null, school_id: null });
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch role with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth session fetch error:", error);
        // Handle "Refresh Token Not Found" or similar auth errors by clearing stale data
        if (error.message?.includes("Refresh Token") || error.message?.includes("Invalid Refresh Token")) {
          console.warn("Detected invalid refresh token, clearing session storage...");
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setSession(null);
          setRole(null);
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error("Auth promise error:", err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const [roleResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("scope, district_id, school_id").eq("id", userId).maybeSingle()
      ]);

      if (!roleResult.error && roleResult.data) {
        setRole(roleResult.data.role as AppRole);
      }

      if (profileResult.data) {
        setProfile(profileResult.data as any);
      } else {
        setProfile({ scope: "school", district_id: null, school_id: null });
      }
    } catch (error) {
      console.error("Error fetching user role and profile:", error);
    }
  };

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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return {
    user,
    session,
    role,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
};

export { AuthContext };
export type { AuthContextType, AppRole };
