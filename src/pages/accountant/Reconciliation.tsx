// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Upload, CheckCircle2, AlertTriangle, Search, FileDown, Link2, Unlink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

type Line = { id: string; date: string; description: string; amount: number; matchedPaymentId?: string | null };

const STORAGE_KEY = "alheib.bank_recon.lines.v1";

const Reconciliation = () => {
  const [lines, setLines] = useState<Line[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [csv, setCsv] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("unmatched");

  const persist = (next: Line[]) => { setLines(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };

  const { data: payments = [] } = useQuery({
    queryKey: ["recon-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments").select("id, amount, payment_date, receipt_number, learners(full_name)").order("payment_date", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const importCsv = () => {
    const parsed: Line[] = csv.split(/\r?\n/).map((row, i) => {
      const cells = row.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ""));
      if (cells.length < 3) return null;
      const date = cells[0];
      const description = cells[1];
      const amount = Number(String(cells[2]).replace(/[^0-9.-]/g, ""));
      if (!date || isNaN(amount)) return null;
      return { id: `${Date.now()}-${i}`, date, description, amount, matchedPaymentId: null };
    }).filter(Boolean) as Line[];
    if (!parsed.length) { alert("No valid rows. Format: date, description, amount per line"); return; }
    persist([...parsed, ...lines]);
    setCsv("");
  };

  const autoMatch = () => {
    const next = lines.map((l) => {
      if (l.matchedPaymentId) return l;
      const cand = payments.find((p: any) => Number(p.amount) === Math.abs(Number(l.amount)) && !lines.some(x => x.matchedPaymentId === p.id));
      return cand ? { ...l, matchedPaymentId: cand.id } : l;
    });
    persist(next);
  };

  const toggleMatch = (lineId: string, paymentId: string | null) => {
    persist(lines.map(l => l.id === lineId ? { ...l, matchedPaymentId: paymentId } : l));
  };

  const removeLine = (id: string) => persist(lines.filter(l => l.id !== id));
  const clearAll = () => { if (confirm("Clear all imported statement lines?")) persist([]); };

  const totals = useMemo(() => {
    const credits = lines.filter(l => l.amount > 0).reduce((s, l) => s + l.amount, 0);
    const debits  = lines.filter(l => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0);
    const matched = lines.filter(l => l.matchedPaymentId).length;
    return { credits, debits, matched, unmatched: lines.length - matched };
  }, [lines]);

  const filtered = lines.filter(l => {
    if (tab === "matched" && !l.matchedPaymentId) return false;
    if (tab === "unmatched" && l.matchedPaymentId) return false;
    if (search && !l.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (n: number) => `UGX ${Math.abs(n).toLocaleString()}`;
  const exportReport = () => {
    const out = ["date,description,amount,matched_payment"].concat(
      lines.map(l => `${l.date},"${l.description}",${l.amount},${l.matchedPaymentId || ""}`)
    ).join("\n");
    const blob = new Blob([out], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `reconciliation-${format(new Date(), "yyyyMMdd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Bank Reconciliation" subtitle="Match bank statement lines to ledger entries">
      <div className="space-y-6">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Banknote className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Accountant · Bank Recon</p>
                <h2 className="text-2xl font-black text-indigo-950">Match every statement line</h2>
                <p className="text-sm text-indigo-800/80">Import a bank statement, auto-match to fee receipts, lock the period.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={autoMatch} disabled={!lines.length} className="bg-indigo-600 hover:bg-indigo-700"><Link2 className="h-4 w-4 mr-2" />Auto-match</Button>
              <Button variant="outline" onClick={exportReport} disabled={!lines.length}><FileDown className="h-4 w-4 mr-2" />Export</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Credits (in)"  value={fmt(totals.credits)} tone="emerald" />
          <KpiTile label="Debits (out)"  value={fmt(totals.debits)}  tone="rose" />
          <KpiTile label="Matched"       value={String(totals.matched)} tone="sky" />
          <KpiTile label="Unmatched"     value={String(totals.unmatched)} tone="amber" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <Card className="border-2 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Statement lines</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
                {lines.length > 0 && <Button size="sm" variant="ghost" onClick={clearAll}>Clear</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="unmatched">Unmatched ({totals.unmatched})</TabsTrigger>
                  <TabsTrigger value="matched">Matched ({totals.matched})</TabsTrigger>
                  <TabsTrigger value="all">All ({lines.length})</TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className="mt-4 space-y-2 max-h-[520px] overflow-y-auto">
                  {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No lines.</p>}
                  {filtered.map(l => {
                    const match = payments.find((p: any) => p.id === l.matchedPaymentId);
                    return (
                      <div key={l.id} className="flex items-center gap-3 p-3 border rounded-xl">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${l.matchedPaymentId ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {l.matchedPaymentId ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{l.description}</p>
                          <p className="text-xs text-muted-foreground">{l.date}{match && ` · matched: ${match.receipt_number || match.id.slice(0, 8)}`}</p>
                        </div>
                        <p className={`font-black tabular-nums ${l.amount < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {l.amount < 0 ? "-" : "+"}{fmt(l.amount)}
                        </p>
                        {l.matchedPaymentId ? (
                          <Button size="sm" variant="ghost" onClick={() => toggleMatch(l.id, null)}><Unlink className="h-3 w-3" /></Button>
                        ) : (
                          <select className="text-xs border rounded h-8 px-2 max-w-[160px]"
                            onChange={(e) => e.target.value && toggleMatch(l.id, e.target.value)}>
                            <option value="">Match to receipt…</option>
                            {payments.filter((p: any) => Math.abs(Number(p.amount)) === Math.abs(Number(l.amount)) || true).slice(0, 50).map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.receipt_number || p.id.slice(0, 6)} · {fmt(Number(p.amount))}
                              </option>
                            ))}
                          </select>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeLine(l.id)}>×</Button>
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-2 rounded-2xl">
              <CardHeader><CardTitle className="text-base">Import statement</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label className="text-xs">Paste CSV (date, description, amount per line)</Label>
                <Textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)}
                  placeholder={"2026-05-10, School fees Ali, 350000\n2026-05-11, Diesel for van, -120000"} className="font-mono text-xs" />
                <Button onClick={importCsv} className="w-full" disabled={!csv.trim()}>
                  <Upload className="h-4 w-4 mr-2" />Import {csv.split(/\r?\n/).filter(r => r.trim()).length} line(s)
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-2xl">
              <CardHeader><CardTitle className="text-base">Recent fee receipts</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-[280px] overflow-y-auto">
                {payments.slice(0, 20).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 border rounded">
                    <div>
                      <p className="font-semibold">{p.learners?.full_name || "Learner"}</p>
                      <p className="text-muted-foreground">{p.receipt_number || p.id.slice(0, 8)} · {p.payment_date}</p>
                    </div>
                    <span className="font-black tabular-nums">{fmt(Number(p.amount))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const KpiTile = ({ label, value, tone }: any) => {
  const tones: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-600",
    rose: "from-rose-500 to-pink-600",
    sky: "from-sky-500 to-blue-600",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <div className="rounded-2xl border-2 bg-card p-4">
      <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
      <p className={`text-xl font-black tabular-nums mt-1 bg-gradient-to-r ${tones[tone]} bg-clip-text text-transparent`}>{value}</p>
    </div>
  );
};

export default Reconciliation;
