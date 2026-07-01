// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePharmacy } from "@/hooks/useHealth";
import { usePrescriptions, usePharmacyEmergencies, useCreatePharmacyEmergency, useUpdatePharmacyEmergency } from "@/hooks/usePharmacyAdvanced";
import { useHealthVisits } from "@/hooks/useHealth";
import { useLearners } from "@/hooks/useLearners";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BarChart3, AlertTriangle, Heart, Activity, Pill, TrendingUp, Users, Ambulance, CheckCircle2, Clock } from "lucide-react";
import { format, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export default function PharmacyReports() {
  const { user } = useAuth();
  const { data: learners = [] } = useLearners();
  const { data: pharmacy = [] } = usePharmacy();
  const { data: prescriptions = [] } = usePrescriptions();
  const { data: emergencies = [], refetch: refetchEmergencies } = usePharmacyEmergencies();
  const { data: visits = [] } = useHealthVisits();
  const createEmergency = useCreatePharmacyEmergency();
  const updateEmergency = useUpdatePharmacyEmergency();

  const [emergencyDialog, setEmergencyDialog] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    learner_id: "", emergency_type: "allergic_reaction", description: "", action_taken: "", medication_administered: "", referred_to: "",
  });

  const totalDispensed = prescriptions.filter(p => p.status === "dispensed" || p.status === "completed").length;
  const activePrescriptions = prescriptions.filter(p => p.status === "active").length;
  const lowStockCount = pharmacy.filter(i => i.quantity <= i.min_stock_level).length;
  const totalStockValue = pharmacy.reduce((sum, i) => sum + (i.quantity || 0) * (i.unit_cost || 0), 0);
  const visitsThisWeek = visits.filter(v => new Date(v.visit_date) >= subDays(new Date(), 7)).length;
  const activeEmergencies = emergencies.filter(e => e.status === "active").length;

  // Monthly dispensing trend
  const { data: monthlyData = [] } = useQuery({
    queryKey: ["monthly-dispensing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medication_logs")
        .select("dispensed_at, quantity")
        .gte("dispensed_at", subDays(new Date(), 30).toISOString());
      const counts = {};
      (data || []).forEach(log => {
        const day = format(new Date(log.dispensed_at), "MMM d");
        counts[day] = (counts[day] || 0) + (log.quantity || 1);
      });
      return Object.entries(counts).slice(-14).map(([date, qty]) => ({ date, qty }));
    },
  });

  const handleEmergencySubmit = async () => {
    if (!emergencyForm.learner_id || !emergencyForm.emergency_type) {
      toast.error("Learner and emergency type are required");
      return;
    }
    await createEmergency.mutateAsync({
      learner_id: emergencyForm.learner_id,
      emergency_type: emergencyForm.emergency_type,
      description: emergencyForm.description || null,
      action_taken: emergencyForm.action_taken || null,
      medication_administered: emergencyForm.medication_administered || null,
      referred_to: emergencyForm.referred_to || null,
      reported_by: user?.id,
    });
    toast.success("Emergency reported - all concerned parties notified");
    setEmergencyDialog(false);
    setEmergencyForm({ learner_id: "", emergency_type: "allergic_reaction", description: "", action_taken: "", medication_administered: "", referred_to: "" });
    refetchEmergencies();
  };

  return (
    <DashboardLayout title="Pharmacy Reports & Emergency Response" subtitle="Health analytics, dispensing trends, and emergency action center">
      {/* Emergency Banner */}
      {activeEmergencies > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800">{activeEmergencies} Active Emergency/Incident{activeEmergencies > 1 ? 's' : ''}</p>
              <p className="text-xs text-red-600">Immediate attention required</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setEmergencyDialog(true)}>New Emergency</Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Pill className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Dispensed</p><p className="text-2xl font-bold">{totalDispensed}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Clock className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Active Rx</p><p className="text-2xl font-bold">{activePrescriptions}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-orange-600">{lowStockCount}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Activity className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Visits (7d)</p><p className="text-2xl font-bold">{visitsThisWeek}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emergencies">
        <TabsList className="mb-4">
          <TabsTrigger value="emergencies" className="gap-2"><AlertTriangle className="h-4 w-4" /> Emergencies</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="inventory-report" className="gap-2"><TrendingUp className="h-4 w-4" /> Stock Report</TabsTrigger>
        </TabsList>

        {/* ─── EMERGENCIES TAB ─── */}
        <TabsContent value="emergencies">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" /> Emergency Log</CardTitle>
                  <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700" onClick={() => setEmergencyDialog(true)}>
                    <Ambulance className="h-4 w-4" /> New Emergency
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencies.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">No emergencies logged.</p>
                ) : (
                  emergencies.map(e => (
                    <Card key={e.id} className={e.status === "active" ? "border-red-200 bg-red-50/30" : e.status === "stabilized" ? "border-amber-200 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${e.status === "active" ? "bg-red-100 text-red-600" : e.status === "stabilized" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                              <Heart className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{e.learner?.full_name} <span className="text-muted-foreground font-normal">({e.learner?.class_name})</span></p>
                              <Badge className="text-[10px] capitalize">{e.emergency_type.replace("_", " ")}</Badge>
                            </div>
                          </div>
                          <Badge className={
                            e.status === "active" ? "bg-red-100 text-red-700" :
                            e.status === "stabilized" ? "bg-amber-100 text-amber-700" :
                            e.status === "referred" ? "bg-purple-100 text-purple-700" :
                            "bg-emerald-100 text-emerald-700"
                          }>{e.status}</Badge>
                        </div>
                        {e.description && <p className="text-xs mt-2 text-muted-foreground">{e.description}</p>}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(e.created_at), "MMM d, HH:mm")}</span>
                          {e.action_taken && <><span>·</span><span>Action: {e.action_taken}</span></>}
                          {e.medication_administered && <><span>·</span><span>Med: {e.medication_administered}</span></>}
                        </div>
                        {e.status === "active" && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                              await updateEmergency.mutateAsync({ id: e.id, status: "stabilized" });
                              toast.success("Marked as stabilized");
                              refetchEmergencies();
                            }}>Stabilized</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                              await updateEmergency.mutateAsync({ id: e.id, status: "referred" });
                              toast.success("Marked as referred");
                              refetchEmergencies();
                            }}>Referred</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                              await updateEmergency.mutateAsync({ id: e.id, status: "resolved" });
                              toast.success("Resolved");
                              refetchEmergencies();
                            }}>Resolved</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="text-emerald-400 text-sm">Emergency Kit Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Adrenaline", stock: 3, min: 2 },
                    { name: "Antihistamine", stock: 8, min: 5 },
                    { name: "Oxygen Cylinder", stock: 1, min: 1 },
                    { name: "First Aid Dressings", stock: 25, min: 10 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{item.name}</span>
                        <span className={item.stock <= item.min ? "text-red-400 font-bold" : "text-emerald-400"}>{item.stock} units</span>
                      </div>
                      <Progress value={(item.stock / 30) * 100} className={`h-1.5 ${item.stock <= item.min ? "bg-red-500" : "bg-emerald-500"}`} />
                    </div>
                  ))}
                  <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-xs" size="sm" onClick={() => setEmergencyDialog(true)}>
                    Report Emergency
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Ambulance</span><span className="font-bold">+256 700 000 000</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">District Hospital</span><span className="font-bold">+256 701 000 000</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Nurse on Duty</span><span className="font-bold">Ext. 123</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Head Teacher</span><span className="font-bold">Ext. 101</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── ANALYTICS TAB ─── */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Dispensing Trend (14 days)</CardTitle></CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">No dispensing data for this period.</p>
                ) : (
                  <div className="space-y-2">
                    {monthlyData.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">{d.date}</span>
                        <Progress value={Math.min((d.qty / Math.max(...monthlyData.map(x => x.qty))) * 100, 100)} className="h-5 bg-slate-100" />
                        <span className="text-xs font-bold w-8 text-right">{d.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Visit Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Total Visits All Time", value: visits.length, color: "bg-blue-500" },
                  { label: "This Week", value: visitsThisWeek, color: "bg-emerald-500" },
                  { label: "Emergency Cases", value: emergencies.length, color: "bg-red-500" },
                  { label: "Avg Visits/Day (7d)", value: Math.round(visitsThisWeek / 7), color: "bg-purple-500" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-xl font-bold">{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Common Diagnoses</CardTitle></CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No data yet.</p>
                ) : (
                  (() => {
                    const counts = {};
                    visits.forEach(v => { if (v.diagnosis) counts[v.diagnosis] = (counts[v.diagnosis] || 0) + 1; });
                    const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10);
                    return (
                      <div className="space-y-2">
                        {sorted.map(([dx, count]: any, i) => (
                          <div key={i} className="flex items-center justify-between p-2 border-b text-sm">
                            <span>{dx}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Prescription Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="font-medium">Active Prescriptions</span>
                  <span className="font-bold text-amber-700">{activePrescriptions}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="font-medium">Dispensed</span>
                  <span className="font-bold text-blue-700">{totalDispensed}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="font-medium">Completed/Cleared</span>
                  <span className="font-bold text-emerald-700">{prescriptions.filter(p => p.status === "completed").length}</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-xl">
                  <span className="font-medium">Cancelled</span>
                  <span className="font-bold text-red-700">{prescriptions.filter(p => p.status === "cancelled").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── STOCK REPORT TAB ─── */}
        <TabsContent value="inventory-report">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Stock Status Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="font-medium">Items Well Stocked</span>
                  <span className="font-bold text-emerald-700">{pharmacy.filter(i => i.quantity > i.min_stock_level).length}</span>
                </div>
                <div className="flex justify-between p-3 bg-orange-50 rounded-xl">
                  <span className="font-medium">Low Stock Items</span>
                  <span className="font-bold text-orange-700">{lowStockCount}</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-xl">
                  <span className="font-medium">Out of Stock</span>
                  <span className="font-bold text-red-700">{pharmacy.filter(i => i.quantity <= 0).length}</span>
                </div>
                <div className="flex justify-between p-3 bg-purple-50 rounded-xl">
                  <span className="font-medium">Total Items</span>
                  <span className="font-bold text-purple-700">{pharmacy.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Low Stock Items Requiring Reorder</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {lowStockCount === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">All items well stocked.</p>
                ) : (
                  pharmacy.filter(i => i.quantity <= i.min_stock_level).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Stock: {item.quantity} {item.unit} | Min: {item.min_stock_level}</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700">{item.quantity} left</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Emergency Dialog */}
      <Dialog open={emergencyDialog} onOpenChange={setEmergencyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ambulance className="h-5 w-5" /> Report Emergency / Incident
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2">
              <Label>Learner *</Label>
              <SearchableSelect
                options={learners.map(l => ({ value: l.id, label: `${l.full_name} (${l.admission_number})`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                value={emergencyForm.learner_id}
                onValueChange={v => setEmergencyForm(f => ({ ...f, learner_id: v }))}
                placeholder="Select learner..."
                searchPlaceholder="Search by name or admission..."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Emergency Type *</Label>
              <Select value={emergencyForm.emergency_type} onValueChange={v => setEmergencyForm(f => ({ ...f, emergency_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="allergic_reaction">Allergic Reaction</SelectItem>
                  <SelectItem value="asthma_attack">Asthma Attack</SelectItem>
                  <SelectItem value="fever_emergency">High Fever Emergency</SelectItem>
                  <SelectItem value="injury_trauma">Injury / Trauma</SelectItem>
                  <SelectItem value="seizure">Seizure</SelectItem>
                  <SelectItem value="poisoning">Poisoning</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={emergencyForm.description} onChange={e => setEmergencyForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what happened..." />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Action Taken</Label>
              <Textarea value={emergencyForm.action_taken} onChange={e => setEmergencyForm(f => ({ ...f, action_taken: e.target.value }))} placeholder="First aid, CPR, etc." />
            </div>
            <div className="space-y-2">
              <Label>Medication Administered</Label>
              <Input value={emergencyForm.medication_administered} onChange={e => setEmergencyForm(f => ({ ...f, medication_administered: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Referred To</Label>
              <Select value={emergencyForm.referred_to} onValueChange={v => setEmergencyForm(f => ({ ...f, referred_to: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="health_center">Health Center</SelectItem>
                  <SelectItem value="parent_guardian">Parent/Guardian</SelectItem>
                  <SelectItem value="none">Not Referred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEmergencyDialog(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleEmergencySubmit} disabled={createEmergency.isPending}>
                Report Emergency
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
