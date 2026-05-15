import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SecurityDashboard } from "@/components/dashboard/SecurityDashboard";
const SecurityHome = () => (
  <DashboardLayout title="Security Console" subtitle="Gate, visitor & incident control">
    <SecurityDashboard />
  </DashboardLayout>
);
export default SecurityHome;
