// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Search, Package, Plus, Truck, CheckCircle2, Clock, AlertCircle, Bell, Phone, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NotifyRecipient = ({ delivery }: { delivery: any }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").insert({
        title: "Package Ready for Pickup",
        message: `Your package "${delivery.item_name}" from ${delivery.sender || "sender"} has arrived at the school gate.`,
        type: "delivery",
        priority: "medium",
        recipient_id: null,
        metadata: { delivery_id: delivery.id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Recipient Notified", description: "Notification has been sent." });
      queryClient.invalidateQueries({ queryKey: ["gate-deliveries"] });
    },
  });

  return (
    <Button size="sm" variant="outline" className="text-amber-600 border-amber-200" onClick={() => notifyMutation.mutate()} disabled={notifyMutation.isPending}>
      <Bell className="h-3 w-3 mr-1" /> Notify
    </Button>
  );
};

const GateDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    sender: "",
    sender_phone: "",
    recipient: "",
    recipient_phone: "",
    notes: "",
  });

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["gate-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_log")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const logDelivery = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("delivery_log")
        .insert({
          item_name: payload.item_name,
          sender: payload.sender,
          recipient: payload.recipient,
          status: "pending",
          notes: payload.notes,
          logged_by: user?.id,
          received_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gate-deliveries"] });
      toast({ title: "Package Logged", description: "Delivery recorded at gate." });
      setLogOpen(false);
      setFormData({ item_name: "", sender: "", sender_phone: "", recipient: "", recipient_phone: "", notes: "" });
    },
  });

  const markDelivered = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("delivery_log")
        .update({ status: "delivered", delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gate-deliveries"] });
      toast({ title: "Marked Delivered", description: "Package signed out to recipient." });
    },
  });

  const filtered = deliveries.filter((d: any) =>
    d.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.sender?.toLowerCase().includes(search.toLowerCase()) ||
    d.recipient?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter((d: any) => d.status === "pending");
  const delivered = filtered.filter((d: any) => d.status === "delivered");
  const unclaimed = filtered.filter((d: any) => d.status === "unclaimed");

  const stats = [
    { label: "Total", value: filtered.length, icon: Package, color: "text-blue-600 bg-blue-100" },
    { label: "Pending", value: pending.length, icon: Clock, color: "text-amber-600 bg-amber-100" },
    { label: "Delivered", value: delivered.length, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100" },
    { label: "Unclaimed", value: unclaimed.length, icon: AlertCircle, color: "text-red-600 bg-red-100" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
      unclaimed: "bg-red-100 text-red-800 border-red-200",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  return (
    <DashboardLayout title="Package Delivery" subtitle="Receive, log, and track packages at the gate">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-4 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search packages, sender, recipient..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={logOpen} onOpenChange={setLogOpen}>
            <Button asChild onClick={() => setLogOpen(true)} className="gap-2 shrink-0">
              <span><Plus className="h-4 w-4" /> Log Package</span>
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Incoming Package</DialogTitle>
                <DialogDescription>Record a delivery arriving at the school gate</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Package/Item Name *</Label>
                  <Input value={formData.item_name} onChange={(e) => setFormData(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g., Books, Uniforms, Equipment" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sender</Label>
                    <Input value={formData.sender} onChange={(e) => setFormData(p => ({ ...p, sender: e.target.value }))} placeholder="Company or person" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sender Phone</Label>
                    <Input value={formData.sender_phone} onChange={(e) => setFormData(p => ({ ...p, sender_phone: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recipient *</Label>
                    <Input value={formData.recipient} onChange={(e) => setFormData(p => ({ ...p, recipient: e.target.value }))} placeholder="Staff member name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Recipient Phone</Label>
                    <Input value={formData.recipient_phone} onChange={(e) => setFormData(p => ({ ...p, recipient_phone: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Condition, special handling, etc." rows={2} />
                </div>
                <Button className="w-full" onClick={() => logDelivery.mutate(formData)} disabled={logDelivery.isPending || !formData.item_name || !formData.recipient}>
                  {logDelivery.isPending ? "Logging..." : "Log Package"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({delivered.length})</TabsTrigger>
            <TabsTrigger value="unclaimed">Unclaimed ({unclaimed.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          </TabsList>

          {(["pending", "delivered", "unclaimed", "all"] as const).map((tab) => {
            const items = tab === "all" ? filtered : { pending, delivered, unclaimed }[tab];
            return (
              <TabsContent key={tab} value={tab} className="mt-2">
                <Card>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="py-20 text-center text-muted-foreground">Loading deliveries...</div>
                    ) : items.length === 0 ? (
                      <div className="py-16 text-center">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">No packages in this category.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date/Time</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>For</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((delivery: any) => (
                            <TableRow key={delivery.id}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {format(new Date(delivery.created_at), "MMM d, h:mm a")}
                                <span className="block text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-sm">{delivery.item_name}</TableCell>
                              <TableCell className="text-sm">{delivery.sender || "—"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  {delivery.recipient}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusBadge(delivery.status)} variant="outline">
                                  {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {delivery.status === "pending" && (
                                    <>
                                      <NotifyRecipient delivery={delivery} />
                                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => markDelivered.mutate(delivery.id)} disabled={markDelivered.isPending}>
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Delivered
                                      </Button>
                                    </>
                                  )}
                                  {delivery.status === "delivered" && delivery.delivered_at && (
                                    <span className="text-[10px] text-muted-foreground self-center">
                                      {formatDistanceToNow(new Date(delivery.delivered_at), { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default GateDeliveries;
