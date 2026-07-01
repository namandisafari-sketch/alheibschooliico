import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, BookOpen, User, Loader2, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const SubjectLoad = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: academicSettings } = useAcademicSettings();

  const fmtTerm = (id: string) => {
    const terms = academicSettings?.terms ?? [];
    const match = terms.find((t: any) => t.id === id);
    return match?.name || ({ term_1: "Term I", term_2: "Term II", term_3: "Term III" })[id] || id;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const defaultTerm = academicSettings?.current_term_id ?? "term_1";
  const [formData, setFormData] = useState({ teacher_id: "", class_id: "", subject_id: "", term: defaultTerm });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["dos-subject-load"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, teacher_id, class_id, subject_id, term, created_at");
      if (!data) return [];

      const teacherIds = [...new Set(data.map((a: any) => a.teacher_id).filter(Boolean))];
      const classIds = [...new Set(data.map((a: any) => a.class_id).filter(Boolean))];
      const subjectIds = [...new Set(data.map((a: any) => a.subject_id).filter(Boolean))];

      const [{ data: teachers }, { data: classes }, { data: subjects }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", teacherIds.length ? teacherIds : ["none"]),
        supabase.from("classes").select("id, name").in("id", classIds.length ? classIds : ["none"]),
        supabase.from("subjects").select("id, name").in("id", subjectIds.length ? subjectIds : ["none"]),
      ]);

      const tMap = new Map((teachers || []).map((t: any) => [t.id, t.full_name]));
      const cMap = new Map((classes || []).map((c: any) => [c.id, c.name]));
      const sMap = new Map((subjects || []).map((s: any) => [s.id, s.name]));

      return data.map((a: any) => ({
        ...a,
        teacher_name: tMap.get(a.teacher_id) || "Unknown",
        class_name: cMap.get(a.class_id) || `Missing class (${a.class_id?.slice(0, 8)}…)`,
        subject_name: sMap.get(a.subject_id) || `Missing subject (${a.subject_id?.slice(0, 8)}…)`,
      }));
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["staff-teachers"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return data || [];
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["all-subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("id, name").order("name");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const { error } = await supabase.from("teacher_assignments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dos-subject-load"] });
      setShowDialog(false);
      setFormData({ teacher_id: "", class_id: "", subject_id: "", term: defaultTerm });
      toast({ title: t("Success"), description: t("Subject load assigned") });
    },
    onError: (err: any) => {
      toast({ title: t("Error"), description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dos-subject-load"] });
      toast({ title: t("Removed"), description: t("Assignment deleted") });
    },
    onError: (err: any) => {
      toast({ title: t("Error"), description: err.message, variant: "destructive" });
    },
  });

  // Group assignments by teacher
  const grouped = useMemo(() => {
    let filtered = assignments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a: any) =>
        a.teacher_name?.toLowerCase().includes(q) ||
        a.subject_name?.toLowerCase().includes(q) ||
        a.class_name?.toLowerCase().includes(q)
      );
    }
    if (filterClassId !== "all") {
      filtered = filtered.filter((a: any) => a.class_id === filterClassId);
    }
    const map = new Map<string, any[]>();
    filtered.forEach((a: any) => {
      const list = map.get(a.teacher_id) || [];
      list.push(a);
      map.set(a.teacher_id, list);
    });
    return Array.from(map.entries()).map(([teacherId, items]) => ({
      teacher_id: teacherId,
      teacher_name: items[0].teacher_name,
      items,
      load: items.length,
    })).sort((a, b) => b.load - a.load);
  }, [assignments, searchQuery, filterClassId]);

  return (
    <DashboardLayout title="Subject Load Management" subtitle="Assign subjects to teachers across classes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search teacher or subject...")}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterClassId} onValueChange={setFilterClassId}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-1" />
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
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t("Assign Subject")}
          </Button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : grouped.length === 0 ? (
          <Card><CardContent className="py-20 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>{t("No subject loads assigned yet")}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {grouped.map((group) => (
              <Card key={group.teacher_id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {group.teacher_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.teacher_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {group.load} subject{group.load === 1 ? "" : "s"} · {[...new Set(group.items.map((i: any) => i.class_name))].join(", ")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{group.load} subjects</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 bg-secondary/30 rounded-full pl-3 pr-1 py-1 text-sm group-hover:bg-secondary/50 transition-colors">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.subject_name}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{item.class_name}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded-full">{fmtTerm(item.term)}</span>
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive"
                          onClick={() => { if (confirm(t("Remove this assignment?"))) deleteMutation.mutate(item.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Assign Subject to Teacher")}</DialogTitle>
            <DialogDescription>{t("Select teacher, class, and subject")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Teacher")} *</Label>
              <Select onValueChange={(v) => setFormData(p => ({ ...p, teacher_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Choose a teacher")} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((tchr: any) => (
                    <SelectItem key={tchr.id} value={tchr.id}><User className="h-3 w-3 inline mr-1" />{tchr.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("Class")} *</Label>
              <Select onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
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
              <Label>{t("Subject")} *</Label>
              <Select onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Choose subject")} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("Term")}</Label>
              <Select value={formData.term} onValueChange={(v) => setFormData(p => ({ ...p, term: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(academicSettings?.terms ?? []).length > 0
                    ? academicSettings.terms.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))
                    : ["term_1", "term_2", "term_3"].map((id) => (
                        <SelectItem key={id} value={id}>{fmtTerm(id)}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>{t("Cancel")}</Button>
              <Button onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.teacher_id || !formData.class_id || !formData.subject_id}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {t("Assign")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SubjectLoad;
