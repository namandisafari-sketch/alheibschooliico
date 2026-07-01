// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TailorDashboard } from "@/components/dashboard/TailorDashboard";

const TailorHome = () => (
  <DashboardLayout title="Tailor Workshop" subtitle="Uniform management, measurements & repairs">
    <TailorDashboard />
  </DashboardLayout>
);

export default TailorHome;
