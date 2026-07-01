import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StorekeeperDashboard } from "@/components/dashboard/StorekeeperDashboard";
import { AssetUnderMyCustody } from "@/components/dashboard/AssetUnderMyCustody";

const StoreHome = () => (
  <DashboardLayout title="Store Operations" subtitle="Inventory & supplier control · Alheib School">
    <StorekeeperDashboard />
    <AssetUnderMyCustody />
  </DashboardLayout>
);
export default StoreHome;
