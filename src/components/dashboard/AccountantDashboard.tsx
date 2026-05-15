
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  ShoppingCart, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  FileText,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export const AccountantDashboard = () => {
  const navigate = useNavigate();

  const { data: pos } = useQuery({
    queryKey: ["dashboard-pos"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).limit(5);
      return data || [];
    }
  });

  const { data: pettyCash } = useQuery({
    queryKey: ["dashboard-petty-cash"],
    queryFn: async () => {
      const { data } = await supabase.from("petty_cash_runs").select("*").eq("status", "open").single();
      return data;
    }
  });

  const stats = [
    { title: "Pending Approvals", value: pos?.filter(p => p.status !== 'approved' && p.status !== 'archived').length || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Open Petty Cash", value: pettyCash ? "Active" : "None", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Inventory Alerts", value: "3 Low", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    { title: "Next Payroll", value: format(new Date(), 'MMM 30'), icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-2">
         <Button onClick={() => navigate("/accountant/petty-cash")} className="h-14 rounded-2xl gap-2 bg-slate-900 px-8 font-black uppercase tracking-widest shrink-0">
            <PlusCircle className="h-5 w-5" /> Issue Petty Cash
         </Button>
         <Button onClick={() => navigate("/accountant/procurement")} className="h-14 rounded-2xl gap-2 bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 px-8 font-black uppercase tracking-widest shrink-0">
            <ShoppingCart className="h-5 w-5" /> New PO Request
         </Button>
         <Button onClick={() => navigate("/accountant/payroll")} className="h-14 rounded-2xl gap-2 bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 px-8 font-black uppercase tracking-widest shrink-0">
            <CreditCard className="h-5 w-5" /> Run Payroll
         </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-md rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
             <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Recent Purchase Orders</CardTitle>
                <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest" onClick={() => navigate("/accountant/procurement")}>View All</Button>
             </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-50">
                {pos?.map(po => (
                  <div key={po.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                           <FileText className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="font-bold text-slate-900">{po.title}</p>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PO-{po.id.slice(0, 8)}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-mono font-black text-slate-900">{po.total_amount?.toLocaleString()} <span className="text-[10px] text-slate-400">UGX</span></p>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest mt-1">{po.status}</Badge>
                     </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-[40px] overflow-hidden bg-indigo-900 text-white">
           <CardHeader className="p-8">
              <CardTitle className="text-xl font-black uppercase tracking-tight opacity-90">Financial Summary</CardTitle>
           </CardHeader>
           <CardContent className="p-8 pt-0 space-y-8">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Total Monthly Spend</p>
                 <p className="text-4xl font-black font-mono">14,250,000</p>
                 <div className="flex items-center gap-2 mt-2 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-bold">+12% vs last month</span>
                 </div>
              </div>
              
              <div className="space-y-4 pt-8 border-t border-white/10">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-60">Pending Advances</span>
                    <span className="font-mono font-bold">2,400,000</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-60">Petty Cash Balance</span>
                    <span className="font-mono font-bold">850,000</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-60">Unpaid Invoices</span>
                    <span className="font-mono font-bold">5,100,000</span>
                 </div>
              </div>

              <Button className="w-full h-14 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black uppercase tracking-widest mt-4">
                 Download Ledger Report
              </Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};
