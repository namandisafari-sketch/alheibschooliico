// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeaveApprovals } from "@/components/approvals/LeaveApprovals";
import { AdvanceApprovals } from "@/components/approvals/AdvanceApprovals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Coins, Star } from "lucide-react";
import { ReviewsApproval } from "@/components/approvals/ReviewsApproval";

const DirectorApprovals = () => {
  return (
    <DashboardLayout title="Director Approvals" subtitle="Administration sign-off — final stage">
      <Tabs defaultValue="leave" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
          <TabsTrigger value="leave" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Calendar className="h-4 w-4" /> staff Leave
          </TabsTrigger>
          <TabsTrigger value="advances" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Coins className="h-4 w-4" /> Salary Advances
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Star className="h-4 w-4" /> Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leave">
          <LeaveApprovals level="admin" />
        </TabsContent>

        <TabsContent value="advances">
          <AdvanceApprovals />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsApproval />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};
export default DirectorApprovals;
