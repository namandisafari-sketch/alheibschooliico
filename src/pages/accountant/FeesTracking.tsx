// @ts-nocheck
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function FeesTracking() {
  const [payments, setPayments] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ collected: 0, outstanding: 0, count: 0 });

  useEffect(() => {
    (async () => {
      const { data: pays } = await supabase
        .from("fee_payments")
        .select("id, amount, paid_at, method, reference, student_id, students(name, admission_no)")
        .order("paid_at", { ascending: false })
        .limit(200);
      setPayments(pays || []);

      const { data: bals } = await supabase
        .from("student_fee_balances")
        .select("*")
        .order("balance", { ascending: false })
        .limit(200);
      setBalances(bals || []);

      const collected = (pays || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding = (bals || []).reduce((s, b) => s + Number(b.balance || 0), 0);
      setStats({ collected, outstanding, count: (pays || []).length });
    })();
  }, []);

  const filtered = payments.filter((p) =>
    !search ||
    p.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" />
            Fees Tracking
          </h1>
          <p className="text-muted-foreground">Accountant-only view of all fee inflows and outstanding balances.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Collected (recent)</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.collected.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Outstanding</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.outstanding.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.count}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <Input
              placeholder="Search by student or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm mt-2"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments yet.</TableCell></TableRow>
                ) : filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paid_at ? format(new Date(p.paid_at), "PP") : "—"}</TableCell>
                    <TableCell>{p.students?.name || "—"} <span className="text-xs text-muted-foreground">{p.students?.admission_no}</span></TableCell>
                    <TableCell><Badge variant="outline">{p.method || "cash"}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{p.reference || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(p.amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Outstanding Balances</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No outstanding balances.</TableCell></TableRow>
                ) : balances.slice(0, 50).map((b: any) => (
                  <TableRow key={b.student_id || b.id}>
                    <TableCell>{b.student_name || b.name || "—"}</TableCell>
                    <TableCell>{b.class_name || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{Number(b.balance || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
