// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ProcurementTab = () => {
  const { data: pos, isLoading } = useQuery({
    queryKey: ["procurement-log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const activeCount = pos?.filter(p => p.status !== 'archived' && p.status !== 'rejected').length || 0;
  const fulfilledCount = pos?.filter(p => p.status === 'archived').length || 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Orders in transit or pending delivery</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-success uppercase tracking-widest">Fulfilled (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{fulfilledCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered and verified</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Procurement Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Item(s)</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-5 w-5 mx-auto text-slate-200" /></TableCell></TableRow>
              ) : pos?.map(po => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs uppercase">PO-{po.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{po.title}</TableCell>
                  <TableCell>General Vendor</TableCell>
                  <TableCell><Badge variant={po.status === 'archived' ? 'success' : 'secondary'}>{po.status}</Badge></TableCell>
                  <TableCell className="font-bold">UGX {po.total_amount?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
