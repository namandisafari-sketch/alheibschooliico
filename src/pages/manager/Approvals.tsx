// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeaveApprovals } from "@/components/approvals/LeaveApprovals";
const Approvals = () => (
  <DashboardLayout title="Approvals Queue" subtitle="Supervisor / Head of Department sign-off">
    <LeaveApprovals level="supervisor" />
  </DashboardLayout>
);
export default Approvals;
