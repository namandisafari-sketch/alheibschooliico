// @ts-nocheck

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  History,
  Box,
  Truck,
  Users,
  Check,
  X as CloseIcon,
  FileText,
  ShieldCheck,
  Edit,
  ShoppingCart,
} from "lucide-react";
import { useInventory, useAssets } from "@/hooks/useInventory";
import { InventoryItemDialog } from "@/components/inventory/InventoryItemDialog";
import { IssueItemDialog } from "@/components/inventory/IssueItemDialog";
import { RestockItemDialog } from "@/components/inventory/RestockItemDialog";
import { AssetDialog } from "@/components/inventory/AssetDialog";
import { BulkIssueDialog } from "@/components/inventory/BulkIssueDialog";
import { GatePassDialog } from "@/components/inventory/GatePassDialog";
import { InventoryWhatsAppPanel } from "@/components/inventory/InventoryWhatsAppPanel";
import { AssetInventoryForm } from "@/components/inventory/AssetInventoryForm";
import { sendIssuanceApprovalNotification, sendGatePassAlert } from "@/services/inventoryWhatsAppService";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { LayoutGrid, List as ListIcon, Phone } from "lucide-react";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showAssetForm, setShowAssetForm] = useState(false);
  
  const { items, categories } = useInventory();
  const { data: assets } = useAssets();
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time updates
  useRealtime("inventory_items", [["inventory-items"]]);
  useRealtime("inventory_stock", [["inventory-items"]]);
  useRealtime("inventory_transactions", [["inventory-history"]]);
  useRealtime("assets", [["assets"]]);
  useRealtime("purchase_orders", [["active-purchase-orders"]]);

  const isAdmin = role === "admin";

  const stockColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-tight">{row.original.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{row.original.category || "General"}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }) => {
        const qty = row.original.quantity || 0;
        const low = qty <= row.original.min_threshold;
        return (
          <div className="flex items-baseline gap-1">
            <span className={cn("font-black text-sm", low ? "text-destructive" : "text-slate-900")}>{qty}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">{row.original.unit}</span>
          </div>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Manage</div>,
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold" onClick={() => handleIssue(row.original)}>
            Issue
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold" onClick={() => handleRestock(row.original)}>
            Restock
          </Button>
          <InventoryItemDialog item={row.original} mode="edit">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
          </InventoryItemDialog>
        </div>
      )
    }
  ];

  const historyColumns: ColumnDef<any>[] = [
    {
      accessorKey: "transaction_date",
      header: "Date",
      cell: ({ row }) => <span className="text-[10px] font-bold text-slate-500">{format(new Date(row.original.transaction_date), "dd MMM, HH:mm")}</span>
    },
    {
      accessorKey: "item.name",
      header: "Item",
      cell: ({ row }) => <span className="font-bold text-xs">{row.original.item?.name}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(
          "text-[8px] font-black uppercase h-5",
          row.original.type === "issuance" ? "border-amber-200 text-amber-600" : "border-emerald-200 text-emerald-600"
        )}>
          {row.original.type}
        </Badge>
      )
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => <span className="font-black text-xs">{row.original.type === "issuance" ? "-" : "+"}{row.original.quantity}</span>
    },
    {
      id: "actions",
      cell: ({ row }) => row.original.status === 'approved' && row.original.type === 'issuance' ? (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => showGatePass(row.original)}>
          <FileText className="h-4 w-4" />
        </Button>
      ) : null
    }
  ];

  // Fetch transaction history
  const { data: history } = useQuery({
    queryKey: ["inventory-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*, item:inventory_items(name, unit), learner:learners(full_name), staff:profiles(full_name)")
        .order("transaction_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch active purchase orders
  const { data: pendingPurchases } = useQuery({
    queryKey: ["active-purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, projects(name)")
        .neq("status", "archived")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pendingRequests = history?.filter(h => ['pending', 'manager_approved'].includes(h.status));

  const filteredItems = items.data?.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = items.data?.filter((item: any) => 
    (item.quantity || 0) <= item.min_threshold
  ).length;

  const handleIssue = (item: any) => {
    setSelectedItem(item);
    setIsIssueOpen(true);
  };

  const handleRestock = (item: any) => {
    setSelectedItem(item);
    setIsRestockOpen(true);
  };

  const handleApprove = async (id: string, currentStatus: string) => {
    let nextStatus = 'manager_approved';
    const updateData: any = { 
      status: nextStatus,
      manager_id: user?.id,
      manager_approval_date: new Date().toISOString()
    };

    if (currentStatus === 'manager_approved') {
      nextStatus = 'director_approved';
      updateData.status = nextStatus;
      updateData.director_id = user?.id;
      updateData.director_approval_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from("inventory_transactions")
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Approved", description: `Request moved to ${nextStatus.replace('_', ' ')}.` });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      
      // Send WhatsApp notification on approval
      const trans = history?.find(h => h.id === id);
      if (trans) {
        sendIssuanceApprovalNotification(
          trans.item?.name || "Item",
          trans.quantity,
          trans.learner?.full_name || trans.staff?.full_name || "General",
          trans.tracking_number || id.slice(0, 8)
        );
      }
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("inventory_transactions")
      .update({ status: 'rejected' })
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rejected", description: "Issuance request rejected." });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
    }
  };

  const showGatePass = (trans: any) => {
    setSelectedTransaction(trans);
    setIsGatePassOpen(true);
  };

  return (
    <DashboardLayout title="Inventory & Assets" subtitle="Track school supplies, equipment and fixed assets">
      {/* Summary Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <Card className="p-3 md:p-5 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase font-black tracking-widest truncate">Total Items</p>
              <p className="text-xl md:text-2xl font-black mt-1 truncate">{items.data?.length || 0}</p>
            </div>
            <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Box className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-3 md:p-5 border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase font-black tracking-widest truncate">Low Stock</p>
              <p className="text-xl md:text-2xl font-black mt-1 text-destructive truncate">{lowStockCount || 0}</p>
            </div>
            <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-5 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase font-black tracking-widest truncate">Total Assets</p>
              <p className="text-xl md:text-2xl font-black mt-1 text-blue-600 truncate">{assets?.reduce((s, a) => s + (a.quantity || 1), 0) || 0}</p>
            </div>
            <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-5 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase font-black tracking-widest truncate">Categories</p>
              <p className="text-xl md:text-2xl font-black mt-1 text-emerald-600 truncate">{categories.data?.length || 0}</p>
            </div>
            <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3">
          <Tabs defaultValue="stock" className="w-full">
            <TabsList className="flex w-full overflow-x-auto no-scrollbar justify-start md:grid md:grid-cols-5 p-1 bg-slate-100/50 rounded-xl h-auto">
              <TabsTrigger value="stock" className="flex-shrink-0 md:flex-shrink gap-2 px-4 py-2 text-[10px] md:text-xs">
                <Box className="h-4 w-4" /> Stock
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="pending" className="flex-shrink-0 md:flex-shrink gap-2 px-4 py-2 text-[10px] md:text-xs relative">
                  <ShieldCheck className="h-4 w-4" /> Pending
                  {pendingRequests && pendingRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[8px] md:text-[10px] absolute -top-1 -right-1">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="assets" className="flex-shrink-0 md:flex-shrink gap-2 px-4 py-2 text-[10px] md:text-xs">
                <Truck className="h-4 w-4" /> Assets
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex-shrink-0 md:flex-shrink gap-2 px-4 py-2 text-[10px] md:text-xs text-indigo-600">
                <ShoppingCart className="h-4 w-4" /> Purchases
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-shrink-0 md:flex-shrink gap-2 px-4 py-2 text-[10px] md:text-xs">
                <History className="h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button 
                  variant={viewMode === "grid" ? "secondary" : "ghost"} 
                  size="sm" 
                  className={cn("h-8 px-2", viewMode === "grid" && "bg-white shadow-sm")}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "table" ? "secondary" : "ghost"} 
                  size="sm" 
                  className={cn("h-8 px-2", viewMode === "table" && "bg-white shadow-sm")}
                  onClick={() => setViewMode("table")}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none border-primary/20 hover:bg-primary/5"
                onClick={() => window.location.href = '/inventory/tracking'}
              >
                <History className="mr-2 h-4 w-4" /> Audit Trail
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700"
                onClick={() => setShowAssetForm(true)}
              >
                <FileText className="mr-2 h-4 w-4" /> Print Form
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none border-blue-200 bg-blue-50/30 hover:bg-blue-50 text-blue-700"
                onClick={() => window.location.href = '/visitors'}
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Gate Monitor
              </Button>
              <BulkIssueDialog>
                <Button variant="outline" className="flex-1 sm:flex-none border-primary/20 hover:bg-primary/5">
                  <Users className="mr-2 h-4 w-4" /> Bulk Issue
                </Button>
              </BulkIssueDialog>
              <InventoryItemDialog>
                <Button id="new-item-btn" className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" /> New Item
                </Button>
              </InventoryItemDialog>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div id="inventory-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems?.map((item: any) => {
                const quantity = item.quantity || 0;
                const isLow = quantity <= item.min_threshold;
                
                return (
                    <div 
                      key={item.id} 
                      className="group relative flex flex-col rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Background Accent */}
                      <div className={cn("absolute top-0 left-0 w-1 h-full", isLow ? "bg-destructive" : "bg-primary")} />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                            isLow ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                          )}>
                            <Box className="h-7 w-7" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-base truncate leading-none mb-1">{item.name}</h4>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                              {item.category || "General"} • {item.unit}
                            </p>
                          </div>
                        </div>
                        <InventoryItemDialog item={item} mode="edit">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </InventoryItemDialog>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-end justify-between px-1">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Stock Level</p>
                            <div className="flex items-baseline gap-1">
                              <span className={cn("text-3xl font-black tracking-tight", isLow ? "text-destructive" : "text-foreground")}>
                                {quantity}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium uppercase">{item.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Threshold</p>
                            <p className="text-sm font-semibold">{item.min_threshold || 0}</p>
                          </div>
                        </div>

                        {/* Status Progress Bar */}
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", isLow ? "bg-destructive" : "bg-primary")} 
                            style={{ width: `${Math.min(100, (quantity / ((item.min_threshold || 1) * 3)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6 pt-4 border-t border-dashed">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-9 text-xs font-bold bg-background hover:bg-primary hover:text-primary-foreground transition-all"
                          onClick={() => handleIssue(item)}
                        >
                          <ArrowDownRight className="mr-1.5 h-3.5 w-3.5" /> Issue
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-9 text-xs font-bold bg-background hover:bg-success hover:text-success-foreground transition-all"
                          onClick={() => handleRestock(item)}
                        >
                          <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> Restock
                        </Button>
                      </div>
                    </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border shadow-xl bg-slate-50/50 p-6">
              <DataTable columns={stockColumns} data={filteredItems || []} searchKey="name" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests?.map((req: any) => (
              <div key={req.id} className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="outline" className="font-mono text-[10px] mb-1">{req.tracking_number}</Badge>
                    <h4 className="font-bold text-lg">{req.item?.name}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-700">{req.quantity}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{req.item?.unit}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>For: {req.learner?.full_name || req.staff?.full_name || "General"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(req.transaction_date), "dd MMM, HH:mm")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">
                     <span>Clearance Status</span>
                     <Badge variant="secondary" className="h-4 px-1.5 text-[8px]">
                        {req.status === 'pending' ? 'Step 1: Manager' : 'Step 2: Director'}
                     </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-white font-bold" onClick={() => handleApprove(req.id, req.status)}>
                      <Check className="h-4 w-4 mr-1" /> {req.status === 'pending' ? 'Verify Request' : 'Director Approval'}
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-destructive hover:bg-destructive/5 font-bold" onClick={() => handleReject(req.id)}>
                      <CloseIcon className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!pendingRequests || pendingRequests.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                No pending approval requests.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-end">
            <AssetDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Record Asset
              </Button>
            </AssetDialog>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets?.map((asset: any) => (
              <div key={asset.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold truncate">{asset.name}</h4>
                      <Badge variant="secondary" className="shrink-0 h-5 px-1.5 text-[10px] font-bold">
                        x{asset.quantity || 1}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{asset.serial_number || asset.asset_tag_id || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <AssetDialog asset={asset} mode="edit">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </AssetDialog>
                    <Badge variant="outline" className="capitalize text-[10px]">{asset.condition}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium truncate ml-1">{asset.assigned_staff?.full_name || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium truncate ml-1">{asset.location || "General"}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!assets || assets.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                No assets recorded yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPurchases?.map((po: any) => (
                <div key={po.id} className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-4 shadow-sm border-l-4 border-l-indigo-500">
                   <div className="flex justify-between items-start mb-3">
                      <div>
                         <Badge variant="outline" className="text-[10px] uppercase font-mono">PO-{po.id.slice(0, 8)}</Badge>
                         <h4 className="font-bold text-lg mt-1">{po.title}</h4>
                      </div>
                      <Badge className={cn(
                        "uppercase text-[10px] font-black",
                        po.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      )}>
                         {po.status}
                      </Badge>
                   </div>
                   <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{po.projects?.name}</span>
                      <span className="font-mono text-slate-900">{po.total_amount?.toLocaleString()} UGX</span>
                   </div>
                   <div className="mt-4 pt-4 border-t border-dashed border-indigo-100 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400">Pipeline Status</span>
                      <div className="flex -space-x-1">
                         <div className={cn("h-4 w-4 rounded-full border border-white", po.status === 'committee' || po.status === 'head_office' || po.status === 'kuwait' || po.status === 'approved' ? 'bg-indigo-500' : 'bg-slate-200')} />
                         <div className={cn("h-4 w-4 rounded-full border border-white", po.status === 'head_office' || po.status === 'kuwait' || po.status === 'approved' ? 'bg-indigo-500' : 'bg-slate-200')} />
                         <div className={cn("h-4 w-4 rounded-full border border-white", po.status === 'kuwait' || po.status === 'approved' ? 'bg-indigo-500' : 'bg-slate-200')} />
                      </div>
                   </div>
                </div>
              ))}
              {(!pendingPurchases || pendingPurchases.length === 0) && (
                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                  No active purchase orders found. Items requested in Procurement will appear here.
                </div>
              )}
           </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-xl border shadow-xl bg-slate-50/50 p-6">
            <DataTable columns={historyColumns} data={history || []} searchKey="item.name" />
          </div>
        </TabsContent>
      </Tabs>
      </div> {/* end tabs wrapper col-span-3 */}

      {/* WhatsApp Panel */}
      <div className="md:col-span-1">
        <InventoryWhatsAppPanel 
          lowStockItems={
            items.data?.filter((item: any) => 
              (item.quantity || 0) <= item.min_threshold
            ).map((item: any) => ({
              name: item.name,
              qty: item.quantity || 0,
              minStock: item.min_threshold,
              unit: item.unit,
            })) || []
          }
        />
      </div>
      </div> {/* end grid */}

      {selectedItem && (
        <>
          <IssueItemDialog 
            item={selectedItem} 
            open={isIssueOpen} 
            onOpenChange={setIsIssueOpen} 
          />
          <RestockItemDialog 
            item={selectedItem} 
            open={isRestockOpen} 
            onOpenChange={setIsRestockOpen} 
          />
        </>
      )}

      {selectedTransaction && (
        <GatePassDialog
          transaction={selectedTransaction}
          open={isGatePassOpen}
          onOpenChange={setIsGatePassOpen}
        />
      )}

      {/* Asset Inventory Form Dialog */}
      <Dialog open={showAssetForm} onOpenChange={setShowAssetForm}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Inventory Form</DialogTitle>
            <DialogDescription>
              Printable form matching the official Alheib Center inventory sheet.
            </DialogDescription>
          </DialogHeader>
          <AssetInventoryForm
            items={items.data || []}
            assets={assets || []}
            department="General Store"
            custodianName={user?.user_metadata?.full_name || ""}
            jobTitle={role || ""}
            inventoryDate=""
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Inventory;
