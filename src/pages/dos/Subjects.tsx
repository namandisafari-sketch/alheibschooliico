// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertTriangle,
  BookMarked,
} from "lucide-react";
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from "@/hooks/useSubjects";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

const CATEGORIES = ["academic", "islamic", "behavior"];
const GRADING_TYPES = ["numeric", "letter", "descriptive"];

const emptyForm = {
  name: "",
  code: "",
  category: "academic",
  grading_type: "numeric",
  is_core: false,
  display_order: 0,
  min_class_level: 1,
  max_class_level: 7,
};

const Subjects = () => {
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = subjects.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (subject) => {
    setEditing(subject.id);
    setForm({
      name: subject.name,
      code: subject.code || "",
      category: subject.category || "academic",
      grading_type: subject.grading_type || "numeric",
      is_core: subject.is_core || false,
      display_order: subject.display_order || 0,
      min_class_level: subject.min_class_level || 1,
      max_class_level: subject.max_class_level || 7,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        category: form.category,
        grading_type: form.grading_type,
        is_core: form.is_core,
        display_order: Number(form.display_order),
        min_class_level: Number(form.min_class_level),
        max_class_level: Number(form.max_class_level),
      };

      if (editing) {
        await updateSubject.mutateAsync({ id: editing, ...payload });
        toast.success("Subject updated");
      } else {
        await createSubject.mutateAsync(payload);
        toast.success("Subject created");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This may affect existing assignments.`)) return;
    try {
      await deleteSubject.mutateAsync(id);
      toast.success("Subject deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete subject");
    }
  };

  return (
    <DashboardLayout title="Subjects" subtitle="Manage subjects offered at school">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">All Subjects</CardTitle>
              <CardDescription>{subjects.length} subject{subjects.length === 1 ? "" : "s"} configured</CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {search ? "No subjects match your search" : "No subjects yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "Try a different term" : "Click 'Add Subject' to create the first one"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Grading</TableHead>
                      <TableHead>Core</TableHead>
                      <TableHead>Class Levels</TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {s.display_order || i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {s.code || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              s.category === "islamic"
                                ? "border-emerald-300 text-emerald-700"
                                : s.category === "behavior"
                                ? "border-amber-300 text-amber-700"
                                : "border-blue-300 text-blue-700"
                            }
                          >
                            {s.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.grading_type}
                        </TableCell>
                        <TableCell>
                          {s.is_core ? (
                            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                              Core
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          P{s.min_class_level || "?"} – P{s.max_class_level || "?"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => openEdit(s)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDelete(s.id, s.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Subject Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. MATH"
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <SearchableSelect
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  placeholder="Select category"
                />
              </div>
              <div>
                <Label>Grading Type</Label>
                <SearchableSelect
                  options={GRADING_TYPES.map((t) => ({ value: t, label: t }))}
                  value={form.grading_type}
                  onValueChange={(v) => setForm({ ...form, grading_type: v })}
                  placeholder="Select grading type"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Class Level</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={form.min_class_level}
                  onChange={(e) => setForm({ ...form, min_class_level: e.target.value })}
                />
              </div>
              <div>
                <Label>Max Class Level</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={form.max_class_level}
                  onChange={(e) => setForm({ ...form, max_class_level: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_core}
                onChange={(e) => setForm({ ...form, is_core: e.target.checked })}
                className="rounded border-gray-300"
              />
              Core subject
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Subjects;
