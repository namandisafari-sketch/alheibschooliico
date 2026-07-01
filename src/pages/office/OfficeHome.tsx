import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OfficeDashboard } from "@/components/dashboard/OfficeDashboard";
const OfficeHome = () => (
  <DashboardLayout title="Office Management" subtitle="Front desk, documents, communications & visitor control">
    <OfficeDashboard />
  </DashboardLayout>
);
export default OfficeHome;