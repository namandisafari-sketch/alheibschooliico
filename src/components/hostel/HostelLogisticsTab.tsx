import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const HostelLogisticsTab = () => {
  const hostelItems = useQuery({
    queryKey: ["hostel-logistics-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []).filter((i: any) => i.category === "Hostel Essentials");
    },
  });

  const recentTransactions = useQuery({
    queryKey: ["hostel-logistics-transactions"],
    queryFn: async () => {
      const { data: items, error: itemsError } = await supabase
        .from("inventory_items")
        .select("id, name, category");
      if (itemsError) throw itemsError;

      const hostelItemIds = (items || [])
        .filter((i: any) => i.category === "Hostel Essentials")
        .map((i: any) => i.id);

      if (hostelItemIds.length === 0) return [];

      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*, staff:profiles(full_name)")
        .in("item_id", hostelItemIds)
        .order("transaction_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const getStatus = (stock: number, minStock: number) => {
    if (stock <= 0 || stock < minStock * 0.3) return { label: "Critical", variant: "destructive" as const };
    if (stock < minStock) return { label: "Low", variant: "secondary" as const };
    return { label: "Good", variant: "default" as const };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {hostelItems.isLoading && (
          <div className="col-span-full py-8 text-center text-muted-foreground">Loading supplies...</div>
        )}
        {hostelItems.data?.map((item: any) => {
          const stock = item.quantity ?? 0;
          const minStock = item.min_threshold ?? 5;
          const status = getStatus(stock, minStock);
          return (
            <Card key={item.id} className="border-none shadow-sm">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${
                    status.label === 'Critical' ? 'bg-destructive/10 text-destructive' :
                    status.label === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-success/10 text-success'
                  }`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{item.name}</p>
                <p className="text-2xl font-bold">{stock}</p>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
              </CardContent>
            </Card>
          );
        })}
        {hostelItems.data?.length === 0 && !hostelItems.isLoading && (
          <div className="col-span-full py-8 text-center text-muted-foreground">No hostel supplies found in inventory.</div>
        )}
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Hostel Inventory Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading transactions...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No recent movements</TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.data?.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {hostelItems.data?.find((i: any) => i.id === tx.item_id)?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === "restock" ? "outline" : tx.type === "issuance" ? "secondary" : "default"}>
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className={tx.type === "restock" ? "text-success font-bold" : "text-destructive font-bold"}>
                        {tx.type === "restock" ? "+" : "-"}{tx.quantity}
                      </TableCell>
                      <TableCell>{tx.staff?.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(tx.transaction_date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
