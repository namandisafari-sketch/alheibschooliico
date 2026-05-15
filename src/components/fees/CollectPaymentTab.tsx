import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Printer, X, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRecordPayment, useStudentBalances, formatUGX } from "@/hooks/useFees";
import { PaymentReceipt } from "./PaymentReceipt";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

export const CollectPaymentTab = () => {
  const [code, setCode] = useState("");
  const [learner, setLearner] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const record = useRecordPayment();
  const { data: balances } = useStudentBalances();

  const handlePrint = useReactToPrint({ contentRef: receiptRef as any });

  useEffect(() => { inputRef.current?.focus(); }, []);

  const lookup = async () => {
    if (!code.trim()) return;
    const { data, error } = await supabase
      .from("learners")
      .select("id, full_name, admission_number, classes(name, level)")
      .ilike("admission_number", code.trim())
      .maybeSingle();
    if (error || !data) {
      toast.error("Learner not found");
      return;
    }
    setLearner(data);
  };

  const balance = balances?.find((b) => b.id === learner?.id);

  const submit = async () => {
    if (!learner || !amount) return;
    const result = await record.mutateAsync({
      learner_id: learner.id,
      amount: Number(amount),
      payment_method: method,
      reference_number: reference || undefined,
      notes: notes || undefined,
    });
    setReceipt({
      ...result,
      previousBalance: balance?.balance ?? 0,
      newBalance: (balance?.balance ?? 0) - Number(amount),
    });
    setLearner(null);
    setAmount("");
    setReference("");
    setNotes("");
    setCode("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Scan Student ID</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Scan or type admission number to process payment</p>
        <div className="space-y-2">
          <Label>Scan or Enter Student Code</Label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scan barcode or type ADM/25/0001..."
              onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
              className="font-mono"
            />
            <Button onClick={lookup} variant="default" size="icon"><Search className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ScanLine className="h-3 w-3" />
            Click the input field, then scan with your barcode scanner
          </p>
        </div>
      </Card>

      {learner && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">{learner.full_name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{learner.admission_number}</p>
              <p className="text-xs text-muted-foreground">{learner.classes?.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setLearner(null)}><X className="h-4 w-4" /></Button>
          </div>

          {balance && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">{formatUGX(balance.total)}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="font-bold text-success">{formatUGX(balance.paid)}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="font-bold text-destructive">{formatUGX(balance.balance)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (UGX)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <Label>Reference Number (optional)</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="mt-3">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button className="w-full mt-4" onClick={submit} disabled={!amount || record.isPending}>
            Record Payment & Print Receipt
          </Button>
        </Card>
      )}

      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent className="max-w-md p-4">
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          </div>
          {receipt && (
            <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
              <PaymentReceipt
                ref={receiptRef}
                receipt={receipt}
                previousBalance={receipt.previousBalance}
                newBalance={receipt.newBalance}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
