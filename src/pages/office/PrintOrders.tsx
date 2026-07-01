// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileUp, Download, Lock, Unlock, Trash2, Eye, Share2, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const BUCKET = "print_orders";

const PrintOrders = () => {
  const { user } = useAuth();
  const { toast: showToast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: 1,
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleFileSelect = (f: File | null) => {
    setFile(f);
    if (f && !formData.title) {
      const name = f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setFormData((prev) => ({ ...prev, title: name }));
    }
  };

  const { data: ordersRaw = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["print-orders"],
    queryFn: async () => {
      // Get own orders
      const { data: own, error: ownErr } = await supabase
        .from("print_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (ownErr) throw ownErr;

      // Get shared order IDs
      const { data: myPerms } = await supabase
        .from("print_order_permissions")
        .select("order_id")
        .eq("user_id", user?.id);

      const sharedIds = [...new Set((myPerms || []).map((p: any) => p.order_id))];
      const ownIds = new Set((own || []).map((o: any) => o.id));
      const missingIds = sharedIds.filter((id) => !ownIds.has(id));

      let shared: any[] = [];
      if (missingIds.length > 0) {
        const { data: sharedData } = await supabase
          .from("print_orders")
          .select("*")
          .in("id", missingIds);
        shared = sharedData || [];
      }

      return [...(own || []), ...shared];
    },
    retry: false,
  });

  const { data: perms = [] } = useQuery({
    queryKey: ["print-order-perms", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("print_order_permissions")
        .select("*");
      return data || [];
    },
    retry: false,
  });

  const { data: users = [], error: usersError } = useQuery({
    queryKey: ["school-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    retry: false,
  });

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  const permsByOrder = perms.reduce((acc: any, p: any) => {
    if (!acc[p.order_id]) acc[p.order_id] = [];
    acc[p.order_id].push(p);
    return acc;
  }, {});

  const printOrders = ordersRaw.map((o: any) => ({
    ...o,
    created_by: usersById[o.created_by] || { id: o.created_by, full_name: "Unknown", email: "" },
    shared_with_users: permsByOrder[o.id] || [],
  }));

  const tableMissing = ordersError?.message?.includes("does not exist") || ordersError?.message?.includes("schema cache");

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!file) {
        throw new Error("File upload is required");
      }

      let fileUrl = null;
      const ext = file.name.split(".").pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file);
      
      if (uploadErr) {
        if (uploadErr.message?.includes("bucket") || uploadErr.message?.includes("not found")) {
          // Bucket should already exist — skip creation attempt (requires service_role)
          throw new Error("Storage bucket 'print_orders' not configured. Contact the administrator.");
        } else {
          throw uploadErr;
        }
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl;

      const { data: orderData, error: insertErr } = await supabase
        .from("print_orders")
        .insert({
          title: formData.title,
          description: formData.description,
          quantity: formData.quantity,
          notes: formData.notes,
          file_url: fileUrl,
          file_path: filePath,
          created_by: user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Add permissions for selected users
      if (selectedUsers.length > 0) {
        const permissions = selectedUsers.map((userId) => ({
          order_id: orderData.id,
          user_id: userId,
          can_download: true,
        }));
        await supabase.from("print_order_permissions").insert(permissions);
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-orders"] });
      showToast({ title: "Print order created", description: "Your work has been uploaded for printing" });
      setIsCreateOpen(false);
      setFormData({ title: "", description: "", quantity: 1, notes: "" });
      setFile(null);
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      showToast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const order = printOrders.find((o) => o.id === orderId);
      if (order?.file_path) {
        const { error: rmErr } = await supabase.storage.from(BUCKET).remove([order.file_path]);
        if (rmErr) console.error("Failed to remove file from storage", rmErr);
      }
      const { error } = await supabase.from("print_orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-orders"] });
      showToast({ title: "Order deleted" });
    },
    onError: (error: any) => {
      showToast({ title: "Failed to delete order", description: error.message, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await supabase
        .from("print_orders")
        .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
        .eq("id", orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-orders"] });
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("No order selected");
      
      // Delete existing permissions
      await supabase.from("print_order_permissions").delete().eq("order_id", selectedOrder.id);
      
      // Add new permissions
      if (selectedUsers.length > 0) {
        const permissions = selectedUsers.map((userId) => ({
          order_id: selectedOrder.id,
          user_id: userId,
          can_download: true,
        }));
        await supabase.from("print_order_permissions").insert(permissions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-orders"] });
      showToast({ title: "Permissions updated" });
      setIsShareOpen(false);
    },
  });

  const filteredOrders = printOrders.filter((order) => {
    const matchesSearch =
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.created_by?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;
    return matchesSearch && order.status === filterType;
  });

  const myOrders = filteredOrders.filter((o) => o.created_by?.id === user?.id);
  const accessibleOrders = filteredOrders.filter(
    (o) => o.created_by?.id !== user?.id && o.shared_with_users?.some((p: any) => p.user_id === user?.id)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "printing":
        return <FileUp className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const canDownload = (order: any) => {
    if (order.created_by?.id === user?.id) return true;
    return order.shared_with_users?.some((p: any) => p.user_id === user?.id);
  };

  return (
    <DashboardLayout title="Print Order Center" subtitle="Upload work for printing and manage print requests">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-blue-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Orders</p>
                <p className="text-xl font-bold">{printOrders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Pending</p>
                <p className="text-xl font-bold">{printOrders.filter((o) => o.status === "pending").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Completed</p>
                <p className="text-xl font-bold">{printOrders.filter((o) => o.status === "completed").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Shared with Me</p>
                <p className="text-xl font-bold">{accessibleOrders.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup warning */}
        {tableMissing && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Print Orders table not found</h3>
                <p className="text-sm text-amber-800 mb-3">
                  The <code className="bg-amber-100 px-1 rounded text-xs">print_orders</code> table does not exist in your database.
                  Run the migration at <code className="bg-amber-100 px-1 rounded text-xs">supabase/migrations/20260607000000_print_orders_system.sql</code>
                  to create the required tables and storage bucket.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-900"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.storage.createBucket("print_orders", { public: true });
                        if (error && !error.message.includes("already exists")) throw error;
                        showToast({ title: "Storage bucket created. Please run the SQL migration manually." });
                        queryClient.invalidateQueries({ queryKey: ["print-orders"] });
                      } catch (e: any) {
                        showToast({ title: "Failed to create bucket", description: e.message, variant: "destructive" });
                      }
                    }}
                  >
                    Create Storage Bucket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {ordersError && !tableMissing && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Failed to load print orders</p>
                  <p className="text-xs text-red-700 mt-1">{ordersError.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="my-orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="my-orders" className="gap-2">
              <FileUp className="h-4 w-4" />
              My Orders ({myOrders.length})
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2">
              <Share2 className="h-4 w-4" />
              Shared with Me ({accessibleOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* My Orders Tab */}
          <TabsContent value="my-orders" className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1 relative">
                <Input placeholder="Search your orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4" />
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Print Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>New Print Order</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => document.getElementById("file-upload-pao")?.click()}
                      >
                        <input type="file" className="hidden" id="file-upload-pao" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                        <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                        {file ? (
                          <div>
                            <p className="text-xs font-bold text-primary">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Tap to change file</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Tap here to choose a file</p>
                        )}
                      </div>
                    </div>
                    {file && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            placeholder="Auto-filled from filename"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Copies</Label>
                            <Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="h-8 text-xs" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Notes (optional)</Label>
                            <Input placeholder="e.g. color, binding" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="h-8 text-xs" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => createOrder.mutate()} disabled={createOrder.isPending || !file}>
                      {createOrder.isPending ? "Creating..." : "Create Order"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* My Orders Table */}
            <Card>
              <CardContent className="p-0">
                {myOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">No print orders yet. Create one to get started!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Copies</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shared</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-sm">{order.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <span className="text-xs font-bold capitalize">{order.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {order.shared_with_users?.length || 0} users
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setSelectedUsers(order.shared_with_users?.map((p: any) => p.user_id) || []);
                                  setIsShareOpen(true);
                                }}
                              >
                                <Share2 className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={order.file_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 text-purple-600" />
                                </a>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteOrder.mutate(order.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
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

          {/* Shared with Me Tab */}
          <TabsContent value="shared" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {accessibleOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <Unlock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">No print orders shared with you yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Copies</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessibleOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.title}</TableCell>
                          <TableCell className="text-sm">{order.created_by?.full_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-sm">{order.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <span className="text-xs font-bold capitalize">{order.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canDownload(order) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={order.file_url} download>
                                    <Download className="h-4 w-4 text-emerald-600" />
                                  </a>
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={order.file_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 text-purple-600" />
                                </a>
                              </Button>
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
        </Tabs>

        {/* Share Dialog */}
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Print Order</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Order</p>
                  <p className="font-medium mt-1">{selectedOrder.title}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Grant download access to:</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, u.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== u.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => updatePermissions.mutate()} disabled={updatePermissions.isPending}>
                {updatePermissions.isPending ? "Updating..." : "Save Permissions"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PrintOrders;
