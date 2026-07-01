import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { Loader2 } from "lucide-react";

const TeacherHome = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.id || role !== "teacher") {
      setChecking(false);
      return;
    }

    let cancelled = false;
    const checkOnboarding = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (!cancelled) {
          if (data && !data.onboarding_completed) {
            navigate("/teacher/onboarding", { replace: true });
          } else {
            setChecking(false);
          }
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    checkOnboarding();
    return () => { cancelled = true; };
  }, [user?.id, role, navigate]);

  if (checking && role === "teacher") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Teacher Workspace" subtitle="Manage your classes & learners">
      <TeacherDashboard />
    </DashboardLayout>
  );
};

export default TeacherHome;
