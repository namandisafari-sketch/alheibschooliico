// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WashingMachineTab } from "@/components/hostel/WashingMachineTab";

const Washing = () => {
  return (
    <DashboardLayout title="Laundry & Washing" subtitle="Manage washing machines and laundry loads">
      <WashingMachineTab />
    </DashboardLayout>
  );
};

export default Washing;
