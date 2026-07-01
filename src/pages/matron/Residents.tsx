// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, UserX, BedDouble } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Residents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dormitory_id: "",
    learner_id: "",
    bed_number: "",
  });

  const { data: assignedDormIds = [] } = useQuery({
    queryKey: ["my-dormitories", user?.id],
    queryFn: async () => {
      if (role !== "matron") return [];
      const { data } = await supabase
        .from("dormitories")
        .select("id")
        .eq("matron_staff_id", user?.id);
      return (data || []).map((d) => d.id);
    },
    enabled: role === "matron",
  });

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ["matron-residents", assignedDormIds],
    queryFn: async () => {
      let query = supabase
        .from("dormitory_residents")
        .select("*, learner:learners(full_name, admission_number, gender, class_name), dormitory:dormitories(name, gender)")
        .eq("is_active", true)
        .order("dormitory_id")
        .order("bed_number");
      if (role === "matron" && assignedDormIds.length > 0) {
        query = query.in("dormitory_id", assignedDormIds);
      }
      const { data } = await query;
      return data || [];
    },
    enabled: role !== "matron" || assignedDormIds.length > 0,
  });

  const { data: dormitories = [] } = useQuery({
    queryKey: ["matron-dormitories-list", assignedDormIds],
    queryFn: async () => {
      let query = supabase.from("dormitories").select("id, name, capacity").order("name");
      if (role === "matron" && assignedDormIds.length > 0) {
        query = query.in("id", assignedDormIds);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const { data: learners = [] } = useQuery({
    queryKey: ["matron-learners"],
    queryFn: async () => {
      const { data } = await supabase.from("learners").select("id, full_name, admission_number").order("full_name");
      return data || [];
    },
  });

  const assignResident = useMutation({
    mutationFn: async (values: { dormitory_id: string; learner_id: string; bed_number?: string }) => {
      const { error } = await supabase.from("dormitory_residents").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matron-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitory-occupancy"] });
      toast({ title: "Assigned", description: "Learner assigned to dormitory" });
      setIsDialogOpen(false);
      setFormData({ dormitory_id: "", learner_id: "", bed_number: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const releaseResident = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dormitory_residents")
        .update({ is_active: false, released_date: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matron-residents"] });
      queryClient.invalidateQueries({ queryKey: ["dormitory-occupancy"] });
      toast({ title: "Released", description: "Resident released from dormitory" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const grouped = residents.reduce((acc: Record<string, any[]>, r: any) => {
    const key = r.dormitory?.name || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const filtered = Object.entries(grouped).reduce((acc: Record<string, any[]>, [key, items]) => {
    const matched = items.filter((r: any) =>
      r.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bed_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (matched.length > 0) acc[key] = matched;
    return acc;
  }, {});

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dormitory_id || !formData.learner_id) {
      toast({ title: "Error", description: "Please select dormitory and learner", variant: "destructive" });
      return;
    }
    assignResident.mutate(formData);
  };

  return (
    <DashboardLayout title="Dormitory Residents" subtitle="Manage learners assigned to dormitories">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by learner or bed number..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Assign Resident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Resident to Dormitory</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssign} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Dormitory</Label>
                  <Select onValueChange={(v) => setFormData(prev => ({ ...prev, dormitory_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dormitory" />
                    </SelectTrigger>
                    <SelectContent>
                      {dormitories.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name} (Capacity: {d.capacity})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Learner</Label>
                  <SearchableSelect
                    options={learners.map((l: any) => ({ value: l.id, label: `${l.full_name} (${l.admission_number})` }))}
                    value={formData.learner_id}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, learner_id: v }))}
                    placeholder="Search and select learner..."
                    searchPlaceholder="Type to search..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bed Number (optional)</Label>
                  <Input
                    placeholder="e.g. A-12"
                    value={formData.bed_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, bed_number: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={assignResident.isPending}>
                    {assignResident.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading residents...</div>
        ) : Object.keys(filtered).length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center border-2 border-dashed rounded-lg">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                {searchTerm ? "No residents match your search." : "No residents assigned yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(filtered).map(([dormName, items]) => (
            <Card key={dormName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-indigo-500" />
                  {dormName}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {items.length} resident{items.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{r.learner?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.learner?.admission_number} • {r.learner?.class_name || ""}
                            {r.bed_number && <span> • Bed: <Badge variant="outline" className="text-[10px]">{r.bed_number}</Badge></span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">
                          Since {format(new Date(r.assigned_date), "MMM d, yyyy")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => releaseResident.mutate(r.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default Residents;
