// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePrescriptions, useCreatePrescription, useDispensePrescription } from "@/hooks/usePharmacyAdvanced";
import { useLearners } from "@/hooks/useLearners";
import { usePharmacy } from "@/hooks/useHealth";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Search, Pill, CheckCircle2, XCircle, Calendar, User, Stethoscope, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Prescriptions() {
  const { user } = useAuth();
  const { data: learners = [] } = useLearners();
  const { data: pharmacy = [] } = usePharmacy();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: prescriptions = [], isLoading } = usePrescriptions(statusFilter !== "all" ? { status: statusFilter } : undefined);

  const createRx = useCreatePrescription();
  const dispenseRx = useDispensePrescription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    learner_id: "",
    doctor_name: "",
    diagnosis: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "1",
    pharmacy_item_id: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (!form.learner_id || !form.medication) {
      toast.error("Learner and medication are required");
      return;
    }
    await createRx.mutateAsync({
      learner_id: form.learner_id,
      doctor_name: form.doctor_name || null,
      diagnosis: form.diagnosis || null,
      medication: form.medication,
      dosage: form.dosage || null,
      frequency: form.frequency || null,
      duration: form.duration || null,
      quantity: parseInt(form.quantity) || 1,
      pharmacy_item_id: form.pharmacy_item_id || null,
      notes: form.notes || null,
      prescribed_by: user?.id,
    });
    toast.success("Prescription created");
    setDialogOpen(false);
    setForm({ learner_id: "", doctor_name: "", diagnosis: "", medication: "", dosage: "", frequency: "", duration: "", quantity: "1", pharmacy_item_id: "", notes: "" });
  };

  const filtered = prescriptions.filter(p =>
    p.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medication?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Prescriptions" subtitle="Full prescription management - create, dispense, and track">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search prescriptions..." className="pl-9 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="dispensed">Dispensed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Prescription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Prescription Register</CardTitle>
          <CardDescription>All prescriptions ordered and dispensed</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl space-y-2">
              <Pill className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">No prescriptions found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(rx => (
                  <TableRow key={rx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{rx.learner?.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{rx.learner?.class_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{rx.medication}</TableCell>
                    <TableCell className="text-xs">{rx.dosage || "—"}</TableCell>
                    <TableCell className="text-xs">{rx.frequency || "—"}</TableCell>
                    <TableCell className="text-xs">{rx.doctor_name || rx.prescriber?.full_name || "—"}</TableCell>
                    <TableCell className="text-xs">{format(new Date(rx.prescribed_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={
                        rx.status === "active" ? "bg-amber-100 text-amber-700" :
                        rx.status === "dispensed" ? "bg-blue-100 text-blue-700" :
                        rx.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-700"
                      }>
                        {rx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rx.status === "active" && (
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={async () => {
                          await dispenseRx.mutateAsync({ id: rx.id, dispensed_date: new Date().toISOString() });
                          toast.success("Marked as dispensed");
                        }}>
                          <CheckCircle2 className="h-3 w-3" /> Dispense
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> New Prescription</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2">
              <Label>Learner</Label>
              <SearchableSelect
                options={learners.map(l => ({ value: l.id, label: `${l.full_name} (${l.admission_number})`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                value={form.learner_id}
                onValueChange={v => setForm(f => ({ ...f, learner_id: v }))}
                placeholder="Select learner..."
                searchPlaceholder="Search by name or admission..."
              />
            </div>
            <div className="space-y-2">
              <Label>Doctor Name</Label>
              <Input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} placeholder="Dr. ..." />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Malaria" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Medication *</Label>
              <Input value={form.medication} onChange={e => setForm(f => ({ ...f, medication: e.target.value }))} placeholder="e.g. Artemether-Lumefantrine" />
            </div>
            <div className="space-y-2">
              <Label>Dosage</Label>
              <Input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 2 tabs" />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. 3x daily" />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 7 days" />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Pharmacy Item (optional)</Label>
              <SearchableSelect
                options={pharmacy.map(i => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit})`, searchTerms: [i.name, i.unit || ""] }))}
                value={form.pharmacy_item_id}
                onValueChange={v => setForm(f => ({ ...f, pharmacy_item_id: v }))}
                placeholder="Link to inventory item..."
                searchPlaceholder="Search medication..."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional instructions..." />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createRx.isPending}>Create Prescription</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
