import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Plus, User, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Receiving = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["goods-received"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goods_received")
        .select(`*, supplier:suppliers(name), receiver:profiles(full_name)`)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name");
      if (error) throw error;
      return data;
    }
  });

  const [formData, setFormData] = useState({
    supplier_id: "",
    grn_number: `GRN-${Math.floor(Math.random() * 10000)}`,
    delivery_note_ref: "",
    total_value: "",
    quality_check_passed: true,
  });

  const createRecord = useMutation({
    mutationFn: async (record: any) => {
      const { error } = await supabase.from("goods_received").insert({
        ...record,
        received_by: user?.id,
        total_value: parseFloat(record.total_value || "0")
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-received"] });
      toast({ title: "Received", description: "Goods received note (GRN) logged successfully" });
      setIsDialogOpen(false);
    },
  });

  return (
    <DashboardLayout title="Goods Receiving" subtitle="Log and Verify Incoming Deliveries">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
             <Badge variant="outline" className="gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Quality Verified
             </Badge>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Log Delivery
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New GRN Entry</DialogTitle>
                <DialogDescription>Create a Goods Received Note for a delivery</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select onValueChange={(v) => setFormData(p => ({...p, supplier_id: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GRN Number</Label>
                    <Input value={formData.grn_number} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Note #</Label>
                    <Input 
                      value={formData.delivery_note_ref}
                      onChange={(e) => setFormData(p => ({...p, delivery_note_ref: e.target.value}))}
                      placeholder="DN-123" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Value (UGX)</Label>
                  <Input 
                    type="number"
                    value={formData.total_value}
                    onChange={(e) => setFormData(p => ({...p, total_value: e.target.value}))}
                    placeholder="250,000" 
                  />
                </div>
                <Button className="w-full gap-2" onClick={() => createRecord.mutate(formData)} disabled={createRecord.isPending}>
                  {createRecord.isPending ? "Logging..." : "Complete GRN"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading delivery logs...</div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <Box className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">No goods received notes found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>GRN / Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>DN Ref</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Logistics</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{rec.grn_number}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(rec.received_at), "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{rec.supplier?.name}</TableCell>
                      <TableCell className="text-xs uppercase">{rec.delivery_note_ref || "N/A"}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {rec.total_value?.toLocaleString()} UGX
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" /> {rec.receiver?.full_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rec.quality_check_passed ? 'secondary' : 'destructive'} className="text-[10px]">
                          {rec.quality_check_passed ? 'QA Passed' : 'QA Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Receiving;
