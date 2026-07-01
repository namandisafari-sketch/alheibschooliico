// @ts-nocheck

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Users, Globe, BarChart3, Plus, ChevronRight, ChevronDown, Edit2, Trash2, Loader2, Landmark, ArrowDownCircle, ArrowUpCircle, PieChart, Coins, User, Building2, Camera, History, BookOpen, Search, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

type Account = {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_id: string | null;
  currency: string;
  is_active: boolean;
};

const Accounts = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("chart");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [parentForNew, setParentForNew] = useState<Account | null>(null);

  // Donor State
  const [isAddingDonor, setIsAddingDonor] = useState(false);
  const [isAddingDonation, setIsAddingDonation] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  // Form State - Account
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Account['type']>("asset");

  // General Ledger State
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [expandedLedger, setExpandedLedger] = useState<Record<string, boolean>>({});

  const toggleLedger = async (accountId: string) => {
    if (expandedLedger[accountId]) {
      setExpandedLedger(prev => ({ ...prev, [accountId]: false }));
      return;
    }
    setExpandedLedger(prev => ({ ...prev, [accountId]: true }));
    const acct = accounts?.find(a => a.id === accountId);
    if (acct && !acct.journal_entries) {
      (acct as any)._loading = true;
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(50);
      (acct as any).journal_entries = data || [];
      (acct as any)._loading = false;
    }
  };

  const ledgerFiltered = (accounts || [])
    .filter(a => !ledgerSearch || a.name.toLowerCase().includes(ledgerSearch.toLowerCase()) || a.code?.includes(ledgerSearch))
    .slice(0, 30);

  // Form State - Donor
  const [donorName, setDonorName] = useState("");
  const [donorType, setDonorType] = useState("individual");
  const [donorContact, setDonorContact] = useState("");

  // Form State - Donation
  const [donationAmount, setDonationAmount] = useState("");
  const [donationProject, setDonationProject] = useState("");
  const [donationReceipt, setDonationReceipt] = useState("");
  const [donationNotes, setDonationNotes] = useState("");

  // Queries
  const { data: accounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_accounts")
        .select("*")
        .order("code", { ascending: true });
      if (error) throw error;
      return data as Account[];
    }
  });

  const { data: donors, isLoading: loadingDonors } = useQuery({
    queryKey: ["donors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donors").select("*").order("name");
      if (error) throw error;
      return data;
    }
  });

  const { data: donations, isLoading: loadingDonations } = useQuery({
    queryKey: ["donations", selectedDonor?.id],
    queryFn: async () => {
      if (!selectedDonor) return [];
      const { data, error } = await supabase
        .from("donations")
        .select("*, projects(name)")
        .eq("donor_id", selectedDonor.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDonor
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    }
  });

  // Mutations
  const addAccountMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("finance_accounts").insert({
        code: newCode,
        name: newName,
        type: parentForNew ? parentForNew.type : newType,
        parent_id: parentForNew?.id || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      toast.success("Account created successfully");
      setIsAddingAccount(false);
      setNewCode("");
      setNewName("");
      setParentForNew(null);
    }
  });

  const addDonorMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("donors").insert({
        name: donorName,
        type: donorType as any,
        contact: donorContact
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      toast.success("Donor added successfully");
      setIsAddingDonor(false);
      setDonorName("");
      setDonorContact("");
    }
  });

  const addDonationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("donations").insert({
        donor_id: selectedDonor.id,
        project_id: donationProject || null,
        amount: parseFloat(donationAmount),
        receipt_image_url: donationReceipt,
        notes: donationNotes
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations", selectedDonor.id] });
      toast.success("Donation logged successfully");
      setIsAddingDonation(false);
      setDonationAmount("");
      setDonationReceipt("");
      setDonationNotes("");
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      toast.success("Account removed");
    }
  });

  const deleteDonorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("donors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setSelectedDonor(null);
      toast.success("Donor deleted");
    }
  });

  const formatUGX = (value: any) => Number(value || 0).toLocaleString();

  const loadPdfMake = async () => {
    const pdfMakeModule: any = await import('pdfmake/build/pdfmake.js');
    const pdfFontsModule: any = await import('pdfmake/build/vfs_fonts.js');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    if (!pdfFonts || typeof pdfFonts !== 'object') {
      throw new Error('Unable to load pdfmake font data');
    }
    return { pdfMake, pdfFonts };
  };

  const fetchFinancialData = async () => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const end = new Date().toISOString();

    const [posRes, invoicesRes, runsRes, feesRes, advancesRes, projectsRes] = await Promise.all([
      supabase.from("purchase_orders").select("id,title,total_amount,created_at,status,project_id").gte("created_at", start).lte("created_at", end),
      supabase.from("petty_cash_invoices").select("id,invoice_number,amount,entered_at,run_id").gte("entered_at", start).lte("entered_at", end),
      supabase.from("petty_cash_runs").select("id,project_id,total_float,opened_at,status").gte("opened_at", start).lte("opened_at", end),
      supabase.from("fee_payments").select("id,amount,created_at,learner_id").gte("created_at", start).lte("created_at", end),
      supabase.from("employee_advances").select("id,amount,outstanding_balance,stage,created_at").neq("stage", "completed").lte("created_at", end),
      supabase.from("projects").select("id,name")
    ]);

    const error = [posRes, invoicesRes, runsRes, feesRes, advancesRes, projectsRes].find(r => r.error)?.error;
    if (error) throw error;

    return {
      purchaseOrders: posRes.data || [],
      pettyCashInvoices: invoicesRes.data || [],
      pettyCashRuns: runsRes.data || [],
      feePayments: feesRes.data || [],
      advances: advancesRes.data || [],
      projects: projectsRes.data || []
    };
  };

  const generateReport = async (type: string) => {
    setIsGeneratingReport(true);
    setActiveReport(type);
    try {
      const { pdfMake, pdfFonts } = await loadPdfMake();
      pdfMake.vfs = pdfFonts;
      const { purchaseOrders, pettyCashInvoices, pettyCashRuns, feePayments, advances, projects } = await fetchFinancialData();

      const projectNameById = new Map((projects || []).map((project: any) => [project.id, project.name]));
      const revenue = feePayments.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
      const poExpenses = purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0);
      const pettyExpenses = pettyCashInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.amount || 0), 0);
      const outflowRuns = pettyCashRuns.reduce((sum: number, run: any) => sum + Number(run.total_float || 0), 0);
      const totalExpenses = poExpenses + pettyExpenses + outflowRuns;
      const advanceLiabilities = advances.reduce((sum: number, adv: any) => sum + Number(adv.outstanding_balance || adv.amount || 0), 0);
      const pettyCashBalance = pettyCashRuns.reduce((sum: number, run: any) => sum + Number(run.total_float || 0), 0);
      const assets = Math.max(0, pettyCashBalance);
      const liabilities = Math.max(0, advanceLiabilities);
      const netIncome = revenue - totalExpenses;
      const equity = assets - liabilities + netIncome;
      const unpaidPurchaseTotal = purchaseOrders.filter((p: any) => p.status !== 'archived' && p.status !== 'approved').reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);

      const projectMap = new Map<string, { expenses: number }>();
      purchaseOrders.forEach((po: any) => {
        const project = projectNameById.get(po.project_id) || 'Unassigned';
        const current = projectMap.get(project) || { expenses: 0 };
        current.expenses += Number(po.total_amount || 0);
        projectMap.set(project, current);
      });
      pettyCashRuns.forEach((run: any) => {
        const project = projectNameById.get(run.project_id) || 'Unassigned';
        const current = projectMap.get(project) || { expenses: 0 };
        current.expenses += Number(run.total_float || 0);
        projectMap.set(project, current);
      });

      const projectRows = Array.from(projectMap.entries()).map(([project, totals]) => [
        project,
        { text: '0', alignment: 'right' },
        { text: formatUGX(totals.expenses), alignment: 'right' },
        { text: formatUGX(-totals.expenses), alignment: 'right' }
      ]);

      const cashFlowRows = [
        [{ text: 'Date', style: 'tableHeader' }, { text: 'Source', style: 'tableHeader' }, { text: 'Type', style: 'tableHeader' }, { text: 'Amount (UGX)', style: 'tableHeader', alignment: 'right' }]
      ];
      feePayments.forEach((payment: any) => cashFlowRows.push([
        new Date(payment.created_at).toLocaleDateString(),
        'Student Fee',
        'Inflow',
        { text: formatUGX(payment.amount), alignment: 'right' }
      ]));
      purchaseOrders.forEach((po: any) => cashFlowRows.push([
        new Date(po.created_at).toLocaleDateString(),
        `PO ${po.id.slice(0,8)}`,
        'Outflow',
        { text: formatUGX(po.total_amount), alignment: 'right' }
      ]));
      pettyCashInvoices.forEach((invoice: any) => cashFlowRows.push([
        new Date(invoice.entered_at).toLocaleDateString(),
        `Petty Cash ${invoice.invoice_number || invoice.id.slice(0,8)}`,
        'Outflow',
        { text: formatUGX(invoice.amount), alignment: 'right' }
      ]));
      pettyCashRuns.forEach((run: any) => cashFlowRows.push([
        new Date(run.opened_at).toLocaleDateString(),
        `Cash Run ${run.id.slice(0,8)}`,
        'Outflow',
        { text: formatUGX(run.total_float), alignment: 'right' }
      ]));

      const cashTotals = {
        inflow: feePayments.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0),
        outflow: purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0) +
                 pettyCashInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.amount || 0), 0) +
                 pettyCashRuns.reduce((sum: number, run: any) => sum + Number(run.total_float || 0), 0),
      };

      const trialTotals = {
        debit: assets + totalExpenses + (netIncome < 0 ? Math.abs(netIncome) : 0),
        credit: liabilities + revenue + (netIncome >= 0 ? netIncome : 0)
      };

      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = new Date();
      const periodText = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;

      const sections: any[] = [];
      let filename = `accounting-report-${type}-${new Date().toISOString().slice(0,10)}.pdf`;
      let title = '';
      switch (type) {
        case 'trial-balance':
          title = 'Trial Balance';
          sections.push({ text: 'Trial Balance', style: 'sectionHeader', margin: [0, 18, 0, 8] });
          sections.push({ table: { headerRows: 1, widths: ['*', 'auto', 'auto'], body: [
            [{ text: 'Account', style: 'tableHeader' }, { text: 'Debit', style: 'tableHeader', alignment: 'right' }, { text: 'Credit', style: 'tableHeader', alignment: 'right' }],
            ['Cash & Petty Cash', { text: formatUGX(assets), alignment: 'right' }, ''],
            ['Outstanding Advances', '', { text: formatUGX(liabilities), alignment: 'right' }],
            ['Revenue', '', { text: formatUGX(revenue), alignment: 'right' }],
            ['Expenses', { text: formatUGX(totalExpenses), alignment: 'right' }, ''],
            ['Net Income', netIncome >= 0 ? '' : { text: formatUGX(Math.abs(netIncome)), alignment: 'right' } , netIncome >= 0 ? { text: formatUGX(netIncome), alignment: 'right' } : '']
          ] }, layout: 'lightHorizontalLines' });
          sections.push({ table: { widths: ['*', 'auto', 'auto'], body: [[{ text: 'Totals', style: 'tableTotal', alignment: 'right' }, { text: formatUGX(assets + totalExpenses + (netIncome < 0 ? Math.abs(netIncome) : 0)), style: 'tableTotal', alignment: 'right' }, { text: formatUGX(liabilities + revenue + (netIncome >= 0 ? netIncome : 0)), style: 'tableTotal', alignment: 'right' }]] }, layout: 'lightHorizontalLines', margin: [0, 4, 0, 0] });
          sections.push({ text: trialTotalsMessage(trialTotals), style: 'notes' });
          break;
        case 'pl-statement':
          title = 'Profit & Loss Statement';
          sections.push({ text: 'Income Summary', style: 'sectionHeader', margin: [0, 18, 0, 8] });
          sections.push({ table: { widths: ['*', 'auto'], body: [
            [{ text: 'Revenue', style: 'tableHeader' }, { text: 'Amount (UGX)', style: 'tableHeader', alignment: 'right' }],
            ['Fee Collections', { text: formatUGX(revenue), alignment: 'right' }],
            ['Total Expenses', { text: formatUGX(totalExpenses), alignment: 'right' }],
            ['Net Income', { text: formatUGX(netIncome), alignment: 'right' }]
          ] }, layout: 'lightHorizontalLines' });
          sections.push({ text: 'Project-wise Profit & Loss', style: 'sectionHeader', margin: [0, 18, 0, 8] });
          sections.push({ table: { widths: ['*', 'auto', 'auto', 'auto'], body: [
            [{ text: 'Project', style: 'tableHeader' }, { text: 'Revenue', style: 'tableHeader', alignment: 'right' }, { text: 'Expense', style: 'tableHeader', alignment: 'right' }, { text: 'Net', style: 'tableHeader', alignment: 'right' }],
            ...projectRows
          ] }, layout: 'lightHorizontalLines' });
          break;
        case 'balance-sheet':
          title = 'Balance Sheet';
          sections.push({ text: 'Assets vs Liabilities Snapshot', style: 'sectionHeader', margin: [0, 18, 0, 8] });
          sections.push({ table: { widths: ['*', 'auto'], body: [
             [{ text: 'Category', style: 'tableHeader' }, { text: 'Amount (UGX)', style: 'tableHeader', alignment: 'right' }],
             ['Cash & Petty Cash', { text: formatUGX(assets), alignment: 'right' }],
             ['Receivables / Other Assets', { text: '0', alignment: 'right' }],
             ['Outstanding Advances', { text: formatUGX(liabilities), alignment: 'right' }],
             ['Unpaid Purchase Orders', { text: formatUGX(unpaidPurchaseTotal), alignment: 'right' }],
             ['Equity', { text: formatUGX(equity), alignment: 'right' }]
          ] }, layout: 'lightHorizontalLines' });
          sections.push({ text: 'Balance Check', style: 'sectionHeader', margin: [0, 18, 0, 8] });
          sections.push({ text: `Assets (${formatUGX(assets)}) ${assets === liabilities + equity ? 'equal' : 'do not equal'} Liabilities + Equity (${formatUGX(liabilities + equity)})`, style: 'notes' });
          break;
        case 'cash-flow':
          title = 'Cash Flow Statement';
          sections.push({ text: 'Inflow and Outflow Tracking', style: 'sectionHeader', margin: [0, 18, 0, 8] });
          sections.push({ table: { widths: ['auto', '*', 'auto', 'auto'], body: cashFlowRows }, layout: 'lightHorizontalLines' });
          sections.push({ table: { widths: ['*', 'auto'], body: [
            [{ text: 'Total Inflow', style: 'tableHeader' }, { text: formatUGX(cashTotals.inflow), style: 'tableHeader', alignment: 'right' }],
            [{ text: 'Total Outflow', style: 'tableHeader' }, { text: formatUGX(cashTotals.outflow), style: 'tableHeader', alignment: 'right' }],
            [{ text: 'Net Cash Movement', style: 'tableHeader' }, { text: formatUGX(cashTotals.inflow - cashTotals.outflow), style: 'tableHeader', alignment: 'right' }]
          ] }, layout: 'lightHorizontalLines', margin: [0, 12, 0, 0] });
          break;
        default:
          throw new Error('Unknown report type');
      }

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        footer: (currentPage: number, pageCount: number) => ({
          columns: [
            { text: `Generated ${new Date().toLocaleString()}`, alignment: 'left', margin: [40, 0, 0, 0], style: 'footer' },
            { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0], style: 'footer' }
          ]
        }),
        content: [
          { text: 'Alheib Financial Ecosystem & Procurement Control', style: 'title' },
          { text: title, style: 'header' },
          { text: `Period: ${periodText}`, style: 'subTitle' },
          { text: `Prepared by: Accountant`, style: 'meta', margin: [0, 0, 0, 12] },
          ...sections,
          { text: '\nUse this report for internal finance monitoring. Reconcile the totals against live ledger entries.', style: 'notes' }
        ],
        styles: {
          title: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
          header: { fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 6] },
          subTitle: { fontSize: 10, color: '#475569' },
          meta: { fontSize: 9, color: '#64748b' },
          sectionHeader: { fontSize: 11, bold: true, color: '#0f172a' },
          tableHeader: { bold: true, fontSize: 10, color: '#ffffff', fillColor: '#0f172a' },
          tableCell: { fontSize: 9, color: '#0f172a' },
          tableTotal: { bold: true, fontSize: 10, fillColor: '#f8fafc' },
          notes: { fontSize: 9, color: '#475569', italics: true },
          footer: { fontSize: 8, color: '#94a3b8' }
        }
      };

      pdfMake.createPdf(docDefinition).download(filename);
      toast.success(`${title} generated successfully`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Unable to generate report');
    } finally {
      setIsGeneratingReport(false);
      setActiveReport(null);
    }
  };

  const trialTotalsMessage = (totals: { debit: number; credit: number}) => {
    return totals.debit === totals.credit
      ? 'Trial balance is in parity. Debits and credits are equal.'
      : `Parity warning: debits (${formatUGX(totals.debit)}) do not equal credits (${formatUGX(totals.credit)})`;
  };

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = accounts?.filter(a => a.parent_id === parentId) || [];
    if (children.length === 0 && parentId !== null) return null;

    return (
      <div className={cn("space-y-1", depth > 0 && "ml-6 mt-1 border-l border-slate-100 pl-2")}>
        {children.map(account => {
          const isExpanded = expandedNodes.has(account.id);
          const hasChildren = accounts?.some(a => a.parent_id === account.id);

          return (
            <div key={account.id} className="group">
              <div className={cn(
                "flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors",
                depth === 0 ? "bg-slate-50/50 mb-2" : "bg-transparent"
              )}>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleNode(account.id)}
                    className={cn(
                      "p-1 rounded-md hover:bg-slate-200 transition-colors",
                      !hasChildren && "opacity-0 pointer-events-none"
                    )}
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                    account.type === 'asset' ? 'bg-emerald-100 text-emerald-700' :
                    account.type === 'liability' ? 'bg-amber-100 text-amber-700' :
                    account.type === 'equity' ? 'bg-indigo-100 text-indigo-700' :
                    account.type === 'income' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {account.type === 'asset' ? <Landmark className="h-4 w-4" /> :
                     account.type === 'liability' ? <TrendingDown className="h-4 w-4" /> :
                     account.type === 'equity' ? <Coins className="h-4 w-4" /> :
                     account.type === 'income' ? <ArrowDownCircle className="h-4 w-4" /> :
                     <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black text-slate-400">{account.code}</span>
                      <span className={cn("text-sm font-bold", depth === 0 ? "text-slate-900" : "text-slate-600")}>
                        {account.name}
                      </span>
                    </div>
                    {depth === 0 && (
                      <Badge variant="outline" className="text-[8px] uppercase tracking-widest h-4 px-1">
                        {account.type}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg"
                    onClick={() => {
                      setParentForNew(account);
                      setIsAddingAccount(true);
                    }}
                   >
                      <Plus className="h-3.5 w-3.5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                      <Edit2 className="h-3.5 w-3.5" />
                   </Button>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg text-red-400 hover:text-red-600"
                    onClick={() => {
                      if (hasChildren) {
                        toast.error("Cannot delete account with sub-accounts");
                        return;
                      }
                      if (confirm("Delete this account permanently?")) {
                        deleteAccountMutation.mutate(account.id);
                      }
                    }}
                   >
                      <Trash2 className="h-3.5 w-3.5" />
                   </Button>
                </div>
              </div>
              {isExpanded && renderTree(account.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout title={t("finance")} subtitle="Manage hierarchical ledger and financial organization">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-slate-100 rounded-2xl">
          <TabsTrigger value="chart" className="gap-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
            <Wallet className="h-4 w-4" /> Chart
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
            <BookOpen className="h-4 w-4" /> General Ledger
          </TabsTrigger>
          <TabsTrigger value="donors" className="gap-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
            <Users className="h-4 w-4" /> Donors
          </TabsTrigger>
          <TabsTrigger value="currency" className="gap-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
            <Globe className="h-4 w-4" /> Rates
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
            <BarChart3 className="h-4 w-4" /> Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-6 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Chart of Accounts</h2>
                <p className="text-sm text-slate-500 font-medium">Define your custom hierarchical ledger structure.</p>
             </div>
             <Button onClick={() => setIsAddingAccount(true)} className="gap-2 bg-slate-900 rounded-2xl h-12 px-6">
                <Plus className="h-5 w-5" /> Create Root Account
             </Button>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
             {loadingAccounts ? (
               <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
             ) : accounts?.length ? (
               <div className="space-y-4">
                  {renderTree(null)}
               </div>
             ) : (
               <div className="py-20 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center text-slate-400">
                  <Wallet className="h-16 w-16 mb-4 opacity-10" />
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Empty Ledger</h3>
                  <p className="text-sm mt-1">Start by adding root accounts for Assets, Liabilities, etc.</p>
               </div>
             )}
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">General Ledger</h2>
                <p className="text-sm text-slate-500 font-medium">Drill into journal entries by account.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search accounts..."
                    value={ledgerSearch}
                    onChange={e => setLedgerSearch(e.target.value)}
                    className="h-10 pl-9 rounded-xl w-48"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {loadingAccounts ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
              ) : ledgerFiltered.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No accounts found.</div>
              ) : ledgerFiltered.map(acct => {
                const jeBalance = (acct.journal_entries || []).reduce((s: number, je: any) => {
                  return s + (je.debit || 0) - (je.credit || 0);
                }, 0);
                return (
                  <div key={acct.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleLedger(acct.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black",
                          acct.type === 'asset' ? 'bg-emerald-100 text-emerald-700' :
                          acct.type === 'liability' ? 'bg-amber-100 text-amber-700' :
                          acct.type === 'equity' ? 'bg-indigo-100 text-indigo-700' :
                          acct.type === 'income' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        )}>{acct.code}</div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">{acct.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black">{acct.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Balance</p>
                          <p className={cn("text-sm font-black font-mono", jeBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {Math.abs(jeBalance).toLocaleString()} {jeBalance < 0 ? '(Cr)' : '(Dr)'}
                          </p>
                        </div>
                        {expandedLedger[acct.id] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      </div>
                    </button>
                    {expandedLedger[acct.id] && (
                      <div className="border-t border-slate-50 bg-slate-50/30">
                        {acct._loading ? (
                          <div className="p-6 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto text-slate-300" /></div>
                        ) : (acct.journal_entries || []).length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">No journal entries for this account.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                  <th className="px-6 py-3">Date</th>
                                  <th className="px-6 py-3">Description</th>
                                  <th className="px-6 py-3">Reference</th>
                                  <th className="px-6 py-3 text-right">Debit</th>
                                  <th className="px-6 py-3 text-right">Credit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {acct.journal_entries.map((je: any) => (
                                  <tr key={je.id} className="hover:bg-white transition-colors">
                                    <td className="px-6 py-3 text-slate-500 text-xs">{format(new Date(je.created_at), 'dd MMM yy')}</td>
                                    <td className="px-6 py-3 font-medium text-slate-700">{je.description || je.reference || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{je.reference || je.id.slice(0, 8)}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">{je.debit ? Number(je.debit).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold text-red-700">{je.credit ? Number(je.credit).toLocaleString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="donors" className="mt-6 space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
             {/* Left Panel: Donor List */}
             <div className="w-full lg:w-80 space-y-4">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black uppercase tracking-tight text-slate-900">Donors</h3>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => setIsAddingDonor(true)}>
                         <Plus className="h-4 w-4" />
                      </Button>
                   </div>
                   
                   <div className="space-y-2">
                      {loadingDonors ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
                      ) : donors?.length ? (
                        donors.map(donor => (
                          <div 
                            key={donor.id} 
                            onClick={() => setSelectedDonor(donor)}
                            className={cn(
                              "p-4 rounded-2xl cursor-pointer transition-all border",
                              selectedDonor?.id === donor.id ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-50 text-slate-600 hover:border-slate-200"
                            )}
                          >
                             <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                  selectedDonor?.id === donor.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                   {donor.type === 'organization' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-sm font-bold truncate">{donor.name}</p>
                                   <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedDonor?.id === donor.id ? "text-slate-400" : "text-slate-300")}>
                                      {donor.type}
                                   </p>
                                </div>
                             </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">No donors found.</p>
                      )}
                   </div>
                </div>
             </div>

             {/* Right Panel: Donor Detail & History */}
             <div className="flex-1">
                {selectedDonor ? (
                  <div className="space-y-6">
                     <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                           <div>
                              <Badge className="bg-emerald-500 text-white uppercase text-[10px] font-black mb-2">{selectedDonor.type} DONOR</Badge>
                              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedDonor.name}</h2>
                              <p className="text-slate-500 font-medium mt-1">{selectedDonor.contact || "No contact info available"}</p>
                           </div>
                           <div className="flex gap-2">
                             <Button className="rounded-2xl h-12 px-6 gap-2 bg-slate-900" onClick={() => setIsAddingDonation(true)}>
                                <Plus className="h-5 w-5" /> Log Donation
                             </Button>
                             <Button variant="ghost" className="rounded-2xl h-12 w-12 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => confirm("Delete this donor?") && deleteDonorMutation.mutate(selectedDonor.id)}>
                                <Trash2 className="h-5 w-5" />
                             </Button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Contributions</p>
                              <h3 className="text-2xl font-black text-slate-900 font-mono">
                                 {donations?.reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString() || "0"}
                                 <span className="text-xs text-slate-400 ml-1">UGX</span>
                              </h3>
                           </div>
                           <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Last Donation</p>
                              <h3 className="text-xl font-bold text-slate-900">
                                 {donations?.length ? format(new Date(donations[0].date), 'MMM dd, yyyy') : 'N/A'}
                              </h3>
                           </div>
                           <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Receipts Archived</p>
                              <h3 className="text-xl font-bold text-slate-900">
                                 {donations?.filter(d => d.receipt_image_url).length || 0} Files
                              </h3>
                           </div>
                        </div>
                     </div>

                     {/* Donation History Table */}
                     <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                           <h3 className="font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                              <History className="h-5 w-5 text-slate-400" /> Donation History
                           </h3>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Project Link</th>
                                    <th className="px-6 py-4">Notes</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Receipt</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {loadingDonations ? (
                                   <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-slate-200" /></td></tr>
                                 ) : donations?.length ? (
                                   donations.map(don => (
                                     <tr key={don.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{format(new Date(don.date), 'MMM dd, yyyy')}</td>
                                        <td className="px-6 py-4">
                                           <Badge variant="secondary" className="text-[10px] font-black uppercase">{don.projects?.name || 'General Fund'}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{don.notes || '-'}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">{don.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                           {don.receipt_image_url ? (
                                             <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => window.open(don.receipt_image_url)}>
                                                <Camera className="h-4 w-4" />
                                             </Button>
                                           ) : <span className="text-[10px] text-slate-300">NO SCAN</span>}
                                        </td>
                                     </tr>
                                   ))
                                 ) : (
                                   <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">No donations recorded for this donor.</td></tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-[40px] text-slate-400 text-center">
                     <Users className="h-16 w-16 mb-4 opacity-10" />
                     <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Select a Donor</h3>
                     <p className="max-w-xs mt-1">Choose a donor from the left list to view their full contribution history and manage their profile.</p>
                  </div>
                )}
             </div>
          </div>
        </TabsContent>
        <TabsContent value="currency" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { code: 'UGX', name: 'Uganda Shilling', rate: '1.00', icon: '🇺🇬', primary: true },
                { code: 'KWD', name: 'Kuwaiti Dinar', rate: '12,450', icon: '🇰🇼' },
                { code: 'USD', name: 'US Dollar', rate: '3,850', icon: '🇺🇸' },
              ].map(curr => (
                <Card key={curr.code} className="p-6 rounded-[32px] border-slate-100 shadow-sm overflow-hidden relative group">
                   {curr.primary && <Badge className="absolute -top-1 -right-1 rounded-bl-xl bg-slate-900">BASE</Badge>}
                   <div className="text-4xl mb-4">{curr.icon}</div>
                   <h4 className="font-black text-slate-900 uppercase tracking-tight">{curr.name}</h4>
                   <div className="flex items-end justify-between mt-6">
                      <div>
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Exchange Rate</p>
                         <p className="font-mono text-xl font-black text-slate-900">{curr.rate} <span className="text-xs text-slate-400">UGX</span></p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-slate-50 opacity-0 group-hover:opacity-100 transition-all">
                         <Edit2 className="h-4 w-4" />
                      </Button>
                   </div>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Trial Balance', desc: 'Debits & Credits parity check', color: 'bg-indigo-500', type: 'trial-balance' },
                { title: 'P&L Statement', desc: 'Project-wise profit and loss', color: 'bg-emerald-500', type: 'pl-statement' },
                { title: 'Balance Sheet', desc: 'Assets vs Liabilities snapshot', color: 'bg-slate-900', type: 'balance-sheet' },
                { title: 'Cash Flow', desc: 'Inflow and outflow tracking', color: 'bg-amber-500', type: 'cash-flow' },
              ].map(rep => (
                <Button
                  key={rep.title}
                  variant="outline"
                  disabled={isGeneratingReport}
                  onClick={() => generateReport(rep.type)}
                  className="h-auto p-6 rounded-[32px] border-slate-100 flex flex-col items-start text-left hover:border-slate-900 transition-all group"
                >
                   <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform", rep.color)}>
                      <BarChart3 className="h-5 w-5" />
                   </div>
                   <h4 className="font-black text-slate-900 uppercase tracking-tight">{rep.title}</h4>
                   <p className="text-xs text-slate-400 font-medium mt-1">{rep.desc}</p>
                   {isGeneratingReport && activeReport === rep.type ? (
                     <span className="mt-4 text-[11px] uppercase tracking-[0.2em] text-slate-500">Generating report…</span>
                   ) : null}
                </Button>
              ))}
           </div>
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog */}
      <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Plus className="h-6 w-6 text-emerald-500" /> 
                 {parentForNew ? `Add Child to ${parentForNew.name}` : "Create Root Account"}
              </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Account Code</Label>
                    <Input 
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      className="h-12 rounded-2xl border-slate-200 font-mono" 
                      placeholder="e.g. 1000" 
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Type</Label>
                    <Select 
                      disabled={!!parentForNew}
                      value={parentForNew ? parentForNew.type : newType} 
                      onValueChange={(v: any) => setNewType(v)}
                    >
                       <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Account Name</Label>
                 <Input 
                   value={newName}
                   onChange={e => setNewName(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="e.g. Cash at Bank" 
                 />
              </div>
           </div>

           <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsAddingAccount(false)} className="rounded-2xl">Cancel</Button>
              <Button 
                onClick={() => addAccountMutation.mutate()}
                disabled={!newCode || !newName || addAccountMutation.isPending}
                className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest"
              >
                 {addAccountMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Account"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Donor Dialog */}
      <Dialog open={isAddingDonor} onOpenChange={setIsAddingDonor}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Plus className="h-6 w-6 text-emerald-500" /> Add New Donor
              </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Donor Name</Label>
                 <Input 
                   value={donorName}
                   onChange={e => setDonorName(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="e.g. Alheb Foundation" 
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Type</Label>
                 <Select value={donorType} onValueChange={setDonorType}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="individual">Individual</SelectItem>
                       <SelectItem value="organization">Organization</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Contact Info</Label>
                 <Input 
                   value={donorContact}
                   onChange={e => setDonorContact(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="Email or Phone" 
                 />
              </div>
           </div>

           <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsAddingDonor(false)} className="rounded-2xl">Cancel</Button>
              <Button 
                onClick={() => addDonorMutation.mutate()}
                disabled={!donorName || addDonorMutation.isPending}
                className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest"
              >
                 {addDonorMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Donor"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Donation Dialog */}
      <Dialog open={isAddingDonation} onOpenChange={setIsAddingDonation}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Coins className="h-6 w-6 text-emerald-500" /> Log Contribution
              </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Target Project</Label>
                 <Select value={donationProject} onValueChange={setDonationProject}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                       <SelectValue placeholder="Choose project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                       {projects?.map(p => (
                         <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Amount (UGX)</Label>
                 <Input 
                   type="number"
                   value={donationAmount}
                   onChange={e => setDonationAmount(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="0.00" 
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Receipt Image URL</Label>
                 <Input 
                   value={donationReceipt}
                   onChange={e => setDonationReceipt(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="https://..." 
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Notes</Label>
                 <Input 
                   value={donationNotes}
                   onChange={e => setDonationNotes(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="e.g. Annual contribution" 
                 />
              </div>
           </div>

           <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsAddingDonation(false)} className="rounded-2xl">Cancel</Button>
              <Button 
                onClick={() => addDonationMutation.mutate()}
                disabled={!donationAmount || addDonationMutation.isPending}
                className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest"
              >
                 {addDonationMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Donation"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const TrendingDown = ({ className }: { className?: string }) => <ArrowUpCircle className={cn("rotate-180", className)} />;

export default Accounts;