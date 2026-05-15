
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ShoppingCart, BarChart3, Receipt } from "lucide-react";
import { BudgetRequestsTab } from "@/components/budget/BudgetRequestsTab";
import { ProcurementTab } from "@/components/budget/ProcurementTab";
import { BudgetReportsTab } from "@/components/budget/BudgetReportsTab";

const Budget = () => {
  return (
    <DashboardLayout title="Finance & Procurement" subtitle="Manage budget requests, procurement, and financial reports">
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="requests" className="gap-2">
            <Wallet className="h-4 w-4" /> Budget Requests
          </TabsTrigger>
          <TabsTrigger value="procurement" className="gap-2">
            <ShoppingCart className="h-4 w-4" /> Procurement
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Budget Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="mt-4">
          <BudgetRequestsTab />
        </TabsContent>
        <TabsContent value="procurement" className="mt-4">
          <ProcurementTab />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <BudgetReportsTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Budget;
