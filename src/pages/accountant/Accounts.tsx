// @ts-nocheck

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Users, Globe, BarChart3, Plus, ChevronRight, ChevronDown, Edit2, Trash2, Loader2, Landmark, ArrowDownCircle, ArrowUpCircle, PieChart, Coins, User, Building2, Camera, History } from "lucide-react";
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

  // Form State - Account
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Account['type']>("asset");

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
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100 rounded-2xl">
          <TabsTrigger value="chart" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wallet className="h-4 w-4" /> Ledger Tree
          </TabsTrigger>
          <TabsTrigger value="donors" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" /> Donors
          </TabsTrigger>
          <TabsTrigger value="currency" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="h-4 w-4" /> Rates
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
                { title: 'Trial Balance', desc: 'Debits & Credits parity check', color: 'bg-indigo-500' },
                { title: 'P&L Statement', desc: 'Project-wise profit and loss', color: 'bg-emerald-500' },
                { title: 'Balance Sheet', desc: 'Assets vs Liabilities snapshot', color: 'bg-slate-900' },
                { title: 'Cash Flow', desc: 'Inflow and outflow tracking', color: 'bg-amber-500' },
              ].map(rep => (
                <Button key={rep.title} variant="outline" className="h-auto p-6 rounded-[32px] border-slate-100 flex flex-col items-start text-left hover:border-slate-900 transition-all group">
                   <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform", rep.color)}>
                      <BarChart3 className="h-5 w-5" />
                   </div>
                   <h4 className="font-black text-slate-900 uppercase tracking-tight">{rep.title}</h4>
                   <p className="text-xs text-slate-400 font-medium mt-1">{rep.desc}</p>
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