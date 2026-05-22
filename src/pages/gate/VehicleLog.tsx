// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useVehicleLogs, useCreateVehicleLog, useUpdateVehicleExit } from "@/hooks/useGate";
import { Car, Search, Plus, LogOut, Clock, User, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const VehicleLog = () => {
  const { data: logs = [], isLoading } = useVehicleLogs();
  const createEntry = useCreateVehicleLog();
  const updateExit = useUpdateVehicleExit();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    plate_number: "",
    driver_name: "",
    phone_number: "",
    purpose: "",
    vehicle_type: "Car",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEntry.mutateAsync({
        ...formData,
        recorded_by: user?.id,
        entry_time: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Vehicle entry logged" });
      setIsDialogOpen(false);
      setFormData({ plate_number: "", driver_name: "", phone_number: "", purpose: "", vehicle_type: "Car", notes: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleExit = async (id: string) => {
    try {
      await updateExit.mutateAsync({ id, exit_time: new Date().toISOString() });
      toast({ title: "Success", description: "Vehicle exit logged" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredLogs = logs.filter(l => 
    l.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Vehicle Log" subtitle="Gate Security & Traffic Monitoring">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by plate or driver..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Log Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vehicle Entry Registration</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plate Number</Label>
                    <Input 
                      required 
                      placeholder="e.g. UAX 123G" 
                      value={formData.plate_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_type: v }))} defaultValue="Car">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Car">Car / SUV</SelectItem>
                        <SelectItem value="Truck">Truck / Delivery</SelectItem>
                        <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="School Bus">School Bus</SelectItem>
                        <SelectItem value="Staff Car">Staff Car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Driver Name</Label>
                  <Input 
                    placeholder="Enter full name" 
                    value={formData.driver_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, driver_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    placeholder="e.g. +256 700..." 
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purpose of Visit</Label>
                  <Input 
                    placeholder="e.g. Delivery, Pick student, Official" 
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createEntry.isPending}>
                  {createEntry.isPending ? "Logging..." : "Confirm Entry"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Traffic Log</CardTitle>
            <CardDescription>Real-time list of vehicles inside and recently left the premises</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center">Loading vehicle logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-lg space-y-2">
                <Car className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">No vehicles logged today.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Plate & Type</TableHead>
                      <TableHead>Driver Info</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="uppercase">{log.plate_number}</span>
                            <span className="text-xs text-muted-foreground italic">{log.vehicle_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{log.driver_name || "—"}</span>
                            <span className="text-xs text-muted-foreground">{log.phone_number || ""}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{log.purpose || "Official"}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(log.entry_time), "h:mm a")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.exit_time ? format(new Date(log.exit_time), "h:mm a") : "—"}
                        </TableCell>
                        <TableCell>
                          {log.exit_time ? (
                            <Badge variant="secondary">Exited</Badge>
                          ) : (
                            <Badge className="bg-green-600">Inside</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!log.exit_time && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs gap-1"
                              onClick={() => handleExit(log.id)}
                            >
                              <LogOut className="h-3 w-3" /> Log Exit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VehicleLog;
