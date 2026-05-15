import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Pencil, FileText } from "lucide-react";
import { useFeePayments, formatUGX } from "@/hooks/useFees";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PaymentReceipt } from "./PaymentReceipt";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { Printer } from "lucide-react";

export const PaymentHistoryTab = () => {
  const { data: payments, isLoading } = useFeePayments();
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [view, setView] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef as any });

  const filtered = (payments || []).filter((p: any) => {
    const matchSearch = !search ||
      p.learners?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.learners?.admission_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.receipt_number?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === "all" || p.payment_method === methodFilter;
    return matchSearch && matchMethod;
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = filtered.filter((p: any) => p.payment_date === today);
  const totalToday = todayPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalAll = filtered.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const avg = filtered.length ? totalAll / filtered.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-xl font-bold mt-1">{formatUGX(totalAll)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filtered.length} payments</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-xl font-bold mt-1">{formatUGX(totalToday)}</p>
          <p className="text-xs text-muted-foreground mt-1">{todayPayments.length} payments</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Students Paid</p>
          <p className="text-xl font-bold mt-1">{new Set(filtered.map((p: any) => p.learner_id)).size}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Avg Payment</p>
          <p className="text-xl font-bold mt-1">{formatUGX(avg)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, admission number, or receipt..."
              className="pl-9"
            />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" />
          <h3 className="font-semibold">Payment Records</h3>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : !filtered.length ? (
          <p className="text-center text-muted-foreground py-8">No payments found</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p: any) => (
              <div key={p.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.learners?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.learners?.admission_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatUGX(p.amount)}</p>
                    <Badge variant="outline" className="capitalize text-xs">{p.payment_method.replace("_", " ")}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">Receipt: {p.receipt_number}</p>
                <p className="text-xs text-muted-foreground">Class: {p.learners?.classes?.name || "-"}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy h:mm a")}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setView(p)} title="View receipt">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent className="max-w-md p-4">
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          </div>
          {view && (
            <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
              <PaymentReceipt ref={printRef} receipt={view} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
