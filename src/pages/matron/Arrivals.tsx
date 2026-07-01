// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plane, Search, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Arrivals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState<any>(null);
  const [checkinForm, setCheckinForm] = useState({
    weight: "",
    height: "",
    health_status: "",
    chronic_disease_history: "",
    school_uniforms: 0,
    sweater: 0,
    shoes: 0,
    stockings: 0,
    track_suits: 0,
    vests: 0,
    casual_wears: 0,
    cap_veils: 0,
    underwear_pants: 0,
    kanzu_hijab: 0,
    matron_notes: "",
    dormitory_number: "",
  });

  const { data: clearances = [], isLoading } = useQuery({
    queryKey: ["matron-arrivals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("holiday_arrival_clearances")
        .select("*, learner:learners(full_name, admission_number, class_name, gender)")
        .order("arrival_date", { ascending: false });
      return data || [];
    },
  });

  const { data: dormitories = [] } = useQuery({
    queryKey: ["matron-dormitories-arrivals"],
    queryFn: async () => {
      const { data } = await supabase.from("dormitories").select("id, name, gender").order("name");
      return data || [];
    },
  });

  const updateArrival = useMutation({
    mutationFn: async ({ id, ...values }: Record<string, any>) => {
      const { error } = await supabase
        .from("holiday_arrival_clearances")
        .update({ ...values, matron_status: "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matron-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["matron-stats"] });
      toast({ title: "Approved", description: "Arrival clearance approved" });
      setIsDialogOpen(false);
      setSelectedClearance(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pendingClearances = clearances.filter((c) => c.matron_status === "pending");
  const completedClearances = clearances.filter((c) => c.matron_status === "approved");

  const filteredPending = pendingClearances.filter((c) =>
    c.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.learner?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = completedClearances.filter((c) =>
    c.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.learner?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCheckin = (clearance: any) => {
    setSelectedClearance(clearance);
    setCheckinForm({
      weight: clearance.weight || "",
      height: clearance.height || "",
      health_status: clearance.health_status || "",
      chronic_disease_history: clearance.chronic_disease_history || "",
      school_uniforms: clearance.school_uniforms || 0,
      sweater: clearance.sweater || 0,
      shoes: clearance.shoes || 0,
      stockings: clearance.stockings || 0,
      track_suits: clearance.track_suits || 0,
      vests: clearance.vests || 0,
      casual_wears: clearance.casual_wears || 0,
      cap_veils: clearance.cap_veils || 0,
      underwear_pants: clearance.underwear_pants || 0,
      kanzu_hijab: clearance.kanzu_hijab || 0,
      matron_notes: clearance.matron_notes || "",
      dormitory_number: clearance.dormitory_number || "",
    });
    setIsDialogOpen(true);
  };

  const handleCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClearance) return;
    updateArrival.mutate({
      id: selectedClearance.id,
      ...checkinForm,
      weight: checkinForm.weight || null,
      height: checkinForm.height || null,
    });
  };

  return (
    <DashboardLayout title="Holiday Arrivals" subtitle="Process learner arrival clearances">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by learner name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="h-5 w-5 text-amber-500" />
              Pending Arrivals
              <Badge variant="secondary" className="ml-2">{pendingClearances.length}</Badge>
            </CardTitle>
            <CardDescription>Arrivals awaiting matron check-in and approval</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPending.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-muted-foreground text-sm">All arrivals have been processed.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Arrival Date</TableHead>
                      <TableHead>Dormitory</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((c) => {
                      const itemCount =
                        (c.school_uniforms || 0) + (c.sweater || 0) + (c.shoes || 0) +
                        (c.stockings || 0) + (c.track_suits || 0) + (c.vests || 0) +
                        (c.casual_wears || 0) + (c.cap_veils || 0) + (c.underwear_pants || 0) +
                        (c.kanzu_hijab || 0);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{c.learner?.full_name}</span>
                              <span className="text-xs text-muted-foreground">{c.learner?.admission_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>{c.learner?.class_name || "—"}</TableCell>
                          <TableCell>{format(new Date(c.arrival_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{c.proposed_dormitory || c.dormitory_number || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{itemCount} items</Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" className="gap-1" onClick={() => openCheckin(c)}>
                              <ClipboardList className="h-3.5 w-3.5" /> Check-in
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {completedClearances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Approved Arrivals
              </CardTitle>
              <CardDescription>Completed matron check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Arrival Date</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompleted.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{c.learner?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{c.learner?.admission_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>{c.learner?.class_name || "—"}</TableCell>
                        <TableCell>{format(new Date(c.arrival_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{c.weight || "—"}</TableCell>
                        <TableCell>
                          {c.health_status ? (
                            <Badge variant={c.health_status === "good" ? "default" : "destructive"} className="text-[10px]">
                              {c.health_status}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500 text-[10px]">Approved</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Arrival Check-in — {selectedClearance?.learner?.full_name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckin} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="text"
                  placeholder="e.g. 45"
                  value={checkinForm.weight}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="text"
                  placeholder="e.g. 150"
                  value={checkinForm.height}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dormitory Number</Label>
                <Input
                  placeholder="e.g. Dorm A"
                  value={checkinForm.dormitory_number}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, dormitory_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select
                  onValueChange={(v) => setCheckinForm(prev => ({ ...prev, health_status: v }))}
                  value={checkinForm.health_status || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Chronic Disease History</Label>
                <Input
                  placeholder="Any known conditions..."
                  value={checkinForm.chronic_disease_history}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, chronic_disease_history: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <p className="font-bold text-sm mb-3">Essential Items Inventory</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: "school_uniforms", label: "Uniforms" },
                  { key: "sweater", label: "Sweater" },
                  { key: "shoes", label: "Shoes" },
                  { key: "stockings", label: "Stockings" },
                  { key: "track_suits", label: "Track Suits" },
                  { key: "vests", label: "Vests" },
                  { key: "casual_wears", label: "Casual Wears" },
                  { key: "cap_veils", label: "Caps/Veils" },
                  { key: "underwear_pants", label: "Underwear" },
                  { key: "kanzu_hijab", label: "Kanzu/Hijab" },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-[10px]">{item.label}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={checkinForm[item.key]}
                      onChange={(e) => setCheckinForm(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Matron Notes</Label>
              <Textarea
                placeholder="Any observations during check-in..."
                value={checkinForm.matron_notes}
                onChange={(e) => setCheckinForm(prev => ({ ...prev, matron_notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateArrival.isPending}>
                {updateArrival.isPending ? "Approving..." : "Approve Arrival"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Arrivals;
