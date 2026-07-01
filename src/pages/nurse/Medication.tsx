import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePharmacy, useMedicationLogs, useDispenseMedication, useHealthVisits } from "@/hooks/useHealth";
import { Plus, Pill, Search, History, Package, Send, AlertCircle, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Medication = () => {
  const { data: pharmacy = [], isLoading: loadingPharmacy } = usePharmacy();
  const { data: logs = [], isLoading: loadingLogs } = useMedicationLogs();
  const { data: visits = [] } = useHealthVisits();
  const dispense = useDispenseMedication();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = useState(false);
  const [dispenseFormData, setDispenseFormData] = useState({
    item_id: "",
    visit_id: "",
    quantity: "1",
    dosage_instructions: "",
  });

  const activeVisits = Array.isArray(visits) ? visits.filter(v => v.status === "active") : [];

  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseFormData.item_id || !dispenseFormData.visit_id) {
      toast({ title: "Error", description: "Please select both medicine and clinic visit", variant: "destructive" });
      return;
    }
    
    const item = pharmacy.find(i => i.id === dispenseFormData.item_id);
    if (item && item.quantity < parseInt(dispenseFormData.quantity)) {
      toast({ title: "Insufficient Stock", description: `Only ${item.quantity} ${item.unit} left`, variant: "destructive" });
      return;
    }

    try {
      await dispense.mutateAsync({
        ...dispenseFormData,
        quantity: parseInt(dispenseFormData.quantity),
        dispensed_by: user?.id,
        dispensed_at: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Medication dispensed successfully" });
      setIsDispenseDialogOpen(false);
      setDispenseFormData({ item_id: "", visit_id: "", quantity: "1", dosage_instructions: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="Medication Register" subtitle="Dispensing & Pharmacy Control">
      <div className="space-y-6">
        <Tabs defaultValue="history" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" /> History
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2">
                <Package className="h-4 w-4" /> Inventory
              </TabsTrigger>
            </TabsList>
            
            <Dialog open={isDispenseDialogOpen} onOpenChange={setIsDispenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Send className="h-4 w-4" /> Dispense Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Dispense Medication</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleDispenseSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Active Clinic Visit</Label>
                    {activeVisits.length === 0 ? (
                      <Select>
                        <SelectTrigger><SelectValue placeholder="No active visits found" /></SelectTrigger>
                        <SelectContent><SelectItem value="_none" disabled>No active visits found</SelectItem></SelectContent>
                      </Select>
                    ) : (
                      <SearchableSelect
                        options={activeVisits.map(v => ({ value: v.id, label: `${v.learner?.full_name} (${v.diagnosis || "No diagnosis"})`, searchTerms: [v.learner?.full_name || "", v.diagnosis || ""] }))}
                        value={dispenseFormData.visit_id}
                        onValueChange={(v) => setDispenseFormData(prev => ({ ...prev, visit_id: v }))}
                        placeholder="Select student visit..."
                        searchPlaceholder="Search by student name..."
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Medicine</Label>
                    <SearchableSelect
                      options={pharmacy.map(i => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} available)`, searchTerms: [i.name, i.unit || ""] }))}
                      value={dispenseFormData.item_id}
                      onValueChange={(v) => setDispenseFormData(prev => ({ ...prev, item_id: v }))}
                      placeholder="Select medicine..."
                      searchPlaceholder="Search medication..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity to Dispense</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={dispenseFormData.quantity} 
                      onChange={(e) => setDispenseFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage Instructions</Label>
                    <Textarea 
                      placeholder="e.g. 2 tabs, 3 times daily after food" 
                      value={dispenseFormData.dosage_instructions}
                      onChange={(e) => setDispenseFormData(prev => ({ ...prev, dosage_instructions: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={dispense.isPending}>
                    {dispense.isPending ? "Processing..." : "Confirm Dispensing"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dispensing Logs</CardTitle>
                <CardDescription>Track every medication issued to students</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="py-10 text-center">Loading logs...</div>
                ) : logs.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed rounded-lg">
                    <History className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No medication logs found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Dispensed By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.visit?.learner?.full_name || "Unknown Patient"}
                            </TableCell>
                            <TableCell>{log.pharmacy_item?.name}</TableCell>
                            <TableCell>{log.quantity} {log.pharmacy_item?.unit}</TableCell>
                            <TableCell className="max-w-[200px] text-xs truncate">
                              {log.dosage_instructions || "—"}
                            </TableCell>
                            <TableCell className="text-xs">{log.dispenser?.full_name}</TableCell>
                            <TableCell className="text-xs">
                              {format(new Date(log.dispensed_at), "MMM d, h:mm a")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pharmacy Inventory</CardTitle>
                <CardDescription>Current stock levels in the sick bay pharmacy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pharmacy.map((item) => (
                    <Card key={item.id} className={item.quantity <= item.min_stock_level ? "border-orange-500 bg-orange-50/10" : ""}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold">{item.name}</h3>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                          {item.quantity <= item.min_stock_level && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 gap-1">
                              <AlertCircle className="h-3 w-3" /> Low Stock
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <div>
                            <p className="text-2xl font-bold">{item.quantity}</p>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </div>
                          <Badge variant="secondary">{item.batch_number || "No Batch"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Medication;
