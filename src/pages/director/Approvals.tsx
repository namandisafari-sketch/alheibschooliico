// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeaveApprovals } from "@/components/approvals/LeaveApprovals";
import { AdvanceApprovals } from "@/components/approvals/AdvanceApprovals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Coins } from "lucide-react";

const DirectorApprovals = () => (
  <DashboardLayout title="Director Approvals" subtitle="Administration sign-off — final stage">
    <Tabs defaultValue="leave" className="space-y-6">
      <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit">
        <TabsTrigger value="leave" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
          <Calendar className="h-4 w-4" /> staff Leave
        </TabsTrigger>
        <TabsTrigger value="advances" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
          <Coins className="h-4 w-4" /> Salary Advances
        </TabsTrigger>
      </TabsList>

      <TabsContent value="leave">
        <LeaveApprovals level="admin" />
      </TabsContent>
      
      <TabsContent value="advances">
        <AdvanceApprovals />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);
export default DirectorApprovals;
