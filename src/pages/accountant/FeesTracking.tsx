// @ts-nocheck
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, TrendingUp, Wallet, AlertCircle, Search, Percent, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseStudentScanPayload } from "@/lib/studentScan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FeesTracking() {
  const [payments, setPayments] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const [stats, setStats] = useState({ collected: 0, outstanding: 0, count: 0 });
  const [activeTab, setActiveTab] = useState("payments");

  useEffect(() => {
    (async () => {
      const { data: pays } = await supabase
        .from("fee_payments")
        .select("id, amount, paid_at, method, reference, learner_id, learners(name, admission_no)")
        .order("paid_at", { ascending: false })
        .limit(200);
      setPayments(pays || []);

      const { data: bals } = await supabase
        .from("student_fee_balances")
        .select("*")
        .order("balance", { ascending: false })
        .limit(200);
      setBalances(bals || []);

      const { data: disc } = await supabase
        .from("fee_discounts")
        .select("*, learners(full_name, admission_number), classes(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      setDiscounts(disc || []);

      const { data: plans } = await supabase
        .from("fee_payment_plans")
        .select("*, learners(full_name, admission_number)")
        .order("created_at", { ascending: false })
        .limit(100);
      setPaymentPlans(plans || []);

      const collected = (pays || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding = (bals || []).reduce((s, b) => s + Number(b.balance || 0), 0);
      setStats({ collected, outstanding, count: (pays || []).length });
    })();
  }, []);

  const lookupStudent = async (value: string) => {
    if (!value.trim()) return;
    const scan = parseStudentScanPayload(value);
    let query = supabase
      .from("learners")
      .select("id, full_name, admission_number, pupil_status, classes(name, level)")
      .maybeSingle();

    if (scan.studentId) {
      query = query.eq("id", scan.studentId);
    } else {
      query = query.ilike("admission_number", scan.admissionNumber || value.trim());
    }

    const { data, error } = await query;
    if (error || !data) {
      setSelectedStudent(null);
      setScanError("Learner not found");
      toast.error("Learner not found");
      return;
    }

    setSelectedStudent(data);
    setScanError("");
  };

  const filteredPayments = selectedStudent
    ? payments.filter((payment) => payment.learner_id === selectedStudent.id)
    : payments;

  const filteredBalances = selectedStudent
    ? balances.filter((balance) => balance.student_id === selectedStudent.id)
    : balances;

  const filtered = filteredPayments.filter((p) =>
    !search ||
    p.learners?.name?.toLowerCase().includes(search.toLowerCase()) ||
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

        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <div>
              <Label htmlFor="fees-tracking-scan">Scan student ID card QR or admission number</Label>
              <Input
                id="fees-tracking-scan"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan student ID QR code or enter admission number"
                onKeyDown={(e) => { if (e.key === "Enter") lookupStudent(scanCode); }}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use the QR code on the student ID card or type the admission number to focus the fee records.
              </p>
              {scanError && <p className="text-xs text-destructive mt-2">{scanError}</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => lookupStudent(scanCode)} disabled={!scanCode.trim()}>Find Student</Button>
              <Button variant="ghost" onClick={() => { setScanCode(""); setSelectedStudent(null); setScanError(""); }}>Clear</Button>
            </div>
          </div>
          {selectedStudent && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Selected Learner</p>
              <p className="font-semibold text-lg">{selectedStudent.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedStudent.admission_number} · {selectedStudent.classes?.name || "Class not assigned"}</p>
              {selectedStudent.pupil_status && (
                <p className="text-sm text-muted-foreground mt-1">Category: {selectedStudent.pupil_status}</p>
              )}
            </div>
          )}
        </Card>

        <div id="fee-stats-cards" className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm">Active Discounts</CardTitle>
              <Percent className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{discounts.filter(d => d.is_active).length}</div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100 rounded-2xl">
            <TabsTrigger value="payments" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Wallet className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="discounts" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Percent className="h-4 w-4" /> Discounts ({discounts.length})
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4" /> Payment Plans ({paymentPlans.length})
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <AlertCircle className="h-4 w-4" /> Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <Card id="fee-payments-table">
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
          </TabsContent>

          <TabsContent value="discounts" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fee Discounts & Concessions</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {discounts.filter(d => d.is_active).length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No discounts configured.</TableCell></TableRow>
                    ) : discounts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-semibold">{d.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{d.discount_type === 'percentage' ? '% Percentage' : 'Fixed Amount'}</Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold">
                          {d.discount_type === 'percentage' ? `${d.value}%` : Number(d.value).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {d.learners?.full_name || d.classes?.name || d.applies_to || 'All'}
                        </TableCell>
                        <TableCell>
                          {d.is_active ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{d.valid_until ? format(new Date(d.valid_until), "PP") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Plans (Installments)</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {paymentPlans.filter(p => p.status === 'active').length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Installments</TableHead>
                      <TableHead>Per Installment</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentPlans.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payment plans created.</TableCell></TableRow>
                    ) : paymentPlans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold">{p.learners?.full_name || "—"}</TableCell>
                        <TableCell className="font-mono font-bold">{Number(p.total_amount).toLocaleString()}</TableCell>
                        <TableCell>{p.installments}</TableCell>
                        <TableCell className="font-mono">{Number(p.installment_amount).toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{p.frequency}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(p.start_date), "PP")} — {p.end_date ? format(new Date(p.end_date), "PP") : "Open"}
                        </TableCell>
                        <TableCell>
                          <Badge className={p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}>
                            {p.status || 'active'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="mt-4">
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
                    {filteredBalances.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No outstanding balances.</TableCell></TableRow>
                    ) : filteredBalances.slice(0, 50).map((b: any) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
