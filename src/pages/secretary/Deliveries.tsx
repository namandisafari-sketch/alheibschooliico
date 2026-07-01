import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Truck, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";

const SecretaryDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    sender: "",
    recipient: "",
    status: "pending",
    notes: "",
  });

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["secretary-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_log")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createDelivery = useMutation({
    mutationFn: async (delivery: any) => {
      const { data, error } = await supabase
        .from("delivery_log")
        .insert({
          ...delivery,
          logged_by: user?.id,
          received_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretary-deliveries"] });
      toast({
        title: "Delivery logged",
        description: "Package delivery recorded successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        item_name: "",
        sender: "",
        recipient: "",
        status: "pending",
        notes: "",
      });
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("delivery_log")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretary-deliveries"] });
      toast({
        title: "Status updated",
        description: "Delivery status changed successfully",
      });
    },
  });

  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("delivery_log")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretary-deliveries"] });
      toast({
        title: "Deleted",
        description: "Delivery record removed",
      });
    },
  });

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter((d: any) => d.status === "pending").length,
    delivered: deliveries.filter((d: any) => d.status === "delivered").length,
    unclaimed: deliveries.filter((d: any) => d.status === "unclaimed").length,
  };

  return (
    <DashboardLayout
      title="Delivery Management"
      subtitle="Track incoming packages and deliveries"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">Unclaimed</p>
                  <p className="text-2xl font-bold">{stats.unclaimed}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Log Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log New Delivery</DialogTitle>
                <DialogDescription>
                  Record a new incoming package or delivery
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={formData.item_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, item_name: e.target.value }))
                    }
                    placeholder="e.g., School Uniforms, Textbooks"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From (Sender)</Label>
                  <Input
                    value={formData.sender}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, sender: e.target.value }))
                    }
                    placeholder="e.g., Supplier Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>For (Recipient)</Label>
                  <Input
                    value={formData.recipient}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, recipient: e.target.value }))
                    }
                    placeholder="e.g., Head Teacher, Bursar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Pickup</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="unclaimed">Unclaimed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="Special handling, condition, etc..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createDelivery.mutate(formData)}
                  disabled={createDelivery.isPending || !formData.item_name}
                >
                  {createDelivery.isPending ? "Logging..." : "Log Delivery"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Deliveries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Records
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">
                Loading deliveries...
              </div>
            ) : deliveries.length === 0 ? (
              <div className="py-20 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No deliveries logged yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery: any) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(delivery.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {delivery.item_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {delivery.sender || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {delivery.recipient}
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={delivery.status}
                          onValueChange={(v) =>
                            updateDeliveryStatus.mutate({
                              id: delivery.id,
                              status: v,
                            })
                          }
                        >
                          <SelectTrigger className="w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="unclaimed">Unclaimed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {delivery.notes ? delivery.notes.substring(0, 30) + "..." : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDelivery.mutate(delivery.id)}
                          disabled={deleteDelivery.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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

export default SecretaryDeliveries;
