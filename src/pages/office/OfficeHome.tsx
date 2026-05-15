import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OfficeDashboard } from "@/components/dashboard/OfficeDashboard";
const OfficeHome = () => (
  <DashboardLayout title="Office Manager" subtitle="Reception, documents & communications">
    <OfficeDashboard />
  </DashboardLayout>
);
export default OfficeHome;
