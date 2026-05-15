// @ts-nocheck

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Receipt, History, PlusCircle, Wallet, FileText, CheckCircle2, XCircle, ArrowRight, Camera, Trash2, Loader2, Download, Printer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LiquidityPrintDialog } from "@/components/finance/LiquidityPrintDialog";

const PettyCash = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("runs");
  const [isOpeningRun, setIsOpeningRun] = useState(false);
  const [isRequestingLiquidity, setIsRequestingLiquidity] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedRun, setSelectedRun] = useState<any>(null);

  // Form State for Liquidity Request (doc_1.docx)
  const [liqCustody, setLiqCustody] = useState("0");
  const [liqAwards, setLiqAwards] = useState("0");
  const [liqOther, setLiqOther] = useState("0");
  const [liqReceivables, setLiqReceivables] = useState("0");
  const [liqPayables, setLiqPayables] = useState("0");
  const [liqBills, setLiqBills] = useState("0");
  const [liqAmount, setLiqAmount] = useState("");
  const [liqPurpose, setLiqPurpose] = useState("");

  // Form State for New Run
  const [newRunProject, setNewRunProject] = useState("");
  const [newRunFloat, setNewRunFloat] = useState("");

  // Form State for New Invoice
  const [invoiceCategory, setInvoiceCategory] = useState("");
  const [invoiceDesc, setInvoiceDesc] = useState("");
  const [invoiceNum, setInvoiceNum] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceImage, setInvoiceImage] = useState("");

  // Queries
  const { data: runs, isLoading: loadingRuns } = useQuery({
    queryKey: ["petty-cash-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("petty_cash_runs")
        .select(`*, projects(name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    }
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ["petty-cash-invoices", selectedRun?.id],
    queryFn: async () => {
      if (!selectedRun) return [];
      const { data, error } = await supabase
        .from("petty_cash_invoices")
        .select("*")
        .eq("run_id", selectedRun.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRun
  });

  const { data: liqRequests } = useQuery({
    queryKey: ["liquidity_requests"],
    queryFn: async () => {
      const { data } = await supabase.from("liquidity_requests").select("*").order("created_at", { ascending: false });
      return data || [];
    }
  });

  // Mutations
  const openRunMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("petty_cash_runs").insert({
        project_id: newRunProject,
        total_float: parseFloat(newRunFloat),
        status: "open"
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petty-cash-runs"] });
      toast.success("Petty Cash run opened successfully");
      setIsOpeningRun(false);
      setNewRunProject("");
      setNewRunFloat("");
    }
  });

  const addInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("petty_cash_invoices").insert({
        run_id: selectedRun.id,
        product_category: invoiceCategory,
        item_description: invoiceDesc,
        invoice_number: invoiceNum,
        amount: parseFloat(invoiceAmount),
        invoice_image_url: invoiceImage
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petty-cash-invoices", selectedRun.id] });
      toast.success("Invoice added successfully");
      setInvoiceCategory("");
      setInvoiceDesc("");
      setInvoiceNum("");
      setInvoiceAmount("");
      setInvoiceImage("");
    }
  });

  const closeRunMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("petty_cash_runs")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petty-cash-runs"] });
      toast.success("Run closed and locked successfully");
      setSelectedRun(null);
    }
  });

  const createLiqMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("liquidity_requests").insert({
        custody_balance: parseFloat(liqCustody),
        awards_balance: parseFloat(liqAwards),
        other_balance: parseFloat(liqOther),
        receivables_balance: parseFloat(liqReceivables),
        payables_due: parseFloat(liqPayables),
        bills_value: parseFloat(liqBills),
        requested_amount: parseFloat(liqAmount),
        purpose: liqPurpose,
        requested_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidity_requests"] });
      toast.success("Liquidity Request Submitted");
      setIsRequestingLiquidity(false);
    }
  });

  const showPrintForm = (req: any) => {
    setSelectedRequest(req);
    setIsPrintDialogOpen(true);
  };

  const totalSpent = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
  const remainingBalance = selectedRun ? selectedRun.total_float - totalSpent : 0;

  return (
    <>
    <DashboardLayout title={t("pettyCash")} subtitle="Manage box liquidity and project-specific petty cash cycles">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-slate-100 rounded-2xl mb-8">
           <TabsTrigger value="runs" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Wallet className="h-4 w-4" /> Active & History Runs
           </TabsTrigger>
           <TabsTrigger value="liquidity" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Receipt className="h-4 w-4" /> Liquidity Requests (Box)
           </TabsTrigger>
        </TabsList>

        <TabsContent value="runs">
      {!selectedRun ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
               <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Petty Cash Register</h2>
               <p className="text-sm text-slate-500">Track and archive operational project spending.</p>
            </div>
            <Button onClick={() => setIsOpeningRun(true)} className="gap-2 bg-slate-900 rounded-2xl h-12 px-6">
               <PlusCircle className="h-5 w-5" /> Open New Run
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingRuns ? (
              <div className="col-span-full py-20 flex justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : runs?.length ? (
              runs.map(run => (
                <div 
                  key={run.id} 
                  onClick={() => setSelectedRun(run)}
                  className="group p-5 bg-white border border-slate-100 rounded-3xl hover:border-slate-900 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45",
                    run.status === 'open' ? 'bg-emerald-500' : 'bg-slate-200'
                  )} />
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                       <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Project Run</p>
                       <h3 className="font-bold text-slate-900 truncate max-w-[150px]">{run.projects?.name}</h3>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Float</p>
                        <p className="font-mono text-lg font-black text-slate-900">{run.total_float.toLocaleString()} <span className="text-[10px] text-slate-400">UGX</span></p>
                     </div>
                     <Badge variant={run.status === 'open' ? 'default' : 'secondary'} className="uppercase text-[8px] font-black tracking-widest">
                        {run.status}
                     </Badge>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                     <p className="text-[9px] text-slate-400 font-bold uppercase">{format(new Date(run.created_at), 'MMM dd, yyyy')}</p>
                     <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center text-slate-400">
                <Receipt className="h-16 w-16 mb-4 opacity-10" />
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">No Runs Found</h3>
                <p className="text-sm mt-1">Start your first petty cash run to begin tracking spending.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: Management */}
              <div className="flex-1 space-y-6">
                 <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                       <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)} className="text-slate-400">
                          <History className="mr-2 h-4 w-4" /> Back to List
                       </Button>
                       {selectedRun.status === 'open' && (
                         <Button 
                           variant="outline" 
                           onClick={() => closeRunMutation.mutate(selectedRun.id)}
                           className="text-red-600 border-red-100 hover:bg-red-50"
                         >
                            <XCircle className="mr-2 h-4 w-4" /> Close Run
                         </Button>
                       )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-2">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">{selectedRun.projects?.name}</h2>
                          <div className="flex items-center gap-4 text-sm text-slate-500 font-bold uppercase tracking-wider">
                             <p>Opened: {format(new Date(selectedRun.created_at), 'MMM dd, yyyy HH:mm')}</p>
                             <div className="h-1 w-1 rounded-full bg-slate-300" />
                             <p>Status: {selectedRun.status}</p>
                          </div>
                       </div>
                       <div className={cn(
                         "p-6 rounded-3xl flex flex-col items-center justify-center text-center",
                         remainingBalance < 0 ? 'bg-red-50' : 'bg-slate-900'
                       )}>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Remaining Balance</p>
                          <h3 className={cn(
                            "text-2xl font-mono font-black tracking-tighter",
                            remainingBalance < 0 ? 'text-red-600' : 'text-white'
                          )}>
                             {remainingBalance.toLocaleString()} <span className="text-xs opacity-50">UGX</span>
                          </h3>
                       </div>
                    </div>
                 </div>

                 {/* Invoices List */}
                 <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                       <h3 className="font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <FileText className="h-5 w-5" /> Transaction History
                       </h3>
                       <Badge variant="outline" className="font-bold">{invoices?.length || 0} ITEMS</Badge>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <tr>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Receipt</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {loadingInvoices ? (
                               <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" /></td></tr>
                             ) : invoices?.length ? (
                               invoices.map(inv => (
                                 <tr key={inv.id} className="text-sm font-medium hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                       <Badge variant="secondary" className="text-[10px] font-black">{inv.product_category}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-900">{inv.item_description}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{inv.invoice_number}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900">{inv.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                       {inv.invoice_image_url ? (
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => window.open(inv.invoice_image_url)}>
                                            <Camera className="h-4 w-4" />
                                         </Button>
                                       ) : (
                                         <span className="text-[10px] text-slate-300">NO IMAGE</span>
                                       )}
                                    </td>
                                 </tr>
                               ))
                             ) : (
                               <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">No transactions recorded yet.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>

              {/* Right Column: Entry Form */}
              {selectedRun.status === 'open' && (
                <div className="w-full md:w-80 space-y-4">
                   <div className="bg-slate-900 p-6 rounded-[40px] text-white shadow-xl">
                      <div className="flex items-center gap-2 mb-6">
                         <PlusCircle className="h-5 w-5 text-emerald-400" />
                         <h3 className="font-black uppercase tracking-tight">Add Project Item</h3>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                            <Select value={invoiceCategory} onValueChange={setInvoiceCategory}>
                               <SelectTrigger className="bg-white/10 border-white/10 text-white h-11 rounded-2xl">
                                  <SelectValue placeholder="Select Category" />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="Transport">Transport</SelectItem>
                                  <SelectItem value="Food & Meals">Food & Meals</SelectItem>
                                  <SelectItem value="Stationery">Stationery</SelectItem>
                                  <SelectItem value="Repairs">Repairs</SelectItem>
                                  <SelectItem value="Emergency">Emergency</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Item Description</Label>
                            <Input 
                               value={invoiceDesc} 
                               onChange={e => setInvoiceDesc(e.target.value)}
                               className="bg-white/10 border-white/10 text-white h-11 rounded-2xl" 
                               placeholder="e.g. Fuel for generator"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <Label className="text-[10px] font-black uppercase text-slate-400">Invoice #</Label>
                               <Input 
                                  value={invoiceNum} 
                                  onChange={e => setInvoiceNum(e.target.value)}
                                  className="bg-white/10 border-white/10 text-white h-11 rounded-2xl" 
                                  placeholder="INV-..."
                               />
                            </div>
                            <div className="space-y-1.5">
                               <Label className="text-[10px] font-black uppercase text-slate-400">Amount</Label>
                               <Input 
                                  type="number"
                                  value={invoiceAmount} 
                                  onChange={e => setInvoiceAmount(e.target.value)}
                                  className="bg-white/10 border-white/10 text-white h-11 rounded-2xl" 
                                  placeholder="0.00"
                               />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Receipt Image URL</Label>
                            <Input 
                               value={invoiceImage} 
                               onChange={e => setInvoiceImage(e.target.value)}
                               className="bg-white/10 border-white/10 text-white h-11 rounded-2xl" 
                               placeholder="https://..."
                            />
                         </div>
                         <Button 
                           onClick={() => addInvoiceMutation.mutate()}
                           disabled={!invoiceAmount || !invoiceDesc || addInvoiceMutation.isPending}
                           className="w-full bg-white text-slate-900 h-12 rounded-2xl font-black uppercase tracking-widest mt-4 hover:bg-emerald-400 transition-colors"
                         >
                            {addInvoiceMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Item"}
                         </Button>
                      </div>
                   </div>
                   
                   <div className="p-6 rounded-[40px] bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                         <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <p className="text-[11px] font-bold text-emerald-800 leading-tight">Attach all scanned invoices to ensure successful run audit.</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-6">
           <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Internal Liquidity</h2>
                 <p className="text-sm text-slate-500">Official cash box requests as per institutional standards.</p>
              </div>
              <Button onClick={() => setIsRequestingLiquidity(true)} className="gap-2 bg-slate-900 rounded-2xl h-12 px-6">
                 <PlusCircle className="h-5 w-5" /> New Liquidity Request
              </Button>
           </div>

           <div className="grid gap-4">
              {liqRequests?.map((req: any) => (
                <Card key={req.id} className="p-6 rounded-[32px] border-slate-100 shadow-sm">
                   <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] tracking-widest px-2">{req.id.slice(0, 8).toUpperCase()}</Badge>
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-widest",
                              req.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                            )}>
                               {req.status}
                            </Badge>
                         </div>
                         <h3 className="text-lg font-bold text-slate-900">Request for {req.requested_amount?.toLocaleString()} UGX</h3>
                         <p className="text-xs text-slate-500 font-medium">{req.purpose || 'General Box Liquidity'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-[2]">
                         <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Custody</p>
                            <p className="text-xs font-mono font-bold text-slate-900">{req.custody_balance?.toLocaleString()}</p>
                         </div>
                         <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Receivables</p>
                            <p className="text-xs font-mono font-bold text-slate-900">{req.receivables_balance?.toLocaleString()}</p>
                         </div>
                         <div className="text-center p-3 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Payables</p>
                            <p className="text-xs font-mono font-bold text-red-700">{req.payables_due?.toLocaleString()}</p>
                         </div>
                         <div className="text-center p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Snapshot</p>
                            <p className="text-xs font-mono font-bold text-indigo-700">{req.total_liquidity?.toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="md:w-48 text-right flex flex-col items-end gap-2">
                         <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Date</p>
                            <p className="text-sm font-bold text-slate-900">{format(new Date(req.created_at), 'dd MMM yyyy')}</p>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => showPrintForm(req)} className="h-8 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100">
                            <Printer className="h-4 w-4 mr-2" /> Print Form
                         </Button>
                      </div>
                   </div>
                </Card>
              ))}
              {(!liqRequests || liqRequests.length === 0) && (
                <div className="py-20 text-center border-2 border-dashed rounded-[40px] border-slate-100 text-slate-400">
                   <Download className="h-16 w-16 mb-4 opacity-10 mx-auto" />
                   <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">No Liquidity Requests</h3>
                   <p className="text-sm">Requests for box replenishment will appear here.</p>
                </div>
              )}
           </div>
        </TabsContent>
      </Tabs>

      {/* Open Run Dialog */}
      <Dialog open={isOpeningRun} onOpenChange={setIsOpeningRun}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                 <PlusCircle className="h-6 w-6 text-emerald-500" /> Open Petty Cash Run
              </DialogTitle>
              <DialogDescription>Select a project and set the initial float for this period.</DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6 py-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Target Project</Label>
                 <Select value={newRunProject} onValueChange={setNewRunProject}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                       <SelectValue placeholder="Choose project..." />
                    </SelectTrigger>
                    <SelectContent>
                       {projects?.map(p => (
                         <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Float (UGX)</Label>
                 <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      type="number" 
                      value={newRunFloat}
                      onChange={e => setNewRunFloat(e.target.value)}
                      className="h-12 pl-12 rounded-2xl border-slate-200" 
                      placeholder="e.g. 500000" 
                    />
                 </div>
              </div>
           </div>

           <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsOpeningRun(false)} className="rounded-2xl">Cancel</Button>
              <Button 
                onClick={() => openRunMutation.mutate()}
                disabled={!newRunProject || !newRunFloat || openRunMutation.isPending}
                className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest"
              >
                 {openRunMutation.isPending ? <Loader2 className="animate-spin" /> : "Open Run"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* New Liquidity Request Dialog (doc_1.docx) */}
    <Dialog open={isRequestingLiquidity} onOpenChange={setIsRequestingLiquidity}>
      <DialogContent className="max-w-xl rounded-[32px] border-none shadow-2xl p-8">
         <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
               <Receipt className="h-6 w-6 text-indigo-500" /> Internal Liquidity Request
            </DialogTitle>
            <DialogDescription>Report current balances and request new custody box liquidity.</DialogDescription>
         </DialogHeader>
         
         <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Custody Bal.</Label>
                  <Input type="number" value={liqCustody} onChange={e => setLiqCustody(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Awards Bal.</Label>
                  <Input type="number" value={liqAwards} onChange={e => setLiqAwards(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Other Bal.</Label>
                  <Input type="number" value={liqOther} onChange={e => setLiqOther(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Receivables</Label>
                  <Input type="number" value={liqReceivables} onChange={e => setLiqReceivables(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Payables Due</Label>
                  <Input type="number" value={liqPayables} onChange={e => setLiqPayables(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Bill Bal.</Label>
                  <Input type="number" value={liqBills} onChange={e => setLiqBills(e.target.value)} className="h-10 rounded-xl font-mono text-sm" />
               </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Requested Amount (UGX)</Label>
                 <Input 
                   type="number" 
                   value={liqAmount}
                   onChange={e => setLiqAmount(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200 font-black text-indigo-600 font-mono" 
                   placeholder="0.00" 
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Purpose</Label>
                 <Input 
                   value={liqPurpose}
                   onChange={e => setLiqPurpose(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="e.g. Catering & Support Ops" 
                 />
              </div>
            </div>
         </div>

         <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsRequestingLiquidity(false)} className="rounded-2xl">Cancel</Button>
            <Button 
              onClick={() => createLiqMutation.mutate()}
              disabled={!liqAmount || createLiqMutation.isPending}
              className="bg-indigo-600 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
            >
               {createLiqMutation.isPending ? <Loader2 className="animate-spin" /> : "Submit To Director"}
            </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
    </DashboardLayout>

    {selectedRequest && (
      <LiquidityPrintDialog
        request={selectedRequest}
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
      />
    )}
    </>
  );
};

export default PettyCash;