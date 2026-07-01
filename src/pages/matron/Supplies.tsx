// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HostelLogisticsTab } from "@/components/hostel/HostelLogisticsTab";

const Supplies = () => {
  return (
    <DashboardLayout title="Hostel Supplies" subtitle="Track and manage hostel inventory items">
      <HostelLogisticsTab />
    </DashboardLayout>
  );
};

export default Supplies;
