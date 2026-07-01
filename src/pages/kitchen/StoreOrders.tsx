// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Search, ExternalLink, Package } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const StoreOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ description: "", quantity: 1, unit: "kg", num_days: 1 });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["kitchen-store-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders")
        .select("*")
        .eq("category", "food")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const filtered = orders.filter((o) =>
    o.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newOrder.description.trim()) {
      toast({ title: "Error", description: "Description is required.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("store_orders").insert({
      category: "food",
      description: newOrder.description,
      quantity: newOrder.quantity,
      unit: newOrder.unit || "kg",
      num_days: newOrder.num_days || 1,
      requested_by: user?.id,
      status: "pending_director",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Order request created." });
      setIsCreateOpen(false);
      setNewOrder({ description: "", quantity: 1, unit: "kg", num_days: 1 });
      queryClient.invalidateQueries({ queryKey: ["kitchen-store-orders"] });
    }
  };

  const statusBadge = (status: string) => {
    const map = {
      pending_director: { label: "Pending Director", class: "bg-amber-100 text-amber-700 border-amber-200" },
      pending_accountant: { label: "Pending Accountant", class: "bg-blue-100 text-blue-700 border-blue-200" },
      pending_storekeeper: { label: "Pending Storekeeper", class: "bg-purple-100 text-purple-700 border-purple-200" },
      completed: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    };
    const s = map[status] || { label: status, class: "bg-slate-100 text-slate-700 border-slate-200" };
    return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${s.class}`}>{s.label}</Badge>;
  };

  return (
    <DashboardLayout title="Store Orders" subtitle="Food supply ordering &amp; requests">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-orange-100 bg-orange-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>
          <Card className="border-amber-100 bg-amber-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase">Pending</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status !== "completed").length}</p>
              </div>
              <Package className="h-8 w-8 text-amber-200" />
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase">Completed</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === "completed").length}</p>
              </div>
              <ExternalLink className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> New Order Request
          </Button>
        </div>

        {/* Orders List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading orders...</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No orders match your search." : "No food orders yet. Place your first order."}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{order.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.quantity} {order.unit} &middot; {order.num_days ? `${order.num_days} day(s)` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {statusBadge(order.status)}
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy") : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Food Order Request</DialogTitle>
            <DialogDescription>Request food supplies from the store.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Rice, Cooking Oil, Vegetables..."
                value={newOrder.description}
                onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={newOrder.unit}
                  onValueChange={(v) => setNewOrder({ ...newOrder, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Litre (L)</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="crates">Crates</SelectItem>
                    <SelectItem value="cartons">Cartons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number of Days (for planning)</Label>
              <Input
                type="number"
                min={1}
                value={newOrder.num_days}
                onChange={(e) => setNewOrder({ ...newOrder, num_days: parseInt(e.target.value) || 1 })}
              />
            </div>
            <Button onClick={handleCreate} className="w-full">Submit Order Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StoreOrders;
