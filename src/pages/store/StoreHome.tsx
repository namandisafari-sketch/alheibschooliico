import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StorekeeperDashboard } from "@/components/dashboard/StorekeeperDashboard";
const StoreHome = () => (
  <DashboardLayout title="Store Operations" subtitle="Inventory & supplier control · Alheib School">
    <StorekeeperDashboard />
  </DashboardLayout>
);
export default StoreHome;
