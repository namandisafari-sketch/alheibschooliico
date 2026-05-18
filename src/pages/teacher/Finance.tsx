import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Download, Calendar, ArrowUpRight, TrendingUp, Receipt, HardHat, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplyAdvanceDialog } from "@/components/finance/ApplyAdvanceDialog";
import { useQuery } from "@tanstack/react-query";

const TeacherFinance = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loadingSalaries, setLoadingSalaries] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const { data: advances = [], isLoading: loadingAdvances } = useQuery({
    queryKey: ["my-advances", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: emp } = await supabase.from("employees").select("id").eq("profile_id", user.id).maybeSingle();
      if (!emp) return [];
      const { data, error } = await supabase
        .from("employee_advances")
        .select("*")
        .eq("employee_id", emp.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!user?.id) return;
    const fetchSalaries = async () => {
      setLoadingSalaries(true);
      try {
        const { data, error } = await supabase
          .from("salaries" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("month", { ascending: false });
        if (error) throw error;
        setRows(data || []);
      } catch (err) {
        console.error("Error fetching salaries:", err);
      } finally {
        setLoadingSalaries(false);
      }
    };
    fetchSalaries();
  }, [user?.id]);

  const totalYTD = rows.reduce((s, r) => s + Number(r.net_pay || 0), 0);
  const lastPayslip = rows[0];

  const getStatusBadge = (stage: string) => {
    switch (stage) {
      case "submitted": return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Submitted</Badge>;
      case "director_approved": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Director Approved</Badge>;
      case "accountant_verified": return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>;
      case "final_approved": return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default: return <Badge variant="secondary">{stage}</Badge>;
    }
  };

  return (
    <DashboardLayout title="My Finance" subtitle="Electronic Payslips & Earnings History">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-slate-900 text-white border-none shadow-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Net YTD</p>
                  <p className="text-3xl font-black mt-2 tracking-tighter">
                    UGX {totalYTD.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Termly Growth
                    </Badge>
                  </div>
                </div>
                <div className="p-2 bg-white/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Last Net Pay</p>
                  <p className="text-2xl font-bold mt-2">
                    {lastPayslip ? `UGX ${Number(lastPayslip.net_pay).toLocaleString()}` : "---"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lastPayslip ? `Disbursed for ${lastPayslip.month}` : "Monthly cycle"}
                  </p>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pension & Deductions</p>
                  <p className="text-2xl font-bold mt-2 text-red-600">
                    {lastPayslip ? `UGX ${Number(lastPayslip.deductions || 0).toLocaleString()}` : "0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">NSSF & Statutory Tax (PAYE)</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <HardHat className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-slate-50/50">
                <div>
                  <CardTitle className="text-lg font-bold">Earnings History</CardTitle>
                  <CardDescription>Monthly disbursement details for the past 12 months</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold">
                  <Download className="h-3 w-3" /> Export Statement
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                        <th className="px-6 py-3 text-left">Period</th>
                        <th className="px-6 py-3 text-left">Gross</th>
                        <th className="px-6 py-3 text-left">Deductions</th>
                        <th className="px-6 py-3 text-left">Bonuses</th>
                        <th className="px-6 py-3 text-right">Net Pay</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px] sm:text-sm">
                      {loadingSalaries ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                            <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                          </tr>
                        ))
                      ) : rows.length > 0 ? (
                        rows.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-bold flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {r.month}
                            </td>
                            <td className="px-6 py-4 text-slate-600">UGX {Number(r.base_salary || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-red-500">-UGX {Number(r.deductions || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-emerald-600">+UGX {Number(r.bonuses || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-black">UGX {Number(r.net_pay || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200">
                                <Download className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                            No payroll records found for your account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Financial Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Apply for a salary advance or view existing repayment schedules directly from your account.
                </p>
                <Button className="w-full h-8 text-[11px] font-bold" variant="outline" onClick={() => setIsApplyOpen(true)}>
                  Apply for Advance
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Advance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-6">
                {loadingAdvances ? (
                  <Skeleton className="h-12 w-full" />
                ) : advances.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No active requests.</p>
                ) : (
                  advances.slice(0, 3).map((adv: any) => (
                    <div key={adv.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold">UGX {(adv.amount || 0).toLocaleString()}</span>
                        {getStatusBadge(adv.stage)}
                      </div>
                      <p className="text-[9px] text-muted-foreground line-clamp-1">{adv.purpose_details || "Personal advance"}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Tax Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-[11px] border-b pb-2">
                  <span className="text-muted-foreground">TIN Number</span>
                  <span className="font-mono font-bold tracking-tight">100-XXXX-XXXX</span>
                </div>
                <div className="flex justify-between text-[11px] border-b pb-2">
                  <span className="text-muted-foreground">Tax Scheme</span>
                  <span className="font-bold">PAYE (Statutory)</span>
                </div>
                <Button className="w-full h-8 text-[11px] font-bold mt-2" variant="ghost">
                  View Tax Certificates <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ApplyAdvanceDialog open={isApplyOpen} onOpenChange={setIsApplyOpen} />
    </DashboardLayout>
  );
};

export default TeacherFinance;
