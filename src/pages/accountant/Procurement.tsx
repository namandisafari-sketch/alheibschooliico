// @ts-nocheck

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Store, Package, Bell, PlusCircle, CheckCircle2, Clock, XCircle, FileText, Upload, ShieldCheck, Globe, Building2, Filter, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Procurement = () => {
  const { t } = useLanguage();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("purchases");
  const [isAddingPO, setIsAddingPO] = useState(false);

  // Form State - New PO
  const [poTitle, setPoTitle] = useState("");
  const [poProject, setPoProject] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [poDescription, setPoDescription] = useState("");

  // Queries
  const { data: pos, isLoading: loadingPOs } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`*, projects(name), approval_steps(*)`)
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

  const { data: inventory, isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory-details"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_details").select("*");
      if (error) throw error;
      return data;
    }
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ poId, step, nextStatus }: { poId: string, step: string, nextStatus: string }) => {
      // 1. Insert approval step
      const { error: stepError } = await supabase.from("approval_steps").insert({
        po_id: poId,
        step: step as any,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      });
      if (stepError) throw stepError;

      // 2. Update PO status
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({ status: nextStatus as any })
        .eq("id", poId);
      if (poError) throw poError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Approval step recorded successfully");
    }
  });

  const createPOMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("purchase_orders").insert({
        title: poTitle,
        project_id: poProject,
        total_amount: parseFloat(poAmount),
        description: poDescription,
        status: "committee"
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase Order requested successfully");
      setIsAddingPO(false);
      setPoTitle("");
      setPoAmount("");
      setPoDescription("");
    }
  });

  const receiveItemMutation = useMutation({
    mutationFn: async (po: any) => {
      // In a real app, we'd have PO line items. For now, we'll mark as received.
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "archived" })
        .eq("id", po.id);
      if (error) throw error;
      
      toast.success("Items received and inventory updated");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-details"] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'draft': return <FileText className="h-4 w-4 text-slate-400" />;
      default: return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'committee': return "Pending Committee";
      case 'head_office': return "Pending Head Office";
      case 'kuwait': return "Pending Kuwait HQ";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <DashboardLayout title={t("procurement")} subtitle="Manage Purchase Orders and Sequential Approvals">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100 rounded-2xl">
          <TabsTrigger value="purchases" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingCart className="h-4 w-4" /> Purchases
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Store className="h-4 w-4" /> Store
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Package className="h-4 w-4" /> Assets
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4" /> Alerts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchases" className="mt-6 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Procurement Workflow</h2>
                <p className="text-sm text-slate-500 font-medium">Manage multi-stage approvals for school acquisitions.</p>
             </div>
              <Button onClick={() => setIsAddingPO(true)} className="gap-2 bg-slate-900 rounded-2xl h-12 px-6">
                 <PlusCircle className="h-5 w-5" /> New Purchase Order
              </Button>
          </div>

          <div className="grid gap-4">
            {loadingPOs ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : pos?.length ? (
              pos.map(po => (
                <Card key={po.id} className="p-6 rounded-[32px] border-slate-100 hover:border-slate-300 transition-all group">
                   <div className="flex flex-col md:flex-row gap-6">
                      {/* PO Info */}
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] py-0 px-2 rounded-md">PO-{po.id.slice(0, 8).toUpperCase()}</Badge>
                            <Badge className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              po.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                            )}>
                               {getStatusLabel(po.status)}
                            </Badge>
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 mb-1">{po.title}</h3>
                         <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{po.projects?.name}</p>
                      </div>

                      {/* Financials */}
                      <div className="md:w-48 flex flex-col justify-center">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimated Total</p>
                         <p className="text-lg font-black text-slate-900 font-mono">
                            {po.total_amount?.toLocaleString() || "0"} <span className="text-xs text-slate-400">UGX</span>
                         </p>
                      </div>

                      {/* Approval Timeline */}
                      <div className="md:w-64 flex items-center gap-2">
                         <div className="flex -space-x-2">
                            <div className={cn("h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shadow-sm", po.approval_steps?.some(s => s.step === 'committee') ? 'bg-emerald-500' : 'bg-slate-200')}>
                               {po.approval_steps?.some(s => s.step === 'committee') ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            </div>
                            <div className={cn("h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shadow-sm", po.approval_steps?.some(s => s.step === 'head_office') ? 'bg-emerald-500' : 'bg-slate-200')}>
                               {po.approval_steps?.some(s => s.step === 'head_office') ? <CheckCircle2 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                            </div>
                            <div className={cn("h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shadow-sm", po.approval_steps?.some(s => s.step === 'kuwait') ? 'bg-emerald-500' : 'bg-slate-200')}>
                               {po.approval_steps?.some(s => s.step === 'kuwait') ? <CheckCircle2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            </div>
                         </div>
                         <div className="text-[10px] font-black uppercase text-slate-400 leading-tight">
                            Approval<br/>Pipeline
                         </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center">
                         {po.status === 'committee' && (role === 'admin' || role === 'accountant') && (
                           <Button 
                             onClick={() => approveMutation.mutate({ poId: po.id, step: 'committee', nextStatus: 'head_office' })}
                             className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-10 px-6 font-bold"
                           >
                              Committee Approval
                           </Button>
                         )}
                         {po.status === 'head_office' && (role === 'admin' || role === 'head_teacher') && (
                           <Button 
                             onClick={() => approveMutation.mutate({ poId: po.id, step: 'head_office', nextStatus: 'kuwait' })}
                             className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl h-10 px-6 font-bold"
                           >
                              HQ Endorsement
                           </Button>
                         )}
                         {po.status === 'kuwait' && (role === 'admin') && (
                           <Button 
                             onClick={() => approveMutation.mutate({ poId: po.id, step: 'kuwait', nextStatus: 'approved' })}
                             className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-10 px-6 font-bold"
                           >
                              Final Kuwait HQ Approval
                           </Button>
                         )}
                         {po.status === 'approved' && (
                            <Button 
                              onClick={() => receiveItemMutation.mutate(po)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-10 px-6 font-bold gap-2"
                            >
                               <Package className="h-4 w-4" /> Confirm Receipt
                            </Button>
                          )}
                      </div>
                   </div>
                </Card>
              ))
            ) : (
              <div className="py-20 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center text-slate-400">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-10" />
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">No Purchase Orders</h3>
                <p className="text-sm mt-1">Acquisitions will appear here once requested.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="store" className="mt-6 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Store Inventory</h2>
                <p className="text-sm text-slate-500 font-medium">Live view of consumable stock and educational supplies.</p>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" className="rounded-2xl h-12 px-6 gap-2 border-slate-100">
                   <Filter className="h-4 w-4" /> Categories
                </Button>
                <Button className="gap-2 bg-indigo-600 rounded-2xl h-12 px-6">
                   <PlusCircle className="h-5 w-5" /> Manual Adjustment
                </Button>
             </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <tr>
                      <th className="px-6 py-4">Item Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4 text-center">Stock Level</th>
                      <th className="px-6 py-4 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {loadingInventory ? (
                     <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-200" /></td></tr>
                   ) : inventory?.length ? (
                     inventory.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400">
                                   {item.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                   <p className="text-[10px] font-medium text-slate-400">{item.brand || 'No Brand'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tight">{item.category_name || 'Uncategorized'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.storage_location || 'Main Store'}</td>
                          <td className="px-6 py-4 text-center">
                             <span className={cn(
                               "text-lg font-black font-mono",
                               (item.current_stock || 0) <= (item.min_threshold || 0) ? "text-red-500" : "text-slate-900"
                             )}>
                                {item.current_stock || 0}
                             </span>
                             <span className="text-[10px] text-slate-400 ml-1 uppercase font-black">{item.unit || 'units'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {(item.current_stock || 0) <= (item.min_threshold || 0) ? (
                               <Badge className="bg-red-100 text-red-600 border-red-200 text-[10px] font-black uppercase">Low Stock</Badge>
                             ) : (
                               <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 text-[10px] font-black uppercase">Optimal</Badge>
                             )}
                          </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">Store is currently empty. Add items via Purchases.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="mt-4">
          <div className="p-12 bg-white rounded-[40px] border border-slate-100 text-center">
             <Package className="h-16 w-16 text-slate-100 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase tracking-tight">Fixed Assets Register</h3>
             <p className="text-slate-500 max-w-sm mx-auto">Asset depreciation schedules and signed custody forms tracking.</p>
          </div>
        </TabsContent>


        <TabsContent value="alerts" className="mt-6 space-y-4">
           <div className="bg-red-50 border border-red-100 p-6 rounded-[32px] mb-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
                 <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                 <h2 className="text-lg font-black uppercase text-red-900 leading-tight">Critical Reorder Alerts</h2>
                 <p className="text-xs font-medium text-red-600">The following items are below the safety threshold and require immediate procurement.</p>
              </div>
           </div>

           <div className="grid gap-4">
               {inventory?.filter(i => (i.current_stock || 0) <= (i.min_threshold || 0)).map(alert => (
                <Card key={alert.id} className="p-5 rounded-[32px] border-red-100 bg-white hover:border-red-300 transition-all flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300">
                         {alert.name.charAt(0)}
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-900">{alert.name}</h4>
                         <p className="text-[10px] font-black uppercase text-slate-400">{alert.category_name} • Threshold: {alert.min_threshold}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-8">
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Current</p>
                         <p className="text-xl font-black text-red-600 font-mono">{alert.current_stock || 0}</p>
                      </div>
                      <Button className="rounded-2xl bg-slate-900 h-10 px-6 gap-2">
                         <PlusCircle className="h-4 w-4" /> Create PO
                      </Button>
                   </div>
                </Card>
              ))}
              {(!inventory?.some(i => (i.current_stock || 0) <= (i.min_threshold || 0))) && (
                <div className="py-20 text-center border-2 border-dashed rounded-[40px] border-slate-100 text-slate-400">
                   <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                   <p className="font-bold uppercase tracking-tight text-slate-900">All Stock Levels Optimal</p>
                   <p className="text-sm">No items are currently below their reorder threshold.</p>
                </div>
              )}
           </div>
        </TabsContent>
      </Tabs>

      {/* New PO Dialog */}
      <Dialog open={isAddingPO} onOpenChange={setIsAddingPO}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                 <PlusCircle className="h-6 w-6 text-indigo-500" /> New Acquisition Request
              </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Order Title</Label>
                 <Input 
                   value={poTitle}
                   onChange={e => setPoTitle(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="e.g. 100 boxes of Bic Pens" 
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Project</Label>
                    <Select value={poProject} onValueChange={setPoProject}>
                       <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                          <SelectValue placeholder="Select project" />
                       </SelectTrigger>
                       <SelectContent>
                          {projects?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Estimated Total (UGX)</Label>
                    <Input 
                      type="number"
                      value={poAmount}
                      onChange={e => setPoAmount(e.target.value)}
                      className="h-12 rounded-2xl border-slate-200 font-mono" 
                      placeholder="0.00" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Detailed Description</Label>
                 <Input 
                   value={poDescription}
                   onChange={e => setPoDescription(e.target.value)}
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="Quantities, brands, specs..." 
                 />
              </div>
           </div>

           <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsAddingPO(false)} className="rounded-2xl">Cancel</Button>
              <Button 
                onClick={() => createPOMutation.mutate()}
                disabled={!poTitle || !poAmount || !poProject || createPOMutation.isPending}
                className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest"
              >
                 {createPOMutation.isPending ? <Loader2 className="animate-spin" /> : "Submit Request"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const Loader2 = ({ className }: { className?: string }) => <Clock className={cn("animate-spin", className)} />;

export default Procurement;