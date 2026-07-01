import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudentBalances, formatUGX } from "@/hooks/useFees";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const StudentBalancesTab = () => {
  const { data: balances, isLoading } = useStudentBalances();
  const [search, setSearch] = useState("");
  const [pupilStatus, setPupilStatus] = useState<string | null>(null);

  const statuses = [
    "Teacher's Child",
    "Orphan",
    "Bait Zakat",
    "IICO",
    "Community",
    "Paying",
    "Other",
  ];

  const filtered = (balances || []).filter(
    (b) =>
      (!search ||
        b.full_name.toLowerCase().includes(search.toLowerCase()) ||
        b.admission_number?.toLowerCase().includes(search.toLowerCase())) &&
      (!pupilStatus || b.pupil_status === pupilStatus)
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Student Balances</h3>
          <p className="text-sm text-muted-foreground">View and manage student fee balances</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,18rem)_16rem] w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learner..." className="pl-9" />
          </div>
          <Select value={pupilStatus ?? "all"} onValueChange={(value) => setPupilStatus(value === "all" ? null : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by pupil status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{b.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{b.admission_number}</p>
                  {b.pupil_status && (
                    <p className="text-xs text-muted-foreground mt-1">Category: {b.pupil_status}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={b.status === "paid" ? "default" : b.status === "partial" ? "secondary" : "destructive"}
                    className="shrink-0 capitalize"
                  >
                    {b.status === "pending" ? "pending" : b.status}
                  </Badge>
                  {b.pupil_status && (
                    <Badge variant="outline" className="capitalize">
                      {b.pupil_status}
                    </Badge>
                  )}
                </div>
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
