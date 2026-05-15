// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, Download, Calculator, Building2, Wallet, TrendingUp, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const fmtUGX = (n: number) => `UGX ${Math.round(n).toLocaleString()}`;

// Uganda PAYE bands (monthly, simplified)
const computePAYE = (gross: number) => {
  if (gross <= 235_000) return 0;
  if (gross <= 335_000) return (gross - 235_000) * 0.10;
  if (gross <= 410_000) return 10_000 + (gross - 335_000) * 0.20;
  if (gross <= 10_000_000) return 25_000 + (gross - 410_000) * 0.30;
  return 25_000 + (10_000_000 - 410_000) * 0.30 + (gross - 10_000_000) * 0.40;
};

const TaxReports = () => {
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));

  const month = useMemo(() => {
    const d = new Date(`${period}-01T00:00:00`);
    return { start: startOfMonth(d).toISOString(), end: endOfMonth(d).toISOString(), label: format(d, "MMMM yyyy") };
  }, [period]);

  const { data: payroll = [] } = useQuery({
    queryKey: ["tax-payroll", period],
    queryFn: async () => {
      const { data } = await supabase.from("payroll_runs").select("*").gte("created_at", month.start).lte("created_at", month.end);
      return data || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["tax-employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, full_name, gross_salary, nssf_member, tin");
      return data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["tax-fee-payments", period],
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments").select("amount, created_at").gte("created_at", month.start).lte("created_at", month.end);
      return data || [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["tax-expenses", period],
    queryFn: async () => {
      const { data } = await supabase.from("expense_requests").select("amount, status, created_at").gte("created_at", month.start).lte("created_at", month.end);
      return data || [];
    },
  });

  const payeRows = employees.map((e: any) => {
    const gross = Number(e.gross_salary || 0);
    const paye = computePAYE(gross);
    const nssf = e.nssf_member ? gross * 0.05 : 0;
    const employerNssf = e.nssf_member ? gross * 0.10 : 0;
    const net = gross - paye - nssf;
    return { ...e, gross, paye, nssf, employerNssf, net };
  });

  const totals = {
    gross: payeRows.reduce((s, r) => s + r.gross, 0),
    paye: payeRows.reduce((s, r) => s + r.paye, 0),
    nssfEmp: payeRows.reduce((s, r) => s + r.nssf, 0),
    nssfEmployer: payeRows.reduce((s, r) => s + r.employerNssf, 0),
    revenue: payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
    expense: expenses.filter((e: any) => e.status === "paid" || e.status === "approved").reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
  };
  const profit = totals.revenue - totals.expense - totals.gross - totals.nssfEmployer;
  const corpTax = profit > 0 ? profit * 0.30 : 0;

  const handlePrint = () => window.print();
  const downloadCsv = (rows: any[], name: string) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(",")].concat(rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${name}-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Tax Reports" subtitle="URA / PAYE / NSSF / VAT summary printouts">
      <div className="space-y-6 print:space-y-3">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 shadow-sm print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-violet-700">Accountant · Statutory Filings</p>
                <h2 className="text-2xl font-black text-violet-950">Tax & compliance pack — {month.label}</h2>
                <p className="text-sm text-violet-800/80">Auto-computed from payroll, fee receipts & approved expenses.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="month" className="border rounded-md h-10 px-3 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)} />
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print pack</Button>
            </div>
          </div>
        </div>

        <div className="hidden print:block text-center mb-4">
          <h1 className="text-2xl font-black uppercase">Alheib Mixed Day & Boarding School</h1>
          <p className="text-sm">Tax & Compliance Report — {month.label}</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Wallet} label="Gross Payroll" value={fmtUGX(totals.gross)} tone="indigo" />
          <KpiCard icon={Calculator} label="PAYE Liability" value={fmtUGX(totals.paye)} tone="rose" />
          <KpiCard icon={Building2} label="NSSF (10% + 5%)" value={fmtUGX(totals.nssfEmployer + totals.nssfEmp)} tone="amber" />
          <KpiCard icon={TrendingUp} label="Profit Estimate" value={fmtUGX(profit)} tone={profit >= 0 ? "emerald" : "rose"} />
        </div>

        <Tabs defaultValue="paye" className="print:hidden">
          <TabsList>
            <TabsTrigger value="paye">PAYE Schedule</TabsTrigger>
            <TabsTrigger value="nssf">NSSF Schedule</TabsTrigger>
            <TabsTrigger value="vat">VAT / Income</TabsTrigger>
            <TabsTrigger value="corp">Corp. Tax</TabsTrigger>
          </TabsList>

          <TabsContent value="paye">
            <Card className="border-2 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>PAYE schedule — {month.label}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => downloadCsv(payeRows, "paye")}><Download className="h-3 w-3 mr-1" />CSV</Button>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b">
                    <tr><th className="text-left p-2">Employee</th><th className="text-left p-2">TIN</th><th className="text-right p-2">Gross</th><th className="text-right p-2">PAYE</th><th className="text-right p-2">NSSF (5%)</th><th className="text-right p-2">Net</th></tr>
                  </thead>
                  <tbody>
                    {payeRows.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-accent/30">
                        <td className="p-2 font-semibold">{r.full_name}</td>
                        <td className="p-2 text-muted-foreground">{r.tin || "—"}</td>
                        <td className="p-2 text-right tabular-nums">{fmtUGX(r.gross)}</td>
                        <td className="p-2 text-right tabular-nums text-rose-700">{fmtUGX(r.paye)}</td>
                        <td className="p-2 text-right tabular-nums">{fmtUGX(r.nssf)}</td>
                        <td className="p-2 text-right tabular-nums font-bold">{fmtUGX(r.net)}</td>
                      </tr>
                    ))}
                    {!payeRows.length && <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No employees on file.</td></tr>}
                  </tbody>
                  <tfoot className="border-t-2 font-black">
                    <tr><td colSpan={2} className="p-2">TOTAL</td>
                      <td className="p-2 text-right tabular-nums">{fmtUGX(totals.gross)}</td>
                      <td className="p-2 text-right tabular-nums text-rose-700">{fmtUGX(totals.paye)}</td>
                      <td className="p-2 text-right tabular-nums">{fmtUGX(totals.nssfEmp)}</td>
                      <td className="p-2 text-right tabular-nums">{fmtUGX(totals.gross - totals.paye - totals.nssfEmp)}</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nssf">
            <Card className="border-2 rounded-2xl">
              <CardHeader><CardTitle>NSSF contributions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Row label="Employee contributions (5%)" value={fmtUGX(totals.nssfEmp)} />
                <Row label="Employer contributions (10%)" value={fmtUGX(totals.nssfEmployer)} />
                <Row label="Total remittance" value={fmtUGX(totals.nssfEmp + totals.nssfEmployer)} bold />
                <p className="text-xs text-muted-foreground pt-3">Members on file: {employees.filter((e: any) => e.nssf_member).length} / {employees.length}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vat">
            <Card className="border-2 rounded-2xl">
              <CardHeader><CardTitle>Income & VAT — {month.label}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Row label="Total fee receipts" value={fmtUGX(totals.revenue)} />
                <Row label="Approved expenses" value={fmtUGX(totals.expense)} />
                <Row label="Estimated VAT (18% on taxable supplies)" value={fmtUGX(totals.revenue * 0.18 / 1.18)} muted />
                <p className="text-xs text-muted-foreground pt-3">Educational services are typically exempt — verify each invoice line before filing.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corp">
            <Card className="border-2 rounded-2xl">
              <CardHeader><CardTitle>Corporation tax estimate</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Row label="Revenue" value={fmtUGX(totals.revenue)} />
                <Row label="(–) Payroll cost (gross + employer NSSF)" value={fmtUGX(totals.gross + totals.nssfEmployer)} />
                <Row label="(–) Approved operating expenses" value={fmtUGX(totals.expense)} />
                <Row label="Profit before tax" value={fmtUGX(profit)} bold />
                <Row label="Corporation tax @ 30%" value={fmtUGX(corpTax)} bold />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Print-only summary */}
        <div className="hidden print:block">
          <table className="w-full text-sm border">
            <tbody>
              <tr className="border-b"><td className="p-2 font-bold">Gross payroll</td><td className="p-2 text-right">{fmtUGX(totals.gross)}</td></tr>
              <tr className="border-b"><td className="p-2 font-bold">PAYE</td><td className="p-2 text-right">{fmtUGX(totals.paye)}</td></tr>
              <tr className="border-b"><td className="p-2 font-bold">NSSF (5% + 10%)</td><td className="p-2 text-right">{fmtUGX(totals.nssfEmp + totals.nssfEmployer)}</td></tr>
              <tr className="border-b"><td className="p-2 font-bold">Revenue</td><td className="p-2 text-right">{fmtUGX(totals.revenue)}</td></tr>
              <tr className="border-b"><td className="p-2 font-bold">Operating expenses</td><td className="p-2 text-right">{fmtUGX(totals.expense)}</td></tr>
              <tr className="border-b"><td className="p-2 font-black">Profit before tax</td><td className="p-2 text-right font-black">{fmtUGX(profit)}</td></tr>
              <tr><td className="p-2 font-black">Corporation tax @ 30%</td><td className="p-2 text-right font-black">{fmtUGX(corpTax)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

const KpiCard = ({ icon: Icon, label, value, tone }: any) => {
  const tones: Record<string, string> = {
    indigo: "from-indigo-500 to-blue-600",
    rose: "from-rose-500 to-pink-600",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-600",
  };
  return (
    <div className="rounded-2xl border-2 bg-card p-4 hover:shadow-md transition-shadow">
      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <p className="text-lg font-black tabular-nums mt-0.5">{value}</p>
    </div>
  );
};

const Row = ({ label, value, bold, muted }: any) => (
  <div className={`flex items-center justify-between py-2 border-b ${bold ? "font-black text-base" : ""} ${muted ? "text-muted-foreground" : ""}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

export default TaxReports;
