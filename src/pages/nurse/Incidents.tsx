// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Search, Clock, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Incidents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["medical-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_incidents")
        .select(`*, learner:learners(full_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: learners = [] } = useQuery({
    queryKey: ["learners-list"],
    queryFn: async () => {
        const { data, error } = await supabase.from("learners").select("id, full_name");
        if (error) throw error;
        return data;
    }
  });

  const [formData, setFormData] = useState({
    learner_id: "",
    type: "Injury",
    severity: "low",
    description: "",
    action_taken: "",
  });

  const createIncident = useMutation({
    mutationFn: async (inc: any) => {
      const { error } = await supabase.from("medical_incidents").insert({
        ...inc,
        recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-incidents"] });
      toast({ title: "Incident Logged", description: "The health incident has been recorded and relevant staff notified." });
      setIsDialogOpen(false);
      setFormData({ learner_id: "", type: "Injury", severity: "low", description: "", action_taken: "" });
    },
  });

  const filteredIncidents = incidents.filter(inc => 
    inc.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Health Incidents" subtitle="Record and Track Medical Occurrences">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by student name..." 
              className="pl-9 h-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10 rounded-xl">
                <Plus className="h-4 w-4" /> Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Incident Report</DialogTitle>
                <DialogDescription>Detail the medical event for record and notification</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Affected Learner</Label>
                  <SearchableSelect
                    options={learners.map(l => ({ value: l.id, label: l.full_name, searchTerms: [l.full_name] }))}
                    value={formData.learner_id}
                    onValueChange={(v) => setFormData(p => ({...p, learner_id: v}))}
                    placeholder="Select student..."
                    searchPlaceholder="Search by name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Incident Type</Label>
                    <Select onValueChange={(v) => setFormData(p => ({...p, type: v}))}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Injury" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Injury">Injury</SelectItem>
                        <SelectItem value="Fainting">Fainting</SelectItem>
                        <SelectItem value="Allergic Reaction">Allergic Reaction</SelectItem>
                        <SelectItem value="Seizure">Seizure</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select onValueChange={(v) => setFormData(p => ({...p, severity: v}))}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Low" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Minor)</SelectItem>
                        <SelectItem value="medium">Medium (Moderate)</SelectItem>
                        <SelectItem value="high">High (Severe)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({...p, description: e.target.value}))}
                    placeholder="Describe what happened..." 
                    className="min-h-[80px] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Action Taken</Label>
                  <Input 
                    value={formData.action_taken}
                    onChange={(e) => setFormData(p => ({...p, action_taken: e.target.value}))}
                    placeholder="e.g. Cleaned wound, applied bandage" 
                    className="rounded-lg"
                  />
                </div>
                <Button className="w-full gap-2 h-11 rounded-xl" onClick={() => createIncident.mutate(formData)} disabled={createIncident.isPending}>
                  {createIncident.isPending ? "Logging..." : "Submit Official Report"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-2xl border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Fetching records...</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <AlertTriangle className="h-10 w-10 mx-auto text-slate-200" />
                <p className="text-muted-foreground text-sm font-medium">No recorded incidents found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Date / Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Incident Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((inc) => (
                    <TableRow key={inc.id} className="group hover:bg-slate-50/50 cursor-pointer">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs uppercase">{format(new Date(inc.created_at), "MMM d, yyyy")}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {format(new Date(inc.created_at), "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm">{inc.learner?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] rounded-lg">{inc.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${inc.severity === 'high' ? 'bg-red-500' : inc.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span className="text-xs capitalize font-medium">{inc.severity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] rounded-lg">Resolved</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Incidents;
