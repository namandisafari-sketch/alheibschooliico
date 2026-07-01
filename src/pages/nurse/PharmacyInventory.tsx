// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePharmacy, useUpdatePharmacy } from "@/hooks/useHealth";
import { useInventoryBatches, useAddInventoryBatch, useReorderRequests, useCreateReorderRequest, useUpdateReorderRequest } from "@/hooks/usePharmacyAdvanced";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Package, Plus, AlertTriangle, ClipboardList, ShoppingCart, CheckCircle2, XCircle, Search, History } from "lucide-react";
import { format } from "date-fns";

export default function PharmacyInventory() {
  const { user } = useAuth();
  const { data: pharmacy = [], isLoading } = usePharmacy();
  const { data: batches = [] } = useInventoryBatches();
  const { data: reorders = [] } = useReorderRequests();
  const updatePharmacy = useUpdatePharmacy();
  const addBatch = useAddInventoryBatch();
  const createReorder = useCreateReorderRequest();
  const updateReorder = useUpdateReorderRequest();

  const [searchTerm, setSearchTerm] = useState("");
  const [itemDialog, setItemDialog] = useState(false);
  const [batchDialog, setBatchDialog] = useState(false);
  const [reorderDialog, setReorderDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");

  const [itemForm, setItemForm] = useState({ name: "", category: "general", unit: "tablets", quantity: "0", min_stock_level: "5", supplier: "", reorder_level: "5", location: "", batch_number: "", expiry_date: "" });
  const [batchForm, setBatchForm] = useState({ pharmacy_item_id: "", batch_number: "", expiry_date: "", quantity: "0", unit_cost: "0", supplier: "", notes: "" });
  const [reorderForm, setReorderForm] = useState({ pharmacy_item_id: "", quantity_needed: "0", reason: "" });

  const filtered = pharmacy.filter(i =>
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStock = pharmacy.filter(i => i.quantity <= i.min_stock_level);
  const expiringSoon = batches.filter(b => {
    if (!b.expiry_date) return false;
    const days = (new Date(b.expiry_date).getTime() - Date.now()) / 86400000;
    return days > 0 && days <= 30;
  });

  const handleAddItem = async () => {
    if (!itemForm.name) { toast.error("Name is required"); return; }
    await updatePharmacy.mutateAsync({
      name: itemForm.name,
      category: itemForm.category,
      unit: itemForm.unit,
      quantity: parseInt(itemForm.quantity) || 0,
      min_stock_level: parseInt(itemForm.min_stock_level) || 5,
      supplier: itemForm.supplier || null,
      reorder_level: parseInt(itemForm.reorder_level) || 5,
      location: itemForm.location || null,
    });
    toast.success("Item added to inventory");
    setItemDialog(false);
    setItemForm({ name: "", category: "general", unit: "tablets", quantity: "0", min_stock_level: "5", supplier: "", reorder_level: "5", location: "", batch_number: "", expiry_date: "" });
  };

  const handleAddBatch = async () => {
    if (!batchForm.pharmacy_item_id || !batchForm.quantity) { toast.error("Item and quantity required"); return; }
    const qty = parseInt(batchForm.quantity) || 0;
    await addBatch.mutateAsync({
      pharmacy_item_id: batchForm.pharmacy_item_id,
      batch_number: batchForm.batch_number || null,
      expiry_date: batchForm.expiry_date || null,
      quantity: qty,
      unit_cost: parseFloat(batchForm.unit_cost) || 0,
      supplier: batchForm.supplier || null,
      notes: batchForm.notes || null,
    });
    // Also update the main item quantity
    const item = pharmacy.find(i => i.id === batchForm.pharmacy_item_id);
    if (item) {
      await updatePharmacy.mutateAsync({ id: item.id, quantity: (item.quantity || 0) + qty });
    }
    toast.success("Batch added and stock updated");
    setBatchDialog(false);
    setBatchForm({ pharmacy_item_id: "", batch_number: "", expiry_date: "", quantity: "0", unit_cost: "0", supplier: "", notes: "" });
  };

  const handleReorder = async () => {
    if (!reorderForm.pharmacy_item_id || !reorderForm.quantity_needed) { toast.error("Fill all fields"); return; }
    await createReorder.mutateAsync({
      pharmacy_item_id: reorderForm.pharmacy_item_id,
      quantity_needed: parseInt(reorderForm.quantity_needed),
      reason: reorderForm.reason || null,
      requested_by: user?.id,
    });
    toast.success("Reorder request created");
    setReorderDialog(false);
    setReorderForm({ pharmacy_item_id: "", quantity_needed: "0", reason: "" });
  };

  return (
    <DashboardLayout title="Pharmacy Inventory" subtitle="Full inventory tracking with batches, suppliers, and reorder management">
      {/* Alert Banner */}
      {(lowStock.length > 0 || expiringSoon.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-orange-700">{lowStock.length} items low on stock</span>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-700">{expiringSoon.length} batches expiring within 30 days</span>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="inventory">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="inventory" className="gap-2"><Package className="h-4 w-4" /> Stock</TabsTrigger>
            <TabsTrigger value="batches" className="gap-2"><History className="h-4 w-4" /> Batches</TabsTrigger>
            <TabsTrigger value="reorders" className="gap-2"><ShoppingCart className="h-4 w-4" /> Reorders</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setBatchDialog(true)}>
              <Plus className="h-4 w-4" /> Add Batch
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setReorderDialog(true)}>
              <ShoppingCart className="h-4 w-4" /> Request Reorder
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setItemDialog(true)}>
              <Plus className="h-4 w-4" /> New Item
            </Button>
          </div>
        </div>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Medical Stock</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-8 text-sm" placeholder="Search inventory..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>In Stock</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No items in inventory.</TableCell></TableRow>
                  ) : (
                    filtered.map(item => (
                      <TableRow key={item.id} className={item.quantity <= item.min_stock_level ? "bg-orange-50/50" : ""}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-xs capitalize">{item.category}</TableCell>
                        <TableCell className="font-bold">{item.quantity}</TableCell>
                        <TableCell className="text-xs">{item.min_stock_level}</TableCell>
                        <TableCell className="text-xs">{item.unit}</TableCell>
                        <TableCell className="text-xs">{item.supplier || "—"}</TableCell>
                        <TableCell className="text-xs">{item.location || "—"}</TableCell>
                        <TableCell>
                          {item.quantity <= item.min_stock_level ? (
                            <Badge className="bg-orange-100 text-orange-700 text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" /> Low
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Batches</CardTitle>
              <CardDescription>Track each shipment by batch number, expiry, and cost</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No batches recorded.</TableCell></TableRow>
                  ) : (
                    batches.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.item?.name}</TableCell>
                        <TableCell className="text-xs font-mono">{b.batch_number || "—"}</TableCell>
                        <TableCell>{b.quantity} {b.item?.unit}</TableCell>
                        <TableCell>{b.unit_cost ? `UGX ${b.unit_cost.toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-xs">
                          {b.expiry_date ? (
                            <span className={new Date(b.expiry_date) < new Date() ? "text-red-600 font-bold" : new Date(b.expiry_date) < new Date(Date.now() + 30*86400000) ? "text-amber-600" : ""}>
                              {format(new Date(b.expiry_date), "MMM d, yyyy")}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{b.supplier || "—"}</TableCell>
                        <TableCell className="text-xs">{b.received_date ? format(new Date(b.received_date), "MMM d") : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorders">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reorder Requests</CardTitle>
              <CardDescription>Track requests for restocking low inventory items</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty Needed</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorders.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No reorder requests.</TableCell></TableRow>
                  ) : (
                    reorders.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.item?.name}</TableCell>
                        <TableCell>{r.quantity_needed}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{r.reason || "—"}</TableCell>
                        <TableCell className="text-xs">{r.requester?.full_name || "—"}</TableCell>
                        <TableCell className="text-xs">{format(new Date(r.created_at), "MMM d")}</TableCell>
                        <TableCell>
                          <Badge className={
                            r.status === "pending" ? "bg-amber-100 text-amber-700" :
                            r.status === "approved" ? "bg-blue-100 text-blue-700" :
                            r.status === "ordered" ? "bg-purple-100 text-purple-700" :
                            r.status === "received" ? "bg-emerald-100 text-emerald-700" :
                            "bg-slate-100 text-slate-700"
                          }>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {r.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={async () => {
                                await updateReorder.mutateAsync({ id: r.id, status: "approved", approved_by: user?.id });
                                toast.success("Approved");
                              }}><CheckCircle2 className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 text-red-400" onClick={async () => {
                                await updateReorder.mutateAsync({ id: r.id, status: "cancelled" });
                                toast.success("Cancelled");
                              }}><XCircle className="h-3 w-3" /></Button>
                            </div>
                          )}
                          {r.status === "approved" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                              await updateReorder.mutateAsync({ id: r.id, status: "ordered" });
                              toast.success("Marked as ordered");
                            }}>Order</Button>
                          )}
                          {r.status === "ordered" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                              await updateReorder.mutateAsync({ id: r.id, status: "received" });
                              toast.success("Marked as received");
                            }}>Receive</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Pharmacy Item</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2"><Label>Name *</Label><Input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Paracetamol" /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={itemForm.category} onValueChange={v => setItemForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="antibiotic">Antibiotic</SelectItem><SelectItem value="painkiller">Painkiller</SelectItem><SelectItem value="first_aid">First Aid</SelectItem><SelectItem value="supplement">Supplement</SelectItem></SelectContent></Select></div>
            <div className="space-y2"><Label>Unit</Label><Select value={itemForm.unit} onValueChange={v => setItemForm(f => ({ ...f, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tablets">Tablets</SelectItem><SelectItem value="capsules">Capsules</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="mg">mg</SelectItem><SelectItem value="pieces">Pieces</SelectItem><SelectItem value="packs">Packs</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Initial Qty</Label><Input type="number" min="0" value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Min Stock Level</Label><Input type="number" min="0" value={itemForm.min_stock_level} onChange={e => setItemForm(f => ({ ...f, min_stock_level: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Supplier</Label><Input value={itemForm.supplier} onChange={e => setItemForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={itemForm.location} onChange={e => setItemForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Shelf A3" /></div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setItemDialog(false)}>Cancel</Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Batch Dialog */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Inventory Batch</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2"><Label>Item *</Label>
              <SearchableSelect
                options={pharmacy.map(i => ({ value: i.id, label: i.name, searchTerms: [i.name] }))}
                value={batchForm.pharmacy_item_id}
                onValueChange={v => setBatchForm(f => ({ ...f, pharmacy_item_id: v }))}
                placeholder="Select item..."
                searchPlaceholder="Search medication..."
              />
            </div>
            <div className="space-y-2"><Label>Batch #</Label><Input value={batchForm.batch_number} onChange={e => setBatchForm(f => ({ ...f, batch_number: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={batchForm.expiry_date} onChange={e => setBatchForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Quantity *</Label><Input type="number" min="1" value={batchForm.quantity} onChange={e => setBatchForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Unit Cost (UGX)</Label><Input type="number" min="0" value={batchForm.unit_cost} onChange={e => setBatchForm(f => ({ ...f, unit_cost: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Supplier</Label><Input value={batchForm.supplier} onChange={e => setBatchForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Notes</Label><Textarea value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBatchDialog(false)}>Cancel</Button>
              <Button onClick={handleAddBatch}>Add Batch</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={reorderDialog} onOpenChange={setReorderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Reorder</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Item *</Label>
              <SearchableSelect
                options={pharmacy.map(i => ({ value: i.id, label: `${i.name} (Stock: ${i.quantity} ${i.unit})`, searchTerms: [i.name, `${i.quantity}`, i.unit || ""] }))}
                value={reorderForm.pharmacy_item_id}
                onValueChange={v => setReorderForm(f => ({ ...f, pharmacy_item_id: v }))}
                placeholder="Select item..."
                searchPlaceholder="Search medication..."
              />
            </div>
            <div className="space-y-2"><Label>Quantity Needed *</Label><Input type="number" min="1" value={reorderForm.quantity_needed} onChange={e => setReorderForm(f => ({ ...f, quantity_needed: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Reason</Label><Textarea value={reorderForm.reason} onChange={e => setReorderForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why is this needed?" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReorderDialog(false)}>Cancel</Button>
              <Button onClick={handleReorder}>Create Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
