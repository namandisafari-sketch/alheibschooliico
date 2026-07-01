// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, ShoppingCart, CreditCard, ArrowUpRight, TrendingUp, Clock, CheckCircle2,
  AlertCircle, PlusCircle, FileText, DollarSign, Download, Users, Receipt, Landmark,
  Banknote, TrendingDown, PiggyBank
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { startOfMonth, format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const AccountantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: feeToday = 0 } = useQuery({
    queryKey: ["dash-fee-today"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments").select("amount").gte("created_at", today);
      return (data || []).reduce((s, p: any) => s + Number(p.amount || 0), 0);
    },
  });

  const { data: feeMonth = 0 } = useQuery({
    queryKey: ["dash-fee-month"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments").select("amount").gte("created_at", monthStart);
      return (data || []).reduce((s, p: any) => s + Number(p.amount || 0), 0);
    },
  });

  const { data: pos } = useQuery({
    queryKey: ["dashboard-pos"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: pettyCash } = useQuery({
    queryKey: ["dashboard-petty-cash"],
    queryFn: async () => {
      const { data } = await supabase.from("petty_cash_runs").select("*").eq("status", "open").single();
      return data;
    },
  });

  useRealtime("purchase_orders", [["dashboard-pos"], ["dashboard-month-pos"], ["dashboard-unpaid-pos"]]);
  useRealtime("petty_cash_runs", [["dashboard-petty-cash"]]);

  const { data: monthPos } = useQuery({
    queryKey: ["dashboard-month-pos"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("total_amount,created_at").gte("created_at", monthStart);
      return data || [];
    },
  });

  const { data: pendingAdvances } = useQuery({
    queryKey: ["dashboard-advances"],
    queryFn: async () => {
      const { data } = await supabase.from("employee_advances").select("outstanding_balance,amount,stage").neq("stage", "completed");
      return data || [];
    },
  });

  const { data: unpaidPos } = useQuery({
    queryKey: ["dashboard-unpaid-pos"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("total_amount,status").neq("status", "archived");
      return data || [];
    },
  });

  const { data: pendingExpenses = 0 } = useQuery({
    queryKey: ["dash-pending-expenses"],
    queryFn: async () => {
      const { count } = await supabase.from("expense_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const { data: pendingLiq = 0 } = useQuery({
    queryKey: ["dash-pending-liq"],
    queryFn: async () => {
      const { count } = await supabase.from("liquidity_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const { data: transactions7d = [] } = useQuery({
    queryKey: ["dash-fee-7d"],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const { data } = await supabase.from("fee_payments").select("amount").gte("created_at", `${d}T00:00:00`).lte("created_at", `${d}T23:59:59`);
        days.push({ day: format(subDays(new Date(), i), "EEE"), amount: (data || []).reduce((s, p: any) => s + Number(p.amount || 0), 0) });
      }
      return days;
    },
  });

  const totalMonthlySpend = (monthPos || []).reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const pendingAdvancesTotal = (pendingAdvances || []).reduce((s, a) => s + Number(a.outstanding_balance || a.amount || 0), 0);
  const unpaidInvoicesTotal = (unpaidPos || []).reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const pendingCount = pos?.filter(p => p.status !== 'approved' && p.status !== 'archived').length || 0;
  const openFloat = pettyCash ? Number(pettyCash.total_float || 0) : 0;

  const stats = [
    { title: "Today's Collections", value: `UGX ${feeToday.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Monthly Fee Revenue", value: `UGX ${feeMonth.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Open Petty Cash Float", value: `UGX ${openFloat.toLocaleString()}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Pending Approvals", value: pendingCount + pendingExpenses + pendingLiq, icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const handleDownloadLedger = async () => {
    try {
      setIsDownloading(true);
      await generateLedgerReport({ supabase, userName: user?.user_metadata?.full_name || user?.email });
    } catch (err: any) {
      console.error("Failed to generate ledger report:", err);
      alert(err?.message || "Failed to generate ledger report");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadStatements = async () => {
    try {
      setIsDownloading(true);
      await generateFinancialStatementsReport({ supabase, userName: user?.user_metadata?.full_name || user?.email });
    } catch (err: any) {
      console.error("Failed to generate financial statements:", err);
      alert(err?.message || "Failed to generate financial statements");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cash Position Bar */}
      <Card className="border-2 border-emerald-100 rounded-[32px] bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Banknote className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Daily Cash Position</p>
              <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
                UGX {(feeToday - totalMonthlySpend / Math.max(1, new Date().getDate())).toLocaleString()}
              </h2>
              <p className="text-sm text-emerald-800/80">
                Inflows: <span className="font-bold">UGX {feeToday.toLocaleString()}</span> today
                &middot; Outflows: <span className="font-bold">UGX {totalMonthlySpend.toLocaleString()}</span> this month
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/fees")} size="sm" className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6">
              <DollarSign className="h-4 w-4 mr-2" />Collect Fee
            </Button>
            <Button onClick={() => navigate("/accountant/reconciliation")} size="sm" variant="outline" className="h-11 rounded-2xl border-emerald-200 px-6">
              <Receipt className="h-4 w-4 mr-2" />Reconcile
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <Button onClick={() => navigate("/accountant/petty-cash")} className="h-12 rounded-2xl gap-2 bg-slate-900 px-6 font-bold shrink-0">
          <PlusCircle className="h-4 w-4" /> Petty Cash
        </Button>
        <Button onClick={() => navigate("/accountant/procurement")} className="h-12 rounded-2xl gap-2 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-6 font-bold shrink-0">
          <ShoppingCart className="h-4 w-4" /> New PO
        </Button>
        <Button onClick={() => navigate("/accountant/payroll")} className="h-12 rounded-2xl gap-2 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-6 font-bold shrink-0">
          <CreditCard className="h-4 w-4" /> Payroll
        </Button>
        <Button onClick={() => navigate("/accountant/expense-approvals")} className="h-12 rounded-2xl gap-2 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-6 font-bold shrink-0">
          <Receipt className="h-4 w-4" /> Approvals
        </Button>
        <Button onClick={() => navigate("/accountant/accounts")} className="h-12 rounded-2xl gap-2 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-6 font-bold shrink-0">
          <Landmark className="h-4 w-4" /> Accounts
        </Button>
        <Button onClick={() => navigate("/accountant/tax-reports")} className="h-12 rounded-2xl gap-2 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-6 font-bold shrink-0">
          <FileText className="h-4 w-4" /> Tax
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-2 border-slate-100 rounded-[24px] overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.title}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Banner */}
      <Card className="border-none shadow-xl rounded-[36px] overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-6">
        <div className="grid gap-6 lg:grid-cols-[1.9fr_1.1fr] items-center">
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Reports & Financial Statements</CardTitle>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Download polished financial documents for review, filing, or management insight. Includes a ledger report plus Income Statement, Balance Sheet, and Trial Balance in a single PDF.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={handleDownloadLedger} disabled={isDownloading} className="min-w-0 w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest text-sm leading-tight whitespace-normal px-4 py-3">
              <Download className="h-4 w-4 mr-2" /> {isDownloading ? 'Preparing...' : 'Ledger Report'}
            </Button>
            <Button onClick={handleDownloadStatements} disabled={isDownloading} variant="outline" className="min-w-0 w-full h-14 rounded-2xl border-white/30 text-white hover:bg-white/10 font-black uppercase tracking-widest text-sm leading-tight whitespace-normal px-4 py-3">
              <Download className="h-4 w-4 mr-2" /> {isDownloading ? 'Preparing...' : 'Financial Statements'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Fee Collection Trend + Financial Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 border-slate-100 rounded-[32px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Fee Collection (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions7d.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactions7d}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#059669" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No fee data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 rounded-[32px] bg-slate-900 text-white overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase opacity-50 mb-1">Monthly Spend (POs)</p>
              <p className="text-3xl font-black font-mono">{totalMonthlySpend.toLocaleString()}</p>
            </div>
            <div className="space-y-3 pt-4 border-t border-white/10">
              <Row label="Pending Advances" value={pendingAdvancesTotal.toLocaleString()} />
              <Row label="Petty Cash Balance" value={openFloat.toLocaleString()} />
              <Row label="Unpaid Invoices" value={unpaidInvoicesTotal.toLocaleString()} />
              <Row label="Pending Expense Claims" value={`${pendingExpenses} items`} />
              <Row label="Liquidity Requests" value={`${pendingLiq} pending`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchase Orders */}
      <Card className="border-2 border-slate-100 rounded-[32px] overflow-hidden">
        <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Recent Purchase Orders</CardTitle>
            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest" onClick={() => navigate("/accountant/procurement")}>View All</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {pos?.length ? pos.map(po => (
              <div key={po.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{po.title}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PO-{po.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-slate-900">{po.total_amount?.toLocaleString()} <span className="text-[10px] text-slate-400">UGX</span></p>
                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest mt-1">{po.status}</Badge>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 text-sm">No purchase orders yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ label, value }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold opacity-60">{label}</span>
    <span className="font-mono font-bold text-sm">{value}</span>
  </div>
);

async function loadPdfMake() {
  const pdfMakeModule: any = await import('pdfmake/build/pdfmake.js');
  const pdfFontsModule: any = await import('pdfmake/build/vfs_fonts.js');
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;
  if (!pdfFonts || typeof pdfFonts !== 'object') {
    throw new Error('Unable to load pdfmake font data');
  }
  return { pdfMake, pdfFonts };
}

function escapeHtml(str: any) {
  if (!str && str !== 0) return '';
  return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' } as any)[s]);
}

async function generateLedgerReport({ supabase, userName }: { supabase: any; userName: string | undefined }) {
  const { pdfMake, pdfFonts } = await loadPdfMake();
  pdfMake.vfs = pdfFonts;

  const start = startOfMonth(new Date()).toISOString();
  const end = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [posRes, invoicesRes, runsRes, feesRes, expensesRes] = await Promise.all([
    supabase.from("purchase_orders").select("id,title,total_amount,created_at,status,projects(name)").gte("created_at", start).lte("created_at", end),
    supabase.from("petty_cash_invoices").select("id,invoice_number,amount,created_at,run_id").gte("created_at", start).lte("created_at", end),
    supabase.from("petty_cash_runs").select("id,project_id,total_float,created_at,status,projects(name)").gte("created_at", start).lte("created_at", end),
    supabase.from("fee_payments").select("id,amount,created_at,receipt_number,learners(full_name)").gte("created_at", start).lte("created_at", end),
    supabase.from("expense_requests").select("id,purpose,amount,status,created_at").gte("created_at", start).lte("created_at", end),
  ]);

  const entries: any[] = [];
  (feesRes.data || []).forEach((f: any) => entries.push({ date: f.created_at, account: 'Fee Income', ref: f.receipt_number || f.id.slice(0,8), desc: f.learners?.full_name || 'Student', amount: Number(f.amount || 0), type: 'credit' }));
  (posRes.data || []).forEach((p: any) => entries.push({ date: p.created_at, account: p.projects?.name || 'Purchase Orders', ref: `PO-${p.id.slice(0,8)}`, desc: p.title, amount: Number(p.total_amount || 0), type: 'debit' }));
  (invoicesRes.data || []).forEach((i: any) => entries.push({ date: i.created_at, account: 'Petty Cash', ref: i.invoice_number || i.id.slice(0,8), desc: `Run ${i.run_id || ''}`, amount: Number(i.amount || 0), type: 'debit' }));
  (runsRes.data || []).forEach((r: any) => entries.push({ date: r.created_at, account: 'Petty Cash Float', ref: r.id.slice(0,8), desc: r.projects?.name || r.project_id || '', amount: Number(r.total_float || 0), type: 'debit' }));
  (expensesRes.data || []).filter((e: any) => e.status === 'paid').forEach((e: any) => entries.push({ date: e.created_at, account: 'Operating Expenses', ref: e.id.slice(0,8), desc: e.purpose, amount: Number(e.amount || 0), type: 'debit' }));

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalDebit = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredit = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);

  const ledgerBody = [
    [{ text: 'Date', style: 'tableHeader' }, { text: 'Account', style: 'tableHeader' }, { text: 'Reference', style: 'tableHeader' }, { text: 'Description', style: 'tableHeader' }, { text: 'Debit (UGX)', style: 'tableHeader', alignment: 'right' }, { text: 'Credit (UGX)', style: 'tableHeader', alignment: 'right' }]
  ];

  entries.forEach(e => {
    ledgerBody.push([
      new Date(e.date).toLocaleDateString(),
      e.account,
      e.ref,
      e.desc,
      { text: e.type === 'debit' ? Number(e.amount).toLocaleString() : '', alignment: 'right' },
      { text: e.type === 'credit' ? Number(e.amount).toLocaleString() : '', alignment: 'right' },
    ]);
  });

  ledgerBody.push([{ text: 'Total', colSpan: 4, alignment: 'right', style: 'tableTotal' }, {}, {}, {},
    { text: Number(totalDebit).toLocaleString(), alignment: 'right', style: 'tableTotal' },
    { text: Number(totalCredit).toLocaleString(), alignment: 'right', style: 'tableTotal' },
  ]);

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Generated ${new Date().toLocaleString()}`, alignment: 'left', margin: [40, 0, 0, 0], style: 'footer' },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0], style: 'footer' },
      ],
    }),
    content: [
      { text: 'Alheib Financial Ecosystem & Procurement Control', style: 'title' },
      { text: 'General Ledger Report', style: 'header' },
      { text: `Period: ${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`, style: 'subTitle' },
      { text: `Prepared by: ${userName || 'Accountant'}`, style: 'meta', margin: [0, 0, 0, 12] },
      { text: 'Ledger Detail', style: 'sectionHeader', margin: [0, 12, 0, 8] },
      { table: { headerRows: 1, widths: ['auto', '*', 'auto', '*', 'auto', 'auto'], body: ledgerBody }, layout: 'lightHorizontalLines' },
      { text: '\nNote: Debits = expenses/assets. Credits = income/liabilities. Verify against chart of accounts.', style: 'notes' },
    ],
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      header: { fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 6] },
      subTitle: { fontSize: 10, color: '#475569' },
      meta: { fontSize: 9, color: '#64748b' },
      sectionHeader: { fontSize: 11, bold: true, color: '#0f172a' },
      tableHeader: { bold: true, fontSize: 9, color: '#ffffff', fillColor: '#0f172a' },
      tableTotal: { bold: true, fontSize: 10, fillColor: '#f8fafc' },
      notes: { fontSize: 9, color: '#475569', italics: true },
      footer: { fontSize: 8, color: '#94a3b8' },
    },
  };

  const filename = `ledger-report-${new Date().toISOString().slice(0,10)}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}

async function generateFinancialStatementsReport({ supabase, userName }: { supabase: any; userName: string | undefined }) {
  const { pdfMake, pdfFonts } = await loadPdfMake();
  pdfMake.vfs = pdfFonts;

  const start = startOfMonth(new Date()).toISOString();
  const end = new Date().toISOString();

  const [feesRes, posRes, invoicesRes, runsRes, advancesRes, expensesRes] = await Promise.all([
    supabase.from("fee_payments").select("amount").gte("created_at", start).lte("created_at", end),
    supabase.from("purchase_orders").select("total_amount,status,projects(name)").gte("created_at", start).lte("created_at", end),
    supabase.from("petty_cash_invoices").select("amount").gte("created_at", start).lte("created_at", end),
    supabase.from("petty_cash_runs").select("total_float,status").eq("status", "open"),
    supabase.from("employee_advances").select("outstanding_balance,amount").neq("stage", "completed"),
    supabase.from("expense_requests").select("amount,status").eq("status", "paid"),
  ]);

  const revenue = (feesRes.data || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
  const poExpenses = (posRes.data || []).reduce((s, p: any) => s + Number(p.total_amount || 0), 0);
  const pettyExpenses = (invoicesRes.data || []).reduce((s, p: any) => s + Number(p.amount || 0), 0);
  const cashFloat = (runsRes.data || []).reduce((s, r: any) => s + Number(r.total_float || 0), 0);
  const advanceLiab = (advancesRes.data || []).reduce((s, a: any) => s + Number(a.outstanding_balance || a.amount || 0), 0);
  const opExpenses = (expensesRes.data || []).reduce((s, e: any) => s + Number(e.amount || 0), 0);
  const totalExpenses = poExpenses + pettyExpenses + opExpenses;
  const netIncome = revenue - totalExpenses;

  const incomeRows = [
    [{ text: 'Income Statement', style: 'sectionHeader', colSpan: 2 }, {}],
    [{ text: 'Fee Collections', style: 'tableCell' }, { text: revenue.toLocaleString(), alignment: 'right' }],
    [{ text: 'Total Expenses', style: 'tableCell' }, { text: (-totalExpenses).toLocaleString(), alignment: 'right' }],
    [{ text: 'Net Income', style: 'tableTotal' }, { text: netIncome.toLocaleString(), alignment: 'right', style: 'tableTotal' }],
  ];

  const assets = Math.max(0, cashFloat);
  const liabilities = Math.max(0, advanceLiab);
  const equity = assets - liabilities + netIncome;

  const balanceRows = [
    [{ text: 'Balance Sheet', style: 'sectionHeader', colSpan: 2 }, {}],
    [{ text: 'Cash & Petty Cash', style: 'tableCell' }, { text: assets.toLocaleString(), alignment: 'right' }],
    [{ text: 'Outstanding Advances (Liab)', style: 'tableCell' }, { text: liabilities.toLocaleString(), alignment: 'right' }],
    [{ text: 'Equity', style: 'tableCell' }, { text: equity.toLocaleString(), alignment: 'right' }],
    [{ text: 'Check: A = L + E', style: 'tableTotal' }, { text: assets === liabilities + equity ? 'BALANCED' : 'IMBALANCE', alignment: 'right', style: 'tableTotal' }],
  ];

  const trialBody = [
    [{ text: 'Trial Balance', style: 'sectionHeader', colSpan: 3 }, {}, {}],
    [{ text: 'Account', style: 'tableHeader' }, { text: 'Debit', style: 'tableHeader', alignment: 'right' }, { text: 'Credit', style: 'tableHeader', alignment: 'right' }],
    ['Cash & Bank', { text: assets.toLocaleString(), alignment: 'right' }, ''],
    ['Revenue', '', { text: revenue.toLocaleString(), alignment: 'right' }],
    ['Expenses', { text: totalExpenses.toLocaleString(), alignment: 'right' }, ''],
    ['Net Income/Loss', netIncome >= 0 ? '' : { text: Math.abs(netIncome).toLocaleString(), alignment: 'right' }, netIncome >= 0 ? { text: netIncome.toLocaleString(), alignment: 'right' } : ''],
  ];

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Generated ${new Date().toLocaleString()}`, alignment: 'left', margin: [40, 0, 0, 0], style: 'footer' },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0], style: 'footer' },
      ],
    }),
    content: [
      { text: 'Alheib Financial Ecosystem & Procurement Control', style: 'title' },
      { text: 'Financial Statements', style: 'header' },
      { text: `Period: ${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`, style: 'subTitle' },
      { text: `Prepared by: ${userName || 'Accountant'}`, style: 'meta', margin: [0, 0, 0, 12] },
      { table: { headerRows: 1, widths: ['*', 'auto'], body: incomeRows }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 20] },
      { table: { widths: ['*', 'auto'], body: balanceRows }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 20] },
      { table: { headerRows: 1, widths: ['*', 'auto', 'auto'], body: trialBody }, layout: 'lightHorizontalLines' },
      { text: '\nUse this report as a management summary. For statutory filings, reconcile these totals with the formal chart of accounts.', style: 'notes' },
    ],
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      header: { fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 6] },
      subTitle: { fontSize: 10, color: '#475569' },
      meta: { fontSize: 9, color: '#64748b' },
      sectionHeader: { fontSize: 11, bold: true, color: '#0f172a', margin: [0, 8, 0, 4] },
      tableHeader: { bold: true, fontSize: 9, color: '#ffffff', fillColor: '#0f172a' },
      tableCell: { fontSize: 9, color: '#0f172a' },
      tableTotal: { bold: true, fontSize: 10, fillColor: '#f8fafc' },
      notes: { fontSize: 9, color: '#475569', italics: true },
      footer: { fontSize: 8, color: '#94a3b8' },
    },
  };

  const filename = `financial-statements-${new Date().toISOString().slice(0,10)}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}
