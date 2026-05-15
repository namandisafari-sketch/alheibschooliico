import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  User, 
  ShieldCheck,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  History as HistoryIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const InventoryTracking = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["inventory-audit-trail"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`
          *,
          item:inventory_items(name, unit, category:inventory_categories(name)),
          learner:learners(full_name, admission_number),
          approver:profiles!inventory_transactions_approved_by_fkey(full_name)
        `)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      (t.item?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tracking_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.learner?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    return matchesSearch && t.type === filterType;
  });

  return (
    <DashboardLayout 
      title="Inventory Audit Trail" 
      subtitle="Complete tracking of all school supply movements and approvals"
    >
      <div className="space-y-6">
        {/* Filters and Search */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by item, tracking #, or recipient..." 
                  className="pl-9 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  variant={filterType === "all" ? "default" : "outline"} 
                  onClick={() => setFilterType("all")}
                  className="h-11"
                >All</Button>
                <Button 
                  variant={filterType === "issuance" ? "default" : "outline"} 
                  onClick={() => setFilterType("issuance")}
                  className="h-11"
                >Issuance</Button>
                <Button 
                  variant={filterType === "restock" ? "default" : "outline"} 
                  onClick={() => setFilterType("restock")}
                  className="h-11"
                >Restock</Button>
                <Button variant="outline" className="h-11 border-dashed">
                  <Filter className="mr-2 h-4 w-4" /> Advanced
                </Button>
                <Button variant="outline" className="h-11 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Table */}
        <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-md">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Movement History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking Ref</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Item Details</th>
                    <th className="text-center p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Approval Status</th>
                    <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="p-4">
                        <Badge variant="secondary" className="font-mono text-[10px] py-1">
                          {t.tracking_number}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center",
                            t.type === "issuance" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {t.type === "issuance" ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{t.item?.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-medium">{t.item?.category?.name || "General"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <p className={cn(
                          "text-base font-black",
                          t.type === "issuance" ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {t.type === "issuance" ? "-" : "+"}{t.quantity}
                        </p>
                        <p className="text-[9px] uppercase font-bold text-slate-400">{t.item?.unit}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{t.learner?.full_name || "General Store"}</p>
                            {t.learner && <p className="text-[10px] text-slate-400">{t.learner.admission_number}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "w-fit text-[9px] uppercase tracking-tighter px-2",
                              t.status === "approved" ? "bg-emerald-100 text-emerald-700" : 
                              t.status === "pending" ? "bg-amber-100 text-amber-700 animate-pulse" : 
                              "bg-slate-100 text-slate-500"
                            )}
                          >
                            {t.status || 'restocked'}
                          </Badge>
                          {t.approver && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 italic">
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              By {t.approver.full_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-bold text-slate-700">{format(new Date(t.transaction_date), "dd MMM yyyy")}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Clock className="h-3 w-3" />
                            {format(new Date(t.transaction_date), "HH:mm")}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="py-20 text-center">
                <HistoryIcon className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No movements found matching your search</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InventoryTracking;
