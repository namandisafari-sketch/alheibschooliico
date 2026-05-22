// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, ArrowRight, ShoppingCart, TrendingUp, RefreshCw, Archive } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

const LowStock = () => {
  const { data: lowStockItems = [], isLoading, refetch } = useQuery({
    queryKey: ["low-stock-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          category:inventory_categories(name),
          stock:inventory_stock(quantity)
        `);
      if (error) throw error;
      
      // Filter manually for items where stock quantity < min_stock_level
      // (PostgREST doesn't easily support cross-table comparison in eq)
      return (data || []).filter(item => {
        const qty = item.stock?.[0]?.quantity || 0;
        return qty <= item.min_stock_level;
      });
    },
  });

  return (
    <DashboardLayout title="Inventory Alerts" subtitle="Items Requiring Immediate Replenishment">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-red-100 bg-red-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase">Critical Depletion</p>
                <p className="text-2xl font-bold">{lowStockItems.filter(i => (i.stock?.[0]?.quantity || 0) === 0).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </CardContent>
          </Card>
          <Card className="border-orange-100 bg-orange-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Below Threshold</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>
          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Active Orders</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Alert List
            </h3>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-3 w-3" /> Refresh Status
            </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Analyzing stock levels...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <Archive className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">All items currently have healthy stock levels.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Qty</TableHead>
                    <TableHead>Min Threshold</TableHead>
                    <TableHead>Suggested Reorder</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => {
                    const qty = item.stock?.[0]?.quantity || 0;
                    const diff = item.min_stock_level - qty;
                    const suggested = diff > 0 ? diff * 2 : item.min_stock_level;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{item.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{item.category?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${qty === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {qty} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{item.min_stock_level} {item.unit}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-600 text-[10px]">+{suggested} {item.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm" className="h-8 gap-2">
                            <Link to="/store/receiving">
                              Procure <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LowStock;
