import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DirectorDashboard } from "@/components/dashboard/DirectorDashboard";
const DirectorHome = () => (
  <DashboardLayout title="Center Director" subtitle="Executive command center">
    <DirectorDashboard />
  </DashboardLayout>
);
export default DirectorHome;
