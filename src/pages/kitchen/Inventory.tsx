// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownRight, Box, History } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const KitchenInventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["kitchen-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []).filter((item: any) => {
        const catName = item.category?.toLowerCase() || "";
        const itemName = item.name?.toLowerCase() || "";
        return catName.includes("food") || catName.includes("kitchen") || itemName.includes("food");
      });
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ["kitchen-inventory-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*, item:inventory_items(name)")
        .order("transaction_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  const filtered = items.filter((i: any) =>
    i.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = items.filter((i: any) => {
    const qty = i.quantity || 0;
    return qty <= i.min_threshold;
  }).length;

  const handleRestock = async () => {
    if (!restockItem || restockQty <= 0) return;

    const { error: updateErr } = await supabase
      .from("inventory_items")
      .update({ quantity: (restockItem.quantity || 0) + restockQty })
      .eq("id", restockItem.id);
    if (updateErr) {
      toast({ title: "Error", description: updateErr.message, variant: "destructive" });
      return;
    }

    const { error: txErr } = await supabase
      .from("inventory_transactions")
      .insert({
        item_id: restockItem.id,
        type: "restock",
        quantity: restockQty,
        notes: "Kitchen restock",
        transaction_date: new Date().toISOString(),
      });
    if (txErr) {
      toast({ title: "Error", description: txErr.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `${restockItem.name} restocked with ${restockQty} units.` });
    setIsRestockOpen(false);
    setRestockItem(null);
    setRestockQty(1);
    queryClient.invalidateQueries({ queryKey: ["kitchen-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["kitchen-inventory-history"] });
  };

  return (
    <DashboardLayout title="Kitchen Inventory" subtitle="Manage food stock &amp; supplies">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-3 md:p-5 border-l-4 border-l-primary shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black tracking-widest">Total Items</p>
                <p className="text-xl md:text-2xl font-black mt-1">{items.length}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Box className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-3 md:p-5 border-l-4 border-l-red-500 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black tracking-widest">Low Stock</p>
                <p className="text-xl md:text-2xl font-black mt-1 text-red-600">{lowStockCount}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              </div>
            </div>
          </Card>
          <Card className="p-3 md:p-5 border-l-4 border-l-emerald-500 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black tracking-widest">Stock Movements</p>
                <p className="text-xl md:text-2xl font-black mt-1">{history.length}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <History className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search food items..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items" className="gap-2"><Box className="h-4 w-4" /> Items</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> History</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4 pt-4">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading inventory...</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No items match your search." : "No food items found in inventory."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((item: any) => {
                  const quantity = item.quantity || 0;
                  const isLow = quantity <= item.min_threshold;

                  return (
                    <div key={item.id} className="relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-lg">
                      <div className={`absolute top-0 left-0 w-1 h-full ${isLow ? "bg-red-500" : "bg-emerald-500"}`} />
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isLow ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase">{item.category || "General"} &middot; {item.unit}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Stock Level</p>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black ${isLow ? "text-red-600" : "text-foreground"}`}>{quantity}</span>
                              <span className="text-xs text-muted-foreground">{item.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Min</p>
                            <p className="text-sm font-semibold">{item.min_threshold || 0}</p>
                          </div>
                        </div>

                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isLow ? "bg-red-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (quantity / ((item.min_threshold || 1) * 3)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-dashed">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 h-8 text-[10px] font-bold"
                          onClick={() => {
                            setRestockItem(item);
                            setRestockQty(1);
                            setIsRestockOpen(true);
                          }}
                        >
                          <ArrowUpRight className="mr-1 h-3 w-3" /> Restock
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">No transactions recorded.</div>
                ) : (
                  <div className="divide-y">
                    {history.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            tx.type === "restock" ? "bg-emerald-100 text-emerald-600" :
                            tx.type === "issuance" ? "bg-amber-100 text-amber-600" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {tx.type === "restock" ? <ArrowUpRight className="h-4 w-4" /> :
                             tx.type === "issuance" ? <ArrowDownRight className="h-4 w-4" /> :
                             <Package className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{tx.item?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{tx.type} &middot; Qty: {tx.quantity}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {tx.transaction_date ? format(new Date(tx.transaction_date), "dd MMM HH:mm") : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Restock Dialog */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
            <DialogDescription>Add stock for {restockItem?.name || "item"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <p className="font-bold">{restockItem?.name} ({restockItem?.unit})</p>
            </div>
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <p>{restockItem?.quantity || 0} {restockItem?.unit}</p>
            </div>
            <div className="space-y-2">
              <Label>Quantity to Add</Label>
              <Input
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button onClick={handleRestock} className="w-full">Complete Restock</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default KitchenInventory;
