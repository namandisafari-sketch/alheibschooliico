// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHealthVisits, useCreateHealthVisit } from "@/hooks/useHealth";
import { Plus, Activity, Search, Clock, User, Thermometer, Filter, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLearners } from "@/hooks/useLearners";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Clinic = () => {
  const { data: visits = [], isLoading } = useHealthVisits();
  const { data: learners = [] } = useLearners();
  const createVisit = useCreateHealthVisit();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  // Fetch medical info for selected student
  const { data: medicalInfo, isLoading: loadingMedical } = useQuery({
    queryKey: ["learner-medical", selectedLearnerId],
    queryFn: async () => {
      if (!selectedLearnerId) return null;
      const { data, error } = await supabase
        .from("learner_medical")
        .select("*")
        .eq("learner_id", selectedLearnerId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || { 
        blood_group: "Unknown", 
        allergies: [], 
        chronic_conditions: [], 
        special_needs: "None recorded" 
      };
    },
    enabled: !!selectedLearnerId
  });

  const [formData, setFormData] = useState({
    learner_id: "",
    visit_type: "illness",
    priority: "low",
    symptoms: "",
    temperature: "",
    diagnosis: "",
    treatment_plan: "",
    action_taken: "",
  });

  const filteredVisits = Array.isArray(visits) ? visits.filter(v => 
    v.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.learner_id) {
      toast({ title: "Error", description: "Please select a student", variant: "destructive" });
      return;
    }
    try {
      await createVisit.mutateAsync({
        ...formData,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        recorded_by: user?.id,
        visit_date: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Clinic visit recorded successfully" });
      setIsDialogOpen(false);
      setFormData({
        learner_id: "",
        visit_type: "illness",
        priority: "low",
        symptoms: "",
        temperature: "",
        diagnosis: "",
        treatment_plan: "",
        action_taken: "",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500">High</Badge>;
      case "medium": return <Badge variant="secondary">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <DashboardLayout title="Clinic Management" subtitle="School Sick Bay & Student Health Log">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by student or diagnosis..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Log Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Clinic Visit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Student</Label>
                  <Select onValueChange={(v) => {
                    setFormData(prev => ({ ...prev, learner_id: v }));
                    setSelectedLearnerId(v);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose student" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(learners) && learners.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.admission_number})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedLearnerId && (
                    <Card className="bg-blue-50 border-blue-200 mt-2">
                       <CardContent className="p-3 text-xs space-y-2">
                          <p className="font-bold text-blue-700 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Medical Alert Details
                          </p>
                          {loadingMedical ? <p>Loading bio...</p> : (
                            <div className="grid grid-cols-2 gap-2">
                               <div>
                                 <p className="text-muted-foreground font-medium">Blood Group</p>
                                 <p className="font-bold">{medicalInfo?.blood_group || "Unknown"}</p>
                               </div>
                               <div>
                                 <p className="text-muted-foreground font-medium">Allergies</p>
                                 <p className="text-rose-600 font-bold">{medicalInfo?.allergies?.join(", ") || "None"}</p>
                               </div>
                               <div className="col-span-2">
                                 <p className="text-muted-foreground font-medium">Chronic Conditions</p>
                                 <p className="font-semibold text-amber-700">{medicalInfo?.chronic_conditions?.join(", ") || "None"}</p>
                               </div>
                            </div>
                          )}
                       </CardContent>
                    </Card>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Visit Type</Label>
                  <Select onValueChange={(v) => setFormData(prev => ({ ...prev, visit_type: v }))} defaultValue="illness">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="illness">Illness</SelectItem>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))} defaultValue="low">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 37.5"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Symptoms</Label>
                  <Textarea 
                    placeholder="Describe symptoms..." 
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Diagnosis</Label>
                  <Input 
                    placeholder="Provisional diagnosis" 
                    value={formData.diagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Action Taken</Label>
                  <Select onValueChange={(v) => setFormData(prev => ({ ...prev, action_taken: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Result of visit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rest in sick bay">Rest in sick bay</SelectItem>
                      <SelectItem value="Given medication">Given medication</SelectItem>
                      <SelectItem value="Sent home">Sent home</SelectItem>
                      <SelectItem value="Referred to hospital">Referred to hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createVisit.isPending}>
                    {createVisit.isPending ? "Recording..." : "Record Visit"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Health Visits</CardTitle>
            <CardDescription>Comprehensive log of students seen in the sick bay</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading clinic records...</div>
            ) : filteredVisits.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-lg space-y-2">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">No health visits recorded yet.</p>
                <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)}>Record first visit</Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Temp</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{visit.learner?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{visit.learner?.admission_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{format(new Date(visit.visit_date), "MMM d, yyyy")}</span>
                            <span className="text-xs text-muted-foreground italic">{format(new Date(visit.visit_date), "h:mm a")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{visit.visit_type.replace("_", " ")}</TableCell>
                        <TableCell>{getPriorityBadge(visit.priority)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{visit.diagnosis || "N/A"}</TableCell>
                        <TableCell>
                          {visit.temperature ? (
                            <div className="flex items-center gap-1">
                              <Thermometer className={visit.temperature > 37.5 ? "h-3 w-3 text-red-500" : "h-3 w-3 text-blue-500"} />
                              <span>{visit.temperature}°C</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{visit.action_taken || "—"}</TableCell>
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

export default Clinic;
