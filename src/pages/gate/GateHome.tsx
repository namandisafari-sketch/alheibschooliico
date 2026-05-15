import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GatemanDashboard } from "@/components/dashboard/GatemanDashboard";
const GateHome = () => (
  <DashboardLayout title="Gate Operations" subtitle="Visitor, vehicle & access control">
    <GatemanDashboard />
  </DashboardLayout>
);
export default GateHome;
