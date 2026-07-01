// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ShoppingCart, Package, AlertTriangle, ClipboardList, Plus, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AssetUnderMyCustody } from "@/components/dashboard/AssetUnderMyCustody";

const KitchenHome = () => {
  const { data: stats = { pendingOrders: 0, foodItems: 0, lowStock: 0, recentTransactions: 0 } } = useQuery({
    queryKey: ["kitchen-stats"],
    queryFn: async () => {
      const [ordersRes, itemsRes, stockRes, txRes] = await Promise.all([
        supabase.from("store_orders").select("*", { count: 'exact', head: true }).eq("category", "food").in("status", ["pending_director", "pending_accountant", "pending_storekeeper"]),
        supabase.from("inventory_items").select("id, category", { count: 'exact', head: true }).ilike("category", "%food%"),
        supabase.from("inventory_items").select("*"),
        supabase.from("inventory_transactions").select("*", { count: 'exact', head: true }).order("transaction_date", { ascending: false }).limit(20),
      ]);

      let foodItems = itemsRes.count || 0;
      if (itemsRes.count === null || itemsRes.error) {
        const { data: items } = await supabase
          .from("inventory_items")
          .select("id, category");
        foodItems = (items || []).filter(i => i.category?.toLowerCase().includes("food")).length;
      }

      const allItems = stockRes.data || [];
      const lowStock = allItems.filter((i: any) => {
        const qty = i.quantity || 0;
        return qty <= i.min_threshold;
      }).length;

      return {
        pendingOrders: ordersRes.count || 0,
        foodItems,
        lowStock,
        recentTransactions: txRes.count || 0,
      };
    }
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["kitchen-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_orders")
        .select("*")
        .eq("category", "food")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["kitchen-low-stock"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");
      return (data || []).filter((item: any) => {
        const qty = item.quantity || 0;
        return qty <= item.min_threshold;
      }).slice(0, 5);
    }
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ["kitchen-recent-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_transactions")
        .select("*, item:inventory_items(name)")
        .order("transaction_date", { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  return (
    <DashboardLayout title="Kitchen Operations" subtitle="Food inventory, meal planning & store orders">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/kitchen/store-orders">
            <Card className="bg-orange-50/50 border-orange-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Pending Orders</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/kitchen/inventory">
            <Card className="bg-emerald-50/50 border-emerald-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Food Items</p>
                  <p className="text-2xl font-bold">{stats.foodItems}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/kitchen/inventory">
            <Card className="bg-red-50/50 border-red-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Low Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/kitchen/meals">
            <Card className="bg-blue-50/50 border-blue-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Transactions</p>
                  <p className="text-2xl font-bold">{stats.recentTransactions}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Food Orders</CardTitle>
                  <CardDescription>Latest store orders placed</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/kitchen/store-orders">View All <ExternalLink className="h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm">No orders placed yet.</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-all">
                        <div className="flex gap-3 items-center">
                          <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{order.description}</p>
                            <p className="text-xs text-muted-foreground">{order.quantity} {order.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {order.created_at ? format(new Date(order.created_at), 'dd MMM') : '-'}
                          </p>
                          <Badge variant="outline" className="text-[8px] uppercase">
                            {order.status?.replace(/_/g, ' ') || 'draft'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                  <Link to="/kitchen/store-orders">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs font-bold">New Order</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                  <Link to="/kitchen/inventory">
                    <Package className="h-5 w-5" />
                    <span className="text-xs font-bold">Restock</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                  <Link to="/kitchen/inventory">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-xs font-bold">Low Stock</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                  <Link to="/kitchen/meals">
                    <ChefHat className="h-5 w-5" />
                    <span className="text-xs font-bold">Meals</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  <CardDescription>Latest inventory movements</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/kitchen/inventory">View All <ExternalLink className="h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm">No recent transactions.</p>
                  ) : (
                    recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-all">
                        <div className="flex gap-3 items-center">
                          <div className={`h-2 w-2 rounded-full ${tx.type === 'restock' ? 'bg-emerald-500' : tx.type === 'issuance' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div>
                            <p className="font-bold text-sm">{tx.item?.name || 'Unknown Item'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{tx.type} &middot; {tx.quantity} units</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {tx.transaction_date ? format(new Date(tx.transaction_date), 'dd MMM HH:mm') : '-'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts Sidebar */}
          <div className="space-y-6">
            <Card className="bg-red-50 border-red-100">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
                </CardTitle>
                <CardDescription className="text-red-500 text-xs">Items below minimum threshold</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lowStockItems.length === 0 ? (
                  <p className="text-center py-6 text-red-400 text-sm">All items sufficiently stocked.</p>
                ) : (
                  lowStockItems.map((item) => {
                    const qty = item.quantity || 0;
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-red-100">
                        <div className="bg-red-100 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{item.name}</p>
                          <p className="text-[10px] text-red-500">
                            {qty} {item.unit} &middot; Min: {item.min_threshold}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <Button asChild className="w-full bg-red-600 hover:bg-red-700 h-10 rounded-xl mt-2 text-xs">
                  <Link to="/kitchen/inventory">View Inventory</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChefHat className="h-4 w-4" /> Kitchen Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Items Categorized</span>
                  <span className="font-bold">{stats.foodItems}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pending Orders</span>
                  <span className="font-bold text-orange-600">{stats.pendingOrders}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Low Stock Alerts</span>
                  <span className="font-bold text-red-600">{stats.lowStock}</span>
                </div>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs gap-2">
                    <Link to="/kitchen/meals"><ChefHat className="h-3 w-3" /> Meal Planning</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AssetUnderMyCustody />
    </DashboardLayout>
  );
};

export default KitchenHome;
