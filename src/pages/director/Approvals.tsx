// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeaveApprovals } from "@/components/approvals/LeaveApprovals";
const DirectorApprovals = () => (
  <DashboardLayout title="Director Approvals" subtitle="Administration sign-off — final stage">
    <LeaveApprovals level="admin" />
  </DashboardLayout>
);
export default DirectorApprovals;
