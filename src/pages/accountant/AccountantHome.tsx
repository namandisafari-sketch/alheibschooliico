import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AccountantDashboard } from "@/components/dashboard/AccountantDashboard";

const AccountantHome = () => (
  <DashboardLayout title="Finance Hub" subtitle="Alheib Financial Ecosystem & Procurement Control">
    <AccountantDashboard />
  </DashboardLayout>
);

export default AccountantHome;
