
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function InventorySummaryWidget() {
  const { data: stats } = useQuery({
    queryKey: ["admin-inventory-stats"],
    queryFn: async () => {
      const { data: items } = await supabase.from("inventory_items").select(`
        *,
        stock:inventory_stock(quantity)
      `);
      
      if (!items) return null;

      const lowStock = items.filter(i => (i.stock?.[0]?.quantity || 0) <= i.min_stock_level).length;
      const totalItems = items.length;

      return { lowStock, totalItems };
    }
  });

  return (
    <Card className="border-2 border-slate-100 shadow-sm overflow-hidden group hover:border-orange-200 transition-all">
      <CardHeader className="bg-slate-50/50 p-3 md:p-4 pb-2">
        <CardTitle className="text-[11px] md:text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500" />
          School Stores
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-4 space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
           <div>
             <p className="text-xl md:text-2xl font-black text-slate-900">{stats?.totalItems || 0}</p>
             <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Tracked SKUs</p>
           </div>
           <div className="text-right">
             <Badge className={cn("text-[8px] md:text-[10px] px-1 md:px-2", stats?.lowStock ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-emerald-100 text-emerald-700")}>
               {stats?.lowStock || 0} Low Stock
             </Badge>
           </div>
        </div>

        <div className="space-y-1.5 md:space-y-2">
          <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-tighter">
             <span className="text-slate-400">Inventory Health</span>
             <span className="text-slate-900">{stats ? Math.round(((stats.totalItems - stats.lowStock) / stats.totalItems) * 100) : 0}%</span>
          </div>
          <Progress value={stats ? ((stats.totalItems - stats.lowStock) / stats.totalItems) * 100 : 0} className="h-1 md:h-1.5 bg-slate-100" />
        </div>

        <div className="pt-1 md:pt-2 grid grid-cols-2 gap-2">
           <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg flex items-center gap-1.5 md:gap-2">
              <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3 text-orange-500" />
              <span className="text-[8px] md:text-[9px] font-bold uppercase text-slate-600 truncate">Reorder</span>
           </div>
           <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg flex items-center gap-1.5 md:gap-2">
              <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-500" />
              <span className="text-[8px] md:text-[9px] font-bold uppercase text-slate-600 truncate">Secured</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
