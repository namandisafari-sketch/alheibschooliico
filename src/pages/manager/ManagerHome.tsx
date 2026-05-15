import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
const ManagerHome = () => (
  <DashboardLayout title="Direct Manager" subtitle="Cross-department oversight & approvals">
    <ManagerDashboard />
  </DashboardLayout>
);
export default ManagerHome;
