import { useState, useEffect } from "react";
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
  DialogDescription,
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
  Loader2,
  AlertTriangle,
  Scale,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface GradeBoundary {
  id: string;
  grade: string;
  min_score: number;
  max_score: number;
  remark: string | null;
  color: string | null;
  sort_order: number;
}

interface GradingScale {
  id: string;
  name: string;
  grading_type: "numeric" | "letter" | "descriptive";
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  boundaries: GradeBoundary[];
}

const GRADING_TYPES = ["numeric", "letter", "descriptive"] as const;
const COLOR_OPTIONS = [
  { value: "emerald", label: "Green", class: "bg-emerald-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "slate", label: "Gray", class: "bg-slate-500" },
];

const emptyScale = {
  name: "",
  grading_type: "numeric" as const,
  description: "",
  is_default: false,
};

const emptyBoundary = {
  grade: "",
  min_score: 0,
  max_score: 100,
  remark: "",
  color: "blue",
  sort_order: 0,
};

const GradingScaleConfig = () => {
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
  const [boundaryDialogOpen, setBoundaryDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<string | null>(null);
  const [editingBoundary, setEditingBoundary] = useState<string | null>(null);
  const [activeScaleId, setActiveScaleId] = useState<string | null>(null);
  const [scaleForm, setScaleForm] = useState(emptyScale);
  const [boundaryForm, setBoundaryForm] = useState(emptyBoundary);
  const [saving, setSaving] = useState(false);

  const fetchScales = async () => {
    setLoading(true);
    const { data: scalesData, error } = await supabase
      .from("grading_scales")
      .select("*, boundaries:grade_boundaries(*)")
      .order("name");
    if (error) {
      toast.error("Failed to load grading scales");
      console.error(error);
    } else {
      setScales(scalesData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScales();
  }, []);

  const openCreateScale = () => {
    setEditingScale(null);
    setScaleForm(emptyScale);
    setScaleDialogOpen(true);
  };

  const openEditScale = (scale: GradingScale) => {
    setEditingScale(scale.id);
    setScaleForm({
      name: scale.name,
      grading_type: scale.grading_type,
      description: scale.description || "",
      is_default: scale.is_default,
    });
    setScaleDialogOpen(true);
  };

  const saveScale = async () => {
    if (!scaleForm.name.trim()) {
      toast.error("Scale name is required");
      return;
    }
    setSaving(true);
    if (editingScale) {
      const { error } = await supabase
        .from("grading_scales")
        .update({
          name: scaleForm.name,
          grading_type: scaleForm.grading_type,
          description: scaleForm.description || null,
          is_default: scaleForm.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingScale);
      if (error) {
        toast.error("Failed to update scale");
        console.error(error);
        setSaving(false);
        return;
      }
      toast.success("Scale updated");
    } else {
      const { error } = await supabase
        .from("grading_scales")
        .insert({
          name: scaleForm.name,
          grading_type: scaleForm.grading_type,
          description: scaleForm.description || null,
          is_default: scaleForm.is_default,
        });
      if (error) {
        toast.error("Failed to create scale");
        console.error(error);
        setSaving(false);
        return;
      }
      toast.success("Scale created");
    }
    setSaving(false);
    setScaleDialogOpen(false);
    fetchScales();
  };

  const deleteScale = async (id: string) => {
    if (!confirm("Delete this grading scale and all its boundaries?")) return;
    const { error } = await supabase.from("grading_scales").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete scale");
      console.error(error);
      return;
    }
    toast.success("Scale deleted");
    fetchScales();
  };

  const openCreateBoundary = (scaleId: string) => {
    setActiveScaleId(scaleId);
    setEditingBoundary(null);
    const scale = scales.find((s) => s.id === scaleId);
    setBoundaryForm({
      ...emptyBoundary,
      sort_order: (scale?.boundaries?.length || 0) + 1,
    });
    setBoundaryDialogOpen(true);
  };

  const openEditBoundary = (boundary: GradeBoundary) => {
    setActiveScaleId(boundary.id);
    setEditingBoundary(boundary.id);
    setBoundaryForm({
      grade: boundary.grade,
      min_score: boundary.min_score,
      max_score: boundary.max_score,
      remark: boundary.remark || "",
      color: boundary.color || "blue",
      sort_order: boundary.sort_order,
    });
    setBoundaryDialogOpen(true);
  };

  const saveBoundary = async () => {
    if (!boundaryForm.grade.trim()) {
      toast.error("Grade label is required");
      return;
    }
    if (boundaryForm.min_score > boundaryForm.max_score) {
      toast.error("Min score cannot exceed max score");
      return;
    }
    if (!activeScaleId) return;
    setSaving(true);
    if (editingBoundary) {
      const { error } = await supabase
        .from("grade_boundaries")
        .update({
          grade: boundaryForm.grade,
          min_score: boundaryForm.min_score,
          max_score: boundaryForm.max_score,
          remark: boundaryForm.remark || null,
          color: boundaryForm.color || null,
          sort_order: boundaryForm.sort_order,
        })
        .eq("id", editingBoundary);
      if (error) {
        toast.error("Failed to update boundary");
        console.error(error);
        setSaving(false);
        return;
      }
      toast.success("Boundary updated");
    } else {
      const { error } = await supabase
        .from("grade_boundaries")
        .insert({
          scale_id: activeScaleId,
          grade: boundaryForm.grade,
          min_score: boundaryForm.min_score,
          max_score: boundaryForm.max_score,
          remark: boundaryForm.remark || null,
          color: boundaryForm.color || null,
          sort_order: boundaryForm.sort_order,
        });
      if (error) {
        toast.error("Failed to create boundary");
        console.error(error);
        setSaving(false);
        return;
      }
      toast.success("Boundary created");
    }
    setSaving(false);
    setBoundaryDialogOpen(false);
    fetchScales();
  };

  const deleteBoundary = async (id: string) => {
    if (!confirm("Delete this grade boundary?")) return;
    const { error } = await supabase.from("grade_boundaries").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete boundary");
      return;
    }
    toast.success("Boundary deleted");
    fetchScales();
  };

  const getColorClass = (color: string | null) => {
    const c = COLOR_OPTIONS.find((o) => o.value === color);
    return c ? c.class : "bg-slate-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Scale className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Grading Scale Configuration
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define and manage grade boundaries for all subject types
              </p>
            </div>
          </div>
          <Button onClick={openCreateScale} className="gap-2">
            <Plus className="h-4 w-4" />
            New Scale
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : scales.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Scale className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                No grading scales yet
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Create your first grading scale to define grade boundaries
              </p>
              <Button onClick={openCreateScale}>
                <Plus className="h-4 w-4 mr-2" />
                Create Scale
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {scales.map((scale) => (
              <Card key={scale.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{scale.name}</CardTitle>
                        {scale.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {scale.grading_type}
                        </Badge>
                      </div>
                      {scale.description && (
                        <CardDescription>{scale.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditScale(scale)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteScale(scale.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Order</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Min Score</TableHead>
                        <TableHead>Max Score</TableHead>
                        <TableHead>Remark</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(scale.boundaries || [])
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((boundary) => (
                          <TableRow key={boundary.id}>
                            <TableCell className="text-muted-foreground">
                              {boundary.sort_order}
                            </TableCell>
                            <TableCell className="font-semibold">{boundary.grade}</TableCell>
                            <TableCell>{boundary.min_score}</TableCell>
                            <TableCell>{boundary.max_score}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {boundary.remark || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full ${getColorClass(boundary.color)}`} />
                                <span className="text-sm capitalize text-muted-foreground">
                                  {boundary.color || "-"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditBoundary(boundary)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteBoundary(boundary.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => openCreateBoundary(scale.id)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Grade
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Scale Dialog */}
      <Dialog open={scaleDialogOpen} onOpenChange={setScaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScale ? "Edit Scale" : "New Grading Scale"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Scale Name</Label>
              <Input
                value={scaleForm.name}
                onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })}
                placeholder="e.g. PLE Standard"
              />
            </div>
            <div className="space-y-2">
              <Label>Grading Type</Label>
              <Select
                value={scaleForm.grading_type}
                onValueChange={(val) =>
                  setScaleForm({ ...scaleForm, grading_type: val as "numeric" | "letter" | "descriptive" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADING_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={scaleForm.description}
                onChange={(e) => setScaleForm({ ...scaleForm, description: e.target.value })}
                placeholder="Brief description of this grading scale"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={scaleForm.is_default}
                onChange={(e) => setScaleForm({ ...scaleForm, is_default: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default scale for this grading type
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScaleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveScale} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingScale ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boundary Dialog */}
      <Dialog open={boundaryDialogOpen} onOpenChange={setBoundaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoundary ? "Edit Grade Boundary" : "Add Grade Boundary"}</DialogTitle>
            <DialogDescription>
              Define the score range and label for this grade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Grade Label</Label>
              <Input
                value={boundaryForm.grade}
                onChange={(e) => setBoundaryForm({ ...boundaryForm, grade: e.target.value })}
                placeholder="e.g. D1, A, B+, Exceeding"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Score</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={boundaryForm.min_score}
                  onChange={(e) =>
                    setBoundaryForm({ ...boundaryForm, min_score: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={boundaryForm.max_score}
                  onChange={(e) =>
                    setBoundaryForm({ ...boundaryForm, max_score: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remark (optional)</Label>
              <Input
                value={boundaryForm.remark}
                onChange={(e) => setBoundaryForm({ ...boundaryForm, remark: e.target.value })}
                placeholder="e.g. Distinction, Pass, Needs Improvement"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={boundaryForm.color}
                onValueChange={(val) => setBoundaryForm({ ...boundaryForm, color: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${c.class}`} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min={1}
                value={boundaryForm.sort_order}
                onChange={(e) =>
                  setBoundaryForm({ ...boundaryForm, sort_order: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoundaryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBoundary} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBoundary ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GradingScaleConfig;
