// @ts-nocheck
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LearnerDetailsDialog } from "@/components/students/LearnerDetailsDialog";
import { EditLearnerDialog } from "@/components/students/EditLearnerDialog";
import { Bed, Users, Search, Filter, MoveRight, FileText, Pencil } from "lucide-react";

interface Learner {
  id: string;
  full_name: string;
  admission_number: string | null;
  dormitory: string | null;
  class_id: string | null;
  class_name: string | null;
  gender: string | null;
  status: string | null;
}

const ReassignDialog = ({ learner, existingDorms, onDone }: { learner: Learner; existingDorms: string[]; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [dorm, setDorm] = useState(learner.dormitory || "");

  const qc = useQueryClient();
  const reassign = useMutation({
    mutationFn: async (newDorm: string) => {
      const { error } = await supabase.from("learners").update({ dormitory: newDorm || null }).eq("id", learner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hostel-learners-dormitory"] });
      toast({ title: "Reassigned", description: `${learner.full_name} moved to ${dorm || "Unassigned"}` });
      setOpen(false);
      onDone();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><MoveRight className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reassign — {learner.full_name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Current Dormitory</Label>
            <p className="text-sm text-muted-foreground">{learner.dormitory || "Unassigned"}</p>
          </div>
          <div>
            <Label>New Dormitory</Label>
            <Select value={dorm} onValueChange={setDorm}>
              <SelectTrigger><SelectValue placeholder="Select or type..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {existingDorms.filter((d) => d !== learner.dormitory).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Or type a new dormitory name below</p>
            <Input value={dorm} onChange={(e) => setDorm(e.target.value)} placeholder="New dormitory name..." className="mt-2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => reassign.mutate(dorm)} disabled={reassign.isPending}>
            {reassign.isPending ? "Saving..." : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const DormitoriesTab = () => {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedDorm, setExpandedDorm] = useState<string | null>(null);
  const [dossierLearner, setDossierLearner] = useState<Learner | null>(null);
  const [editLearner, setEditLearner] = useState<Learner | null>(null);
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name");
      return data || [];
    },
  });

  const { data: rawLearners = [], isLoading } = useQuery({
    queryKey: ["hostel-learners-dormitory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learners")
        .select("id, full_name, admission_number, dormitory, class_id, gender, status")
        .order("dormitory");
      if (error) throw error;
      return (data || []) as Learner[];
    },
  });

  const learners = useMemo(() => {
    const classMap = new Map<string, string>();
    classes.forEach((c: any) => classMap.set(c.id, c.name));
    return rawLearners.map((l) => ({ ...l, class_name: classMap.get(l.class_id) || "" }));
  }, [rawLearners, classes]);

  const existingDorms = useMemo(() => {
    const dorms = new Set<string>();
    rawLearners.forEach((l) => { if (l.dormitory) dorms.add(l.dormitory); });
    return [...dorms].sort();
  }, [rawLearners]);

  const grouped = useMemo(() => {
    let filtered = learners;
    if (genderFilter !== "all") filtered = filtered.filter((l) => l.gender === genderFilter);
    if (statusFilter !== "all") filtered = filtered.filter((l) => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.full_name?.toLowerCase().includes(q) ||
          l.admission_number?.toLowerCase().includes(q) ||
          l.dormitory?.toLowerCase().includes(q)
      );
    }
    const byDorm: Record<string, Learner[]> = {};
    filtered.forEach((l) => {
      const key = l.dormitory || "Unassigned";
      if (!byDorm[key]) byDorm[key] = [];
      byDorm[key].push(l);
    });
    return Object.entries(byDorm).sort(([a], [b]) => a.localeCompare(b));
  }, [learners, genderFilter, statusFilter, search]);

  const totalDormitories = grouped.filter(([name]) => name !== "Unassigned").length;
  const totalResidents = grouped.reduce((sum, [, list]) => sum + list.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading dormitory data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Dormitories</h2>
          <p className="text-sm text-muted-foreground">
            {totalDormitories} dormitories &bull; {totalResidents} residents
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dormitory or learner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-28">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="male">Boys</SelectItem>
              <SelectItem value="female">Girls</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {grouped.map(([dormName, residents]) => {
          if (dormName === "Unassigned") return null;
          const gender = residents[0]?.gender;
          const genderColor = gender === "male" ? "bg-blue-500/10 text-blue-700" : gender === "female" ? "bg-pink-500/10 text-pink-700" : "bg-muted";
          const isExpanded = expandedDorm === dormName;
          return (
            <Card
              key={dormName}
              className="border-none shadow-md hover:shadow-lg transition cursor-pointer"
              onClick={() => setExpandedDorm(isExpanded ? null : dormName)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-lg ${genderColor}`}><Bed className="h-5 w-5" /></div>
                  <Badge variant="outline" className="capitalize">{gender || "mixed"}</Badge>
                </div>
                <h3 className="font-bold text-lg">{dormName}</h3>
                <div className="flex justify-between items-center mt-3">
                  <div>
                    <p className="text-2xl font-bold">{residents.length}</p>
                    <p className="text-xs text-muted-foreground">residents</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    {isExpanded ? "Collapse" : "View"}
                  </Button>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-2 max-h-60 overflow-y-auto">
                    {residents.map((l) => (
                      <div key={l.id} className="flex items-center gap-1 text-sm p-2 rounded-md bg-muted/50">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{l.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {l.admission_number || "—"}
                            {l.class_name ? ` • ${l.class_name}` : ""}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDossierLearner(l); }} title="View Dossier">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditLearner(l); }} title="Edit Learner">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <span onClick={(e) => e.stopPropagation()}><ReassignDialog learner={l} existingDorms={existingDorms} onDone={() => queryClient.invalidateQueries({ queryKey: ["hostel-learners-dormitory"] })} /></span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {grouped.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No learners with dormitory assignments found.
            </CardContent>
          </Card>
        )}
      </div>

      {grouped.some(([name]) => name === "Unassigned") && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Unassigned Learners
            <Badge variant="secondary">
              {grouped.find(([name]) => name === "Unassigned")?.[1].length}
            </Badge>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {grouped
              .find(([name]) => name === "Unassigned")?.[1]
              .map((l) => (
                <div key={l.id} className="flex items-center gap-1 p-3 rounded-lg border text-sm">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{l.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.admission_number || "—"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setDossierLearner(l)} title="View Dossier">
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditLearner(l)} title="Edit Learner">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <span onClick={(e) => e.stopPropagation()}><ReassignDialog learner={l} existingDorms={existingDorms} onDone={() => queryClient.invalidateQueries({ queryKey: ["hostel-learners-dormitory"] })} /></span>
                </div>
              ))}
          </div>
        </div>
      )}

      {dossierLearner && (
        <LearnerDetailsDialog
          student={dossierLearner}
          open={!!dossierLearner}
          onOpenChange={(o) => { if (!o) setDossierLearner(null); }}
        />
      )}
      {editLearner && (
        <EditLearnerDialog
          learner={editLearner as any}
          open={!!editLearner}
          onOpenChange={(o) => { if (!o) setEditLearner(null); }}
        />
      )}
    </div>
  );
};
