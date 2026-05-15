
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BudgetReportsTab = () => {
  const { data: totalSpent } = useQuery({
    queryKey: ["total-spent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("total_amount")
        .eq("status", "archived");
      if (error) throw error;
      return data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    }
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" /> Spending by Department
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed mt-2">
          {/* Mock Visualization */}
          <div className="relative h-48 w-48 rounded-full border-[20px] border-primary border-r-success border-b-amber-400 border-l-blue-500 flex items-center justify-center">
             <div className="text-center">
               <p className="text-2xl font-black">UGX {(totalSpent || 0).toLocaleString()}</p>
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Spent</p>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Monthly Budget Variance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 text-success border border-success/20">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6" />
              <div>
                <p className="text-xs font-bold uppercase">Academic Savings</p>
                <p className="text-lg font-black">UGX 1,200,000</p>
              </div>
            </div>
            <Badge className="bg-success text-white">Under Budget</Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6" />
              <div>
                <p className="text-xs font-bold uppercase">Hostel Overspend</p>
                <p className="text-lg font-black">UGX 450,000</p>
              </div>
            </div>
            <Badge variant="destructive">Over Budget</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
