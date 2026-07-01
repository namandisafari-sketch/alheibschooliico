import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, Save, X, User } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const MyStudents = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [editingLearner, setEditingLearner] = useState<any>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    full_name: "", gender: "male" as const, class_id: "", admission_number: "", status: "active"
  });

  const PAGE_SIZE = 20;

  const { data: classIds = [] } = useQuery({
    queryKey: ["teacher-my-class-ids", user?.id],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("class_id")
        .eq("teacher_id", user?.id);
      const { data: leadClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user?.id);
      const ids = new Set<string>();
      (assignments || []).forEach((a: any) => { if (a.class_id) ids.add(a.class_id); });
      (leadClasses || []).forEach((c: any) => ids.add(c.id));
      return [...ids];
    },
    enabled: !!user?.id
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["teacher-my-classes", classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const { data } = await supabase.from("classes").select("id, name").in("id", classIds).order("name");
      return data || [];
    },
    enabled: classIds.length > 0
  });

  const { data: learners = [], isLoading } = useQuery({
    queryKey: ["teacher-my-learners", classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const { data } = await supabase
        .from("learners")
        .select("id, full_name, gender, admission_number, status, class_id, date_of_birth")
        .in("class_id", classIds)
        .order("full_name");
      const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
      return (data || []).map((l: any) => ({ ...l, class_name: classMap.get(l.class_id) || "" }));
    },
    enabled: classIds.length > 0
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("learners").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-my-learners"] });
      setEditingLearner(null);
      toast({ title: t("Success"), description: t("Learner updated") });
    },
    onError: (err: any) => {
      toast({ title: t("Error"), description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-my-learners"] });
      toast({ title: t("Deleted"), description: t("Learner removed") });
    },
    onError: (err: any) => {
      toast({ title: t("Error"), description: err.message, variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (form: typeof registerForm) => {
      const { error } = await supabase.from("learners").insert({
        full_name: form.full_name,
        gender: form.gender,
        class_id: form.class_id,
        admission_number: form.admission_number || null,
        status: form.status,
        enrollment_date: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-my-learners"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setShowRegister(false);
      setRegisterForm({ full_name: "", gender: "male", class_id: "", admission_number: "", status: "active" });
      toast({ title: t("Success"), description: t("Learner registered") });
    },
    onError: (err: any) => {
      toast({ title: t("Error"), description: err.message, variant: "destructive" });
    }
  });

  const filtered = useMemo(() => {
    let result = learners;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l: any) =>
        l.full_name?.toLowerCase().includes(q) ||
        l.admission_number?.toLowerCase().includes(q)
      );
    }
    if (selectedClassId && selectedClassId !== "all") {
      result = result.filter((l: any) => l.class_id === selectedClassId);
    }
    return result;
  }, [learners, searchQuery, selectedClassId]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <DashboardLayout title="My Students" subtitle="Manage learners in your assigned classes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search by name or ADM...")}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              />
            </div>
            <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("All Classes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Classes")}</SelectItem>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowRegister(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t("Register Learner")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{t("No learners found in your classes")}</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Name")}</TableHead>
                      <TableHead>{t("Admission No.")}</TableHead>
                      <TableHead>{t("Class")}</TableHead>
                      <TableHead>{t("Gender")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead className="text-right">{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((learner: any) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-medium">{learner.full_name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{learner.admission_number || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{learner.class_name}</Badge></TableCell>
                        <TableCell>{learner.gender === "male" ? t("Male") : t("Female")}</TableCell>
                        <TableCell>
                          <Badge variant={learner.status === "active" ? "default" : "secondary"}>
                            {learner.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingLearner(learner)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              onClick={() => { if (confirm(t("Delete this learner?"))) deleteMutation.mutate(learner.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    {filtered.length} {t("learner(s)")} · {t("Page")} {page + 1}/{totalPages || 1}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingLearner} onOpenChange={(open) => { if (!open) setEditingLearner(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Edit Learner")}</DialogTitle>
            <DialogDescription>{t("Update learner information")}</DialogDescription>
          </DialogHeader>
          {editingLearner && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Full Name")}</Label>
                <Input value={editingLearner.full_name}
                  onChange={(e) => setEditingLearner({ ...editingLearner, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("Admission Number")}</Label>
                <Input value={editingLearner.admission_number || ""}
                  onChange={(e) => setEditingLearner({ ...editingLearner, admission_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("Class")}</Label>
                <Select value={editingLearner.class_id}
                  onValueChange={(v) => setEditingLearner({ ...editingLearner, class_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select class")} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Gender")}</Label>
                <Select value={editingLearner.gender}
                  onValueChange={(v) => setEditingLearner({ ...editingLearner, gender: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("Male")}</SelectItem>
                    <SelectItem value="female">{t("Female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Status")}</Label>
                <Select value={editingLearner.status}
                  onValueChange={(v) => setEditingLearner({ ...editingLearner, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("Active")}</SelectItem>
                    <SelectItem value="inactive">{t("Inactive")}</SelectItem>
                    <SelectItem value="transferred">{t("Transferred")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingLearner(null)}>
                  <X className="h-4 w-4 mr-1" /> {t("Cancel")}
                </Button>
                <Button onClick={() => updateMutation.mutate(editingLearner)} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {t("Save")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Register New Learner")}</DialogTitle>
            <DialogDescription>{t("Add a learner to one of your classes")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Full Name")} *</Label>
              <Input value={registerForm.full_name}
                onChange={(e) => setRegisterForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder={t("Learner's full name")} />
            </div>
            <div className="space-y-2">
              <Label>{t("Class")} *</Label>
              <Select value={registerForm.class_id}
                onValueChange={(v) => setRegisterForm(f => ({ ...f, class_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select class")} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("Gender")}</Label>
                <Select value={registerForm.gender}
                  onValueChange={(v) => setRegisterForm(f => ({ ...f, gender: v as "male" | "female" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("Male")}</SelectItem>
                    <SelectItem value="female">{t("Female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Admission No.")}</Label>
                <Input value={registerForm.admission_number}
                  onChange={(e) => setRegisterForm(f => ({ ...f, admission_number: e.target.value }))}
                  placeholder={t("Optional")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegister(false)}>
                <X className="h-4 w-4 mr-1" /> {t("Cancel")}
              </Button>
              <Button onClick={() => registerMutation.mutate(registerForm)}
                disabled={registerMutation.isPending || !registerForm.full_name || !registerForm.class_id}>
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {t("Register")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MyStudents;
