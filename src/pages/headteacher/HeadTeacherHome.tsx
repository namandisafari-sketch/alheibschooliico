import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeadTeacherDashboard } from "@/components/dashboard/HeadTeacherDashboard";
import { useAuth } from "@/hooks/useAuth";

const HeadTeacherHome = () => {
  const { role } = useAuth();

  return (
    <DashboardLayout
      title={role === "head_teacher" ? "Headteacher Dashboard" : "Deputy Headteacher Dashboard"}
      subtitle="School management & institutional oversight"
    >
      <HeadTeacherDashboard />
    </DashboardLayout>
  );
};

export default HeadTeacherHome;
