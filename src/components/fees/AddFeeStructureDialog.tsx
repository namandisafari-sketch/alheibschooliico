import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateFeeStructure, useUpdateFeeStructure, FeeStructure } from "@/hooks/useFees";

interface Props {
  trigger?: React.ReactNode;
  initial?: FeeStructure;
  onClose?: () => void;
}

const CATEGORIES = ["tuition", "boarding", "transport", "meals", "books", "uniform", "activity", "other"];

export const AddFeeStructureDialog = ({ trigger, initial, onClose }: Props) => {
  const [open, setOpen] = useState(!!initial);
  const create = useCreateFeeStructure();
  const update = useUpdateFeeStructure();
  const [form, setForm] = useState({
    name: initial?.name || "",
    category: initial?.category || "tuition",
    amount: initial?.amount?.toString() || "",
    class_level: initial?.class_level?.toString() || "",
    applies_to: initial?.applies_to || "all",
    term: initial?.term || "",
    is_active: initial?.is_active ?? true,
  });

  const submit = async () => {
    const payload = {
      name: form.name,
      category: form.category,
      amount: Number(form.amount) || 0,
      class_level: form.class_level ? Number(form.class_level) : null,
      applies_to: form.applies_to,
      term: form.term || null,
      is_active: form.is_active,
    };
    if (initial) await update.mutateAsync({ id: initial.id, ...payload });
    else await create.mutateAsync(payload);
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose?.(); }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tuition Fee" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (UGX)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Applies To</Label>
              <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Learners</SelectItem>
                  <SelectItem value="class">Specific Class Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class Level (P1-P7)</Label>
              <Input type="number" min={1} max={7} value={form.class_level} onChange={(e) => setForm({ ...form, class_level: e.target.value })} disabled={form.applies_to === "all"} />
            </div>
          </div>
          <div>
            <Label>Term (optional)</Label>
            <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
              <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="term_1">Term 1</SelectItem>
                <SelectItem value="term_2">Term 2</SelectItem>
                <SelectItem value="term_3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} className="w-full" disabled={!form.name || !form.amount}>
            {initial ? "Save Changes" : "Add Fee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
