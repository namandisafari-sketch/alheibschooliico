
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bed, Wind, PackageCheck, ClipboardList } from "lucide-react";
import { HostelLogisticsTab } from "@/components/hostel/HostelLogisticsTab";
import { WashingMachineTab } from "@/components/hostel/WashingMachineTab";
import { StudentEssentialsTab } from "@/components/hostel/StudentEssentialsTab";
import { DormitoriesTab } from "@/components/hostel/DormitoriesTab";

const Hostel = () => {
  return (
    <DashboardLayout title="Hostel & Welfare" subtitle="Manage dormitories, residents, and welfare items issued to learners">
      <Tabs defaultValue="dormitories" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="dormitories" className="gap-2">
            <Bed className="h-4 w-4" /> Dormitories
          </TabsTrigger>
          <TabsTrigger value="essentials" className="gap-2">
            <PackageCheck className="h-4 w-4" /> Learner Essentials
          </TabsTrigger>
          <TabsTrigger value="logistics" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Supplies
          </TabsTrigger>
          <TabsTrigger value="washing" className="gap-2">
            <Wind className="h-4 w-4" /> Washing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dormitories" className="mt-4"><DormitoriesTab /></TabsContent>
        <TabsContent value="essentials" className="mt-4"><StudentEssentialsTab /></TabsContent>
        <TabsContent value="logistics" className="mt-4"><HostelLogisticsTab /></TabsContent>
        <TabsContent value="washing" className="mt-4"><WashingMachineTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Hostel;
