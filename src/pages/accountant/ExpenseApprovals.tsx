// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Check, X, Loader2, Plus, Search, Wallet, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const statusTone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rejected: "bg-rose-100 text-rose-800 border-rose-300",
  paid: "bg-sky-100 text-sky-800 border-sky-300",
};

const ExpenseApprovals = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ purpose: "", category: "supplies", amount: "", notes: "" });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["expense-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expense_requests").insert({
        purpose: form.purpose,
        category: form.category,
        amount: Number(form.amount),
        notes: form.notes,
        status: "pending",
        requested_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Expense submitted"); setOpen(false); setForm({ purpose: "", category: "supplies", amount: "", notes: "" }); qc.invalidateQueries({ queryKey: ["expense-requests"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({ id, status, reason }: any) => {
      const { error } = await supabase.from("expense_requests")
        .update({ status, decision_reason: reason, decided_by: user?.id, decided_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v: any) => { toast.success(`Marked ${v.status}`); qc.invalidateQueries({ queryKey: ["expense-requests"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = rows
    .filter((r: any) => tab === "all" || r.status === tab)
    .filter((r: any) => !search || (r.purpose || "").toLowerCase().includes(search.toLowerCase()));

  const sumByStatus = (s: string) => rows.filter((r: any) => r.status === s).reduce((t: number, r: any) => t + Number(r.amount || 0), 0);
  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <DashboardLayout title="Expense Approvals" subtitle="Review and release staff expense claims">
      <div className="space-y-6">
        {/* Hero */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Receipt className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Accountant · Expense Desk</p>
                <h2 className="text-2xl font-black text-emerald-950">Approve, reject, and reimburse</h2>
                <p className="text-sm text-emerald-800/80">Every shilling tracked, every decision auditable.</p>
              </div>
            </div>
            <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />New expense claim
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiTile icon={Clock} tone="amber" label="Pending" amount={fmt(sumByStatus("pending"))} count={rows.filter((r: any) => r.status === "pending").length} />
          <KpiTile icon={CheckCircle2} tone="emerald" label="Approved" amount={fmt(sumByStatus("approved"))} count={rows.filter((r: any) => r.status === "approved").length} />
          <KpiTile icon={Wallet} tone="sky" label="Paid out" amount={fmt(sumByStatus("paid"))} count={rows.filter((r: any) => r.status === "paid").length} />
          <KpiTile icon={AlertTriangle} tone="rose" label="Rejected" amount={fmt(sumByStatus("rejected"))} count={rows.filter((r: any) => r.status === "rejected").length} />
        </div>

        <Card className="border-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Claims queue</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search purpose…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="mt-4 space-y-2">
                {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
                {!isLoading && filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No {tab === "all" ? "" : tab} claims yet.
                  </div>
                )}
                {filtered.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-accent/30">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.purpose || "Untitled claim"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.category || "general"} · {r.created_at ? format(new Date(r.created_at), "PPp") : ""}
                      </p>
                      {r.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{r.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-black tabular-nums">{fmt(Number(r.amount || 0))}</p>
                      <Badge variant="outline" className={`mt-1 ${statusTone[r.status] || ""}`}>{r.status}</Badge>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => decide.mutate({ id: r.id, status: "approved" })}>
                          <Check className="h-3 w-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-rose-700 border-rose-300 hover:bg-rose-50"
                          onClick={() => {
                            const reason = prompt("Reason for rejection?");
                            if (reason !== null) decide.mutate({ id: r.id, status: "rejected", reason });
                          }}>
                          <X className="h-3 w-3 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                    {r.status === "approved" && (
                      <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={() => decide.mutate({ id: r.id, status: "paid" })}>
                        <Wallet className="h-3 w-3 mr-1" />Mark paid
                      </Button>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New expense claim</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Purpose</Label><Input value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})} placeholder="e.g. Fuel for school van" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <select className="w-full border rounded-md h-10 px-3" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                  {["supplies","transport","utilities","repairs","food","medical","training","other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Amount (UGX)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} /></div>
            </div>
            <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.purpose || !form.amount}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const KpiTile = ({ icon: Icon, tone, label, amount, count }: any) => {
  const tones: Record<string, string> = {
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-600",
    sky: "from-sky-500 to-blue-600",
    rose: "from-rose-500 to-pink-600",
  };
  return (
    <div className="rounded-2xl border-2 bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">{count} item(s)</span>
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <p className="text-lg font-black tabular-nums mt-0.5">{amount}</p>
    </div>
  );
};

export default ExpenseApprovals;
