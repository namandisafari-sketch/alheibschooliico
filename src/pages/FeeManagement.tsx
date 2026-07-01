import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, FileText, TrendingUp, AlertTriangle, Printer } from "lucide-react";
import { ScanLine, History, Layers, Users, ShieldAlert } from "lucide-react";
import { CollectPaymentTab } from "@/components/fees/CollectPaymentTab";
import { PaymentHistoryTab } from "@/components/fees/PaymentHistoryTab";
import { FeeStructuresTab } from "@/components/fees/FeeStructuresTab";
import { StudentBalancesTab } from "@/components/fees/StudentBalancesTab";
import { BursarRulesTab } from "@/components/fees/BursarRulesTab";
import { useFeePayments, useStudentBalances, useFeeStructures, formatUGX } from "@/hooks/useFees";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";

const FeeManagement = () => {
  const { data: payments } = useFeePayments();
  const { data: balances } = useStudentBalances();
  const { data: structures } = useFeeStructures();
  const { toast } = useToast();

  const totalCollected = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const outstanding = (balances || []).reduce((s, b) => s + Math.max(0, b.balance), 0);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: todayTotal = 0 } = useQuery({
    queryKey: ["fee-today-total"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments").select("amount").gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`);
      return (data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    },
  });

  const { data: todayCount = 0 } = useQuery({
    queryKey: ["fee-today-count"],
    queryFn: async () => {
      const { count } = await supabase.from("fee_payments").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`);
      return count || 0;
    },
  });

  const { data: monthTotal = 0 } = useQuery({
    queryKey: ["fee-month-total"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments").select("amount").gte("created_at", monthStart);
      return (data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    },
  });

  const topDefaulters = (balances || [])
    .filter((b: any) => b.balance > 0)
    .sort((a: any, b: any) => b.balance - a.balance)
    .slice(0, 5);

  const handleExportPayments = () => {
    if (!payments || payments.length === 0) {
      toast({ title: "No payments", description: "There are no payments to export.", variant: "destructive" });
      return;
    }
    const headers = ["Date", "Payer", "Student", "Class", "Amount", "Method", "Reference", "Notes"];
    const rows = [headers.join(",")];
    payments.forEach((p: any) => {
      const date = p.payment_date || p.created_at || p.date || "";
      const payer = p.payer_name || p.full_name || p.payer || "";
      const student = p.student?.full_name || p.learner_name || "";
      const cls = p.class?.name || p.class_name || "";
      const amount = p.amount || "";
      const method = p.method || p.payment_method || "";
      const ref = p.reference || p.txn_ref || "";
      const notes = p.notes || "";
      rows.push([date, payer, student, cls, amount, method, ref, notes].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payments-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export started", description: "Downloading payments CSV." });
  };

  return (
    <DashboardLayout title="Fee Management" subtitle="Manage fee structures and student payments">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="p-5 border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Today's Collections</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatUGX(todayTotal)}</p>
              <p className="text-xs text-muted-foreground">{todayCount} payment(s) today</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">This Month</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatUGX(monthTotal)}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-2 border-slate-100">
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
        <Card className="p-5 border-2 border-red-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-destructive mt-1">{formatUGX(outstanding)}</p>
              <p className="text-xs text-muted-foreground">{topDefaulters.length} top defaulters</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Defaulters Alert */}
      {topDefaulters.length > 0 && (
        <Card className="p-4 mb-6 border-2 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Top Outstanding Balances</p>
              <div className="grid gap-2 mt-2">
                {topDefaulters.map((d: any) => (
                  <div key={d.id || d.learner_id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <span className="font-semibold">{d.learner_name || d.full_name || "Student"}</span>
                    <span className="font-mono font-bold text-red-600">{formatUGX(d.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleExportPayments}><FileText className="h-4 w-4 mr-2" />Export Statement</Button>
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
