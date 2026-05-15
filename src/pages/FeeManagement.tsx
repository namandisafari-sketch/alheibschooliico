import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, FileText } from "lucide-react";
import { ScanLine, History, Layers, Users, ShieldAlert } from "lucide-react";
import { CollectPaymentTab } from "@/components/fees/CollectPaymentTab";
import { PaymentHistoryTab } from "@/components/fees/PaymentHistoryTab";
import { FeeStructuresTab } from "@/components/fees/FeeStructuresTab";
import { StudentBalancesTab } from "@/components/fees/StudentBalancesTab";
import { BursarRulesTab } from "@/components/fees/BursarRulesTab";
import { useFeePayments, useStudentBalances, useFeeStructures, formatUGX } from "@/hooks/useFees";

const FeeManagement = () => {
  const { data: payments } = useFeePayments();
  const { data: balances } = useStudentBalances();
  const { data: structures } = useFeeStructures();

  const totalCollected = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const outstanding = (balances || []).reduce((s, b) => s + Math.max(0, b.balance), 0);

  return (
    <DashboardLayout title="Fee Management" subtitle="Manage fee structures and student payments">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold text-success mt-1">{formatUGX(totalCollected)}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-destructive mt-1">{formatUGX(outstanding)}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fee Structures</p>
              <p className="text-2xl font-bold mt-1">{structures?.length ?? 0}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="collect" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="collect" className="gap-1.5"><ScanLine className="h-4 w-4" /> Collect Payment</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-4 w-4" /> History</TabsTrigger>
          <TabsTrigger value="structures" className="gap-1.5"><Layers className="h-4 w-4" /> Fee Structures</TabsTrigger>
          <TabsTrigger value="balances" className="gap-1.5"><Users className="h-4 w-4" /> Student Balances</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><ShieldAlert className="h-4 w-4" /> Bursar Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="collect" className="mt-4"><CollectPaymentTab /></TabsContent>
        <TabsContent value="history" className="mt-4"><PaymentHistoryTab /></TabsContent>
        <TabsContent value="structures" className="mt-4"><FeeStructuresTab /></TabsContent>
        <TabsContent value="balances" className="mt-4"><StudentBalancesTab /></TabsContent>
        <TabsContent value="rules" className="mt-4"><BursarRulesTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default FeeManagement;
