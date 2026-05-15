import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { homeFor } from "@/lib/roleConfig";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Strict role isolation: if user's role isn't allowed here, send them to THEIR home.
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const target = homeFor(role);
    if (target !== location.pathname) {
      return <Navigate to={target} replace />;
    }
  }

  return <>{children}</>;
};
