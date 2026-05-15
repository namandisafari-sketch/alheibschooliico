import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBursarRule } from "@/hooks/useFees";
import { useClasses } from "@/hooks/useClasses";

export const AddBursarRuleDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const create = useCreateBursarRule();
  const { data: classes } = useClasses();
  const [form, setForm] = useState({
    name: "",
    balance_threshold: "",
    class_id: "all",
  });

  const submit = async () => {
    await create.mutateAsync({
      name: form.name,
      rule_type: "balance_threshold",
      balance_threshold: Number(form.balance_threshold) || 0,
      class_id: form.class_id === "all" ? null : form.class_id,
      applies_to_all_classes: form.class_id === "all",
      is_active: true,
    });
    setOpen(false);
    setForm({ name: "", balance_threshold: "", class_id: "all" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bursar Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Rule Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. High Fees Block" />
          </div>
          <div>
            <Label>Block when balance ≥ (UGX)</Label>
            <Input type="number" value={form.balance_threshold} onChange={(e) => setForm({ ...form, balance_threshold: e.target.value })} />
          </div>
          <div>
            <Label>Apply To</Label>
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} className="w-full" disabled={!form.name || !form.balance_threshold}>Create Rule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
