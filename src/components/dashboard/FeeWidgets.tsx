import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, AlertTriangle } from "lucide-react";
import { useFeePayments, useStudentBalances, formatUGX } from "@/hooks/useFees";
import { format } from "date-fns";

export const FeeCollectionSummary = () => {
  const { data: payments } = useFeePayments();
  const { data: balances } = useStudentBalances();

  const collected = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const expected = (balances || []).reduce((s, b) => s + b.total, 0);
  const outstanding = (balances || []).reduce((s, b) => s + Math.max(0, b.balance), 0);
  const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold">Fee Collection Summary</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Expected Fees</p>
          <p className="font-bold mt-1">{formatUGX(expected)}</p>
        </div>
        <div className="rounded-lg bg-success/10 p-3">
          <p className="text-xs text-muted-foreground">Collected</p>
          <p className="font-bold text-success mt-1">{formatUGX(collected)}</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Outstanding
          </p>
          <p className="font-bold text-destructive mt-1">{formatUGX(outstanding)}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Collection rate</span>
          <span className="font-semibold">{rate}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(rate, 100)}%` }} />
        </div>
      </div>
    </Card>
  );
};

export const RecentFeePayments = () => {
  const { data: payments } = useFeePayments();
  const recent = (payments || []).slice(0, 5);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-success" />
        <h3 className="font-display font-semibold">Recent Fee Payments</h3>
      </div>
      {!recent.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
      ) : (
        <div className="space-y-2">
          {recent.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.learners?.full_name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {p.learners?.admission_number} • {format(new Date(p.created_at), "M/d/yyyy")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">{formatUGX(p.amount)}</p>
                <Badge variant="outline" className="text-xs capitalize">{p.payment_method.replace("_", " ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export const OutstandingBalancesWidget = () => {
  const { data: balances } = useStudentBalances();
  const owing = (balances || []).filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 6);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-display font-semibold">Students with Outstanding Balances</h3>
      </div>
      {!owing.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">No students with outstanding balances</p>
      ) : (
        <div className="space-y-2">
          {owing.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg border">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{b.full_name}</p>
                <p className="text-xs text-muted-foreground">{b.class_name} • {b.admission_number}</p>
              </div>
              <p className="font-bold text-sm text-destructive shrink-0">{formatUGX(b.balance)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
