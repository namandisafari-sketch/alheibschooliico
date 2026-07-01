// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Plus, Search, Utensils, Calendar, Users, Clock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Meals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [mealEntry, setMealEntry] = useState({
    meal_type: "breakfast",
    description: "",
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    unit: "servings",
    notes: "",
  });

  // Fetch inventory transactions that mention meals
  const { data: meals = [], isLoading } = useQuery({
    queryKey: ["kitchen-meals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*, item:inventory_items(name)")
        .or("notes.ilike.%meal%,notes.ilike.%breakfast%,notes.ilike.%lunch%,notes.ilike.%dinner%,notes.ilike.%feeding%")
        .order("transaction_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  // Also fetch store orders for food to show planned meals
  const { data: plannedOrders = [] } = useQuery({
    queryKey: ["kitchen-meals-planned"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders")
        .select("*")
        .eq("category", "food")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    }
  });

  const filtered = meals.filter((m: any) =>
    m.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLog = async () => {
    if (!mealEntry.description.trim()) {
      toast({ title: "Error", description: "Description is required.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("inventory_transactions").insert({
      type: "issuance",
      quantity: mealEntry.quantity || 1,
      notes: `[MEAL] ${mealEntry.meal_type}: ${mealEntry.description}${mealEntry.notes ? ` - ${mealEntry.notes}` : ""}`,
      transaction_date: new Date(mealEntry.date).toISOString(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Meal logged successfully." });
      setIsLogOpen(false);
      setMealEntry({
        meal_type: "breakfast",
        description: "",
        date: new Date().toISOString().split("T")[0],
        quantity: 1,
        unit: "servings",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["kitchen-meals"] });
    }
  };

  const mealTypeIcon = (notes: string) => {
    const n = notes?.toLowerCase() || "";
    if (n.includes("breakfast")) return "🌅";
    if (n.includes("lunch")) return "☀️";
    if (n.includes("dinner") || n.includes("supper")) return "🌙";
    return "🍽️";
  };

  return (
    <DashboardLayout title="Meal Management" subtitle="Track meals served &amp; food consumption">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-orange-100 bg-orange-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Meals Logged</p>
                <p className="text-2xl font-bold">{meals.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>
          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Active Orders</p>
                <p className="text-2xl font-bold">{plannedOrders.filter(o => o.status !== "completed").length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase">Planned Orders</p>
                <p className="text-2xl font-bold">{plannedOrders.length}</p>
              </div>
              <Utensils className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search meals..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsLogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </div>

        {/* Meal History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Meal History</CardTitle>
              <CardDescription>Record of meals served and food issued</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading meal records...</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <ChefHat className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No meals match your search." : "No meals logged yet. Start by logging a meal."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((meal: any) => (
                  <div key={meal.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 text-lg">
                        {mealTypeIcon(meal.notes)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {meal.item?.name || "General Meal"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {meal.notes?.replace("[MEAL]", "").trim() || "Meal served"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[8px] uppercase font-mono">
                            {meal.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            Qty: {meal.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {meal.transaction_date ? format(new Date(meal.transaction_date), "dd MMM yyyy") : "-"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {meal.transaction_date ? format(new Date(meal.transaction_date), "HH:mm") : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Planned Orders / Supplies */}
        {plannedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Food Supply Orders</CardTitle>
              <CardDescription>Planned and incoming food supplies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plannedOrders.slice(0, 6).map((order) => (
                  <div key={order.id} className="p-4 border rounded-xl bg-slate-50/50 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-[8px] uppercase font-mono">
                        {order.status?.replace(/_/g, " ") || "draft"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {order.created_at ? format(new Date(order.created_at), "dd MMM") : ""}
                      </span>
                    </div>
                    <p className="font-bold text-sm truncate">{order.description}</p>
                    <p className="text-xs text-muted-foreground">{order.quantity} {order.unit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Log Meal Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Meal Served</DialogTitle>
            <DialogDescription>Record a meal served at the kitchen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <Select
                value={mealEntry.meal_type}
                onValueChange={(v) => setMealEntry({ ...mealEntry, meal_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                  <SelectItem value="lunch">☀️ Lunch</SelectItem>
                  <SelectItem value="dinner">🌙 Dinner</SelectItem>
                  <SelectItem value="snack">🍪 Snack</SelectItem>
                  <SelectItem value="other">🍽️ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Rice and beans, Ugali and fish..."
                value={mealEntry.description}
                onChange={(e) => setMealEntry({ ...mealEntry, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={mealEntry.date}
                  onChange={(e) => setMealEntry({ ...mealEntry, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity (servings)</Label>
                <Input
                  type="number"
                  min={1}
                  value={mealEntry.quantity}
                  onChange={(e) => setMealEntry({ ...mealEntry, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g. Used 5kg rice, 2kg beans..."
                value={mealEntry.notes}
                onChange={(e) => setMealEntry({ ...mealEntry, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleLog} className="w-full">Log Meal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Meals;
