// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useVehicleLogs, useCreateVehicleLog, useUpdateVehicleExit } from "@/hooks/useGate";
import { Car, Search, Plus, LogOut, Clock, User, Phone, MapPin, Truck, Shield, ArrowRightFromLine } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const vehicleIcons = {
  "Car": "🚗",
  "Truck": "🚛",
  "Motorcycle": "🏍️",
  "School Bus": "🚌",
  "Staff Car": "🚙",
};

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
    if (!formData.plate_number.trim()) {
      toast({ title: "Plate number required", variant: "destructive" });
      return;
    }
    try {
      await createEntry.mutateAsync({
        ...formData,
        recorded_by: user?.id,
        entry_time: new Date().toISOString(),
      });
      toast({ title: "Vehicle Entry Logged", description: `${formData.plate_number.toUpperCase()} — ${formData.driver_name || "No driver"} entered at ${format(new Date(), "h:mm a")}` });
      setIsDialogOpen(false);
      setFormData({ plate_number: "", driver_name: "", phone_number: "", purpose: "", vehicle_type: "Car", notes: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleExit = async (id: string, plate: string) => {
    try {
      await updateExit.mutateAsync({ id, exit_time: new Date().toISOString() });
      toast({ title: "Vehicle Exit Logged", description: `${plate.toUpperCase()} has left the premises` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredLogs = logs.filter(l =>
    l.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = logs.filter(l => !l.exit_time).length;

  return (
    <DashboardLayout title="Vehicle Log" subtitle="Gate Security & Traffic Monitoring">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Today</p>
                <p className="text-2xl font-black">{logs.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white border-none">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ArrowRightFromLine className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Currently Inside</p>
                <p className="text-2xl font-black">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-900 to-amber-800 text-white border-none">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Truck className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Deliveries</p>
                <p className="text-2xl font-black">{logs.filter(l => l.purpose?.toLowerCase().includes("delivery")).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white border-none">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Staff Vehicles</p>
                <p className="text-2xl font-black">{logs.filter(l => l.vehicle_type === "Staff Car").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by plate or driver..."
              className="pl-9 h-11 rounded-xl border-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 rounded-xl px-6 shadow-lg">
                <Plus className="h-5 w-5" /> Vehicle Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Vehicle Entry Registration</DialogTitle>
                    <DialogDescription>Record incoming vehicle at the gate</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plate Number *</Label>
                    <div className="relative">
                      <Input
                        required
                        placeholder="e.g. UAX 123G"
                        className="pl-9 h-11 rounded-xl border-2 uppercase font-mono font-bold tracking-wider"
                        value={formData.plate_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vehicle Type</Label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_type: v }))} defaultValue="Car">
                      <SelectTrigger className="h-11 rounded-xl border-2">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Driver Name</Label>
                    <div className="relative">
                      <Input
                        placeholder="Enter full name"
                        className="pl-9 h-11 rounded-xl border-2"
                        value={formData.driver_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, driver_name: e.target.value }))}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number</Label>
                    <div className="relative">
                      <Input
                        placeholder="e.g. +256 700..."
                        className="pl-9 h-11 rounded-xl border-2"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purpose of Visit</Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. Delivery, Pick student, Official"
                      className="pl-9 h-11 rounded-xl border-2"
                      value={formData.purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <Separator />

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Gate Entry Summary</p>
                      <p className="text-white text-lg font-black mt-1">
                        {formData.plate_number ? formData.plate_number.toUpperCase() : "No Plate"}
                      </p>
                      <p className="text-white/60 text-xs">{formData.driver_name || "No driver"} — {formData.vehicle_type}</p>
                    </div>
                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">{vehicleIcons[formData.vehicle_type] || "🚗"}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 gap-3"
                  disabled={createEntry.isPending}
                >
                  {createEntry.isPending ? (
                    <>Logging Entry...</>
                  ) : (
                    <><Car className="h-5 w-5" /> Confirm Entry</>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              Daily Traffic Log
            </CardTitle>
            <CardDescription>Real-time list of vehicles inside and recently left the premises</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">Loading vehicle logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-lg space-y-2 mx-6 my-6">
                <Car className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No vehicles logged today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plate & Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Driver Info</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purpose</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entry</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exit</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="group hover:bg-slate-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{vehicleIcons[log.vehicle_type] || "🚗"}</span>
                            <div>
                              <span className="font-bold uppercase text-sm">{log.plate_number}</span>
                              <p className="text-[10px] text-muted-foreground">{log.vehicle_type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.driver_name || "—"}</span>
                            {log.phone_number && (
                              <span className="text-xs text-muted-foreground">{log.phone_number}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{log.purpose || "Official"}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold">{format(new Date(log.entry_time), "h:mm a")}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(log.entry_time), { addSuffix: true })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.exit_time ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold">{format(new Date(log.exit_time), "h:mm a")}</span>
                              <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(log.exit_time), { addSuffix: true })}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.exit_time ? (
                            <Badge variant="secondary" className="text-[10px] rounded-lg">Exited</Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white text-[10px] rounded-lg">Inside</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!log.exit_time && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleExit(log.id, log.plate_number)}
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
