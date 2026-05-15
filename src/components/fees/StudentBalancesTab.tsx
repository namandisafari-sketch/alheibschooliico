import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudentBalances, formatUGX } from "@/hooks/useFees";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const StudentBalancesTab = () => {
  const { data: balances, isLoading } = useStudentBalances();
  const [search, setSearch] = useState("");

  const filtered = (balances || []).filter(
    (b) =>
      !search ||
      b.full_name.toLowerCase().includes(search.toLowerCase()) ||
      b.admission_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Student Balances</h3>
          <p className="text-sm text-muted-foreground">View and manage student fee balances</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learner..." className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{b.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{b.admission_number}</p>
                </div>
                <Badge
                  variant={b.status === "paid" ? "default" : b.status === "partial" ? "secondary" : "destructive"}
                  className="shrink-0 capitalize"
                >
                  {b.status === "pending" ? "pending" : b.status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-mono">{formatUGX(b.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-mono text-success">{formatUGX(b.paid)}</span></div>
                <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Balance</span><span className={`font-mono ${b.balance > 0 ? "text-destructive" : "text-success"}`}>{formatUGX(b.balance)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
