// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, CheckCircle2, Sun, Sunrise, Moon, ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MEAL_SLOTS = [
  { id: "breakfast", label: "Breakfast", icon: Sunrise, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "lunch", label: "Lunch", icon: Sun, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "dinner", label: "Dinner", icon: Moon, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MenuPlanner = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({ day: "", slot: "", dish: "", notes: "" });

  const weekStart = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const monday = startOfWeek(base, { weekStartsOn: 1 });
    return monday;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    return `${format(weekStart, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }, [weekStart]);

  const weekDays = useMemo(() =>
    DAYS.map((name, i) => ({
      name,
      date: addDays(weekStart, i),
      dateStr: format(addDays(weekStart, i), "yyyy-MM-dd"),
    })),
    [weekStart]
  );

  const { data: menuPlans = [], isLoading } = useQuery({
    queryKey: ["kitchen-menu-plans", weekStart.toISOString()],
    queryFn: async () => {
      const startStr = format(weekStart, "yyyy-MM-dd");
      const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*")
        .gte("transaction_date", startStr)
        .lte("transaction_date", endStr)
        .ilike("notes", "[MENU]%")
        .order("transaction_date");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMenu = useMutation({
    mutationFn: async (values) => {
      const { error } = await supabase.from("inventory_transactions").insert({
        type: "adjustment",
        quantity: 0,
        notes: `[MENU] ${values.day}|${values.slot}|${values.dish}${values.notes ? ` - ${values.notes}` : ""}`,
        transaction_date: values.date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-menu-plans"] });
      toast({ title: "Saved", description: "Meal plan updated." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMenu = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("inventory_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-menu-plans"] });
      toast({ title: "Removed", description: "Meal plan entry removed." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markServed = useMutation({
    mutationFn: async (menuItem) => {
      const parts = menuItem.notes.replace("[MENU]", "").trim().split("|");
      const dish = parts[2] || "";
      const { error } = await supabase.from("inventory_transactions").insert({
        type: "issuance",
        quantity: 1,
        notes: `[MEAL] ${parts[1] || "meal"}: ${dish} (from menu plan)`,
        transaction_date: menuItem.transaction_date,
      });
      if (error) throw error;
      return menuItem.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-menu-plans"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-meals"] });
      toast({ title: "Marked Served", description: "Meal marked as served." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getPlanForDaySlot = (dateStr, slot) => {
    return (menuPlans || []).filter((p) => {
      const txDate = p.transaction_date?.split("T")[0];
      const parts = p.notes?.replace("[MENU]", "").trim().split("|") || [];
      return txDate === dateStr && parts[1] === slot;
    });
  };

  const openEdit = (day, slot) => {
    setEditDialog({ day, slot });
    setEditForm({ day, slot, dish: "", notes: "" });
  };

  const handleSave = () => {
    if (!editForm.dish.trim()) {
      toast({ title: "Error", description: "Dish name is required.", variant: "destructive" });
      return;
    }
    const dayInfo = weekDays.find((d) => d.name === editForm.day);
    saveMenu.mutate({
      day: editForm.day,
      slot: editForm.slot,
      dish: editForm.dish,
      notes: editForm.notes,
      date: dayInfo.dateStr,
    });
    setEditDialog(null);
  };

  const navigateWeek = (direction) => {
    setWeekOffset((prev) => prev + direction);
  };

  return (
    <DashboardLayout title="Weekly Menu Planner" subtitle="Plan breakfast, lunch & dinner for the week">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> {weekLabel}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {weekOffset === 0 ? "Current Week" : weekOffset < 0 ? `${Math.abs(weekOffset)} weeks ago` : `${weekOffset} weeks ahead`}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading menu plans...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="w-24 p-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meal</th>
                  {weekDays.map((day) => (
                    <th key={day.name} className={cn(
                      "p-2 text-center border",
                      format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                    )}>
                      <p className="text-[10px] font-bold uppercase">{day.name.slice(0, 3)}</p>
                      <p className="text-xs font-mono text-muted-foreground">{format(day.date, "d/M")}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_SLOTS.map((slot) => {
                  const SlotIcon = slot.icon;
                  return (
                    <tr key={slot.id}>
                      <td className={`p-2 border ${slot.color} text-[10px] font-bold uppercase tracking-wider`}>
                        <div className="flex items-center gap-1.5">
                          <SlotIcon className="h-3 w-3" />
                          {slot.label}
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const plans = getPlanForDaySlot(day.dateStr, slot.id);
                        const isToday = day.dateStr === format(new Date(), "yyyy-MM-dd");
                        return (
                          <td key={day.name} className={cn(
                            "p-1.5 border align-top min-h-[80px]",
                            isToday ? "bg-primary/5" : ""
                          )}>
                            <div className="space-y-1 min-h-[70px]">
                              {plans.map((plan) => {
                                const parts = plan.notes?.replace("[MENU]", "").trim().split("|") || [];
                                const dish = parts[2] || "";
                                const extra = parts[3] ? parts[3].replace(/^- /, "") : "";
                                return (
                                  <div key={plan.id} className="group relative bg-white rounded-md border p-1.5 shadow-sm hover:shadow transition-shadow">
                                    <div className="flex items-start justify-between gap-1">
                                      <p className="text-[11px] font-semibold leading-tight">{dish}</p>
                                      <button
                                        onClick={() => deleteMenu.mutate(plan.id)}
                                        className="opacity-0 group-hover:opacity-100 text-[9px] text-destructive hover:text-destructive/80 shrink-0 leading-none"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    {extra && <p className="text-[9px] text-muted-foreground truncate">{extra}</p>}
                                    <button
                                      onClick={() => markServed.mutate(plan)}
                                      className="mt-1 text-[8px] text-emerald-600 hover:text-emerald-700 font-bold uppercase flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="h-2.5 w-2.5" /> Served
                                    </button>
                                  </div>
                                );
                              })}
                              <button
                                onClick={() => openEdit(day.name, slot.id)}
                                className="w-full h-6 rounded-md border border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-muted-foreground/40 hover:text-primary/60 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Utensils className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Today's Meals Ready</p>
                <p className="text-xs text-emerald-600">
                  Plan each day's breakfast, lunch & dinner. Tap + to add a dish, mark as served once prepared.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
              <a href="/kitchen/meals">View Meal Log <ChevronRight className="h-4 w-4 ml-1" /></a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editDialog} onOpenChange={(v) => { if (!v) setEditDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Meal</DialogTitle>
            <DialogDescription>
              {editDialog?.day && editDialog?.slot
                ? `${editDialog.day} – ${editDialog.slot.charAt(0).toUpperCase() + editDialog.slot.slice(1)}`
                : "Add a dish to the menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={editForm.day} onValueChange={(v) => setEditForm({ ...editForm, day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meal Slot</Label>
                <Select value={editForm.slot} onValueChange={(v) => setEditForm({ ...editForm, slot: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEAL_SLOTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dish Name</Label>
              <Input
                placeholder="e.g. Rice and beans, Chapati, Porridge..."
                value={editForm.dish}
                onChange={(e) => setEditForm({ ...editForm, dish: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes / Ingredients (optional)</Label>
              <Textarea
                placeholder="e.g. 5kg rice, 2kg beans, 1L cooking oil"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMenu.isPending}>Save to Menu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MenuPlanner;
