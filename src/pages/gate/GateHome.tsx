import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GatemanDashboard } from "@/components/dashboard/GatemanDashboard";
import { VisitorsManager } from "@/components/visitors/VisitorsManager";
import VerifyVisitor from "@/pages/gate/VerifyVisitor";
import StaffGateCheckin from "@/components/gate/StaffGateCheckin";
import TemporaryWorkers from "@/components/gate/TemporaryWorkers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, GraduationCap, Shield, Wrench } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const GateHome = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout title="Gate Control Hub" subtitle="Campus security and visitor management">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="dashboard" className="gap-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
            Control Hub
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="visitors" className="gap-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Visitors
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="temporary" className="gap-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wrench className="h-4 w-4" />
            Temporary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 animate-in fade-in duration-300">
          <GatemanDashboard />
        </TabsContent>

        <TabsContent value="students" className="mt-0 animate-in fade-in duration-300">
          <VerifyVisitor />
        </TabsContent>

        <TabsContent value="visitors" className="mt-0 animate-in fade-in duration-300">
          <VisitorsManager />
        </TabsContent>

        <TabsContent value="staff" className="mt-0 animate-in fade-in duration-300">
          <StaffGateCheckin />
        </TabsContent>

        <TabsContent value="temporary" className="mt-0 animate-in fade-in duration-300">
          <TemporaryWorkers />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};


export default GateHome;
