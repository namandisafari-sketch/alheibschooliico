import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Check, AlertCircle, XCircle, Plus, PackageCheck, RotateCcw } from "lucide-react";
import { useLearnerEssentials } from "@/hooks/useHostel";
import { useLearners } from "@/hooks/useLearners";
import { useInventory } from "@/hooks/useInventory";

const IssueDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ learner_id: "", item_id: "", quantity: 1, condition: "good", notes: "" });
  const { issue } = useLearnerEssentials();
  const learners = useLearners();
  const inv = useInventory();
  const hostelItems = (inv.items.data || []).filter((i: any) => i.category?.name === "Hostel Essentials");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Issue Item</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue Hostel Essential to Learner</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Learner *</Label>
            <Select value={form.learner_id} onValueChange={(v) => setForm({ ...form, learner_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(learners.data || []).map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Item *</Label>
            <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>
                {hostelItems.length === 0 && <div className="p-3 text-sm text-muted-foreground">Add items under "Hostel Essentials" category in Inventory.</div>}
                {hostelItems.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantity</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!form.learner_id || !form.item_id || issue.isPending} onClick={() => issue.mutate(form, { onSuccess: () => { setOpen(false); setForm({ learner_id: "", item_id: "", quantity: 1, condition: "good", notes: "" }); } })}>Issue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StatusIcon = ({ status }: { status: string }) =>
  status === "present" ? <Check className="h-4 w-4 text-success" /> :
  status === "missing" ? <XCircle className="h-4 w-4 text-destructive" /> :
  status === "returned" ? <RotateCcw className="h-4 w-4 text-muted-foreground" /> :
  <AlertCircle className="h-4 w-4 text-amber-500" />;

export const StudentEssentialsTab = () => {
  const [search, setSearch] = useState("");
  const { list, updateStatus } = useLearnerEssentials();

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; admission: string | null; items: any[] }>();
    (list.data || []).forEach((e) => {
      const key = e.learner_id;
      if (!map.has(key)) map.set(key, { name: e.learner?.full_name || "Unknown", admission: e.learner?.admission_number || null, items: [] });
      map.get(key)!.items.push(e);
    });
    return Array.from(map.entries())
      .filter(([_, v]) => !search || v.name.toLowerCase().includes(search.toLowerCase()) || (v.admission || "").toLowerCase().includes(search.toLowerCase()));
  }, [list.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search learner..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <IssueDialog />
      </div>

      {grouped.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">
          <PackageCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
          No essentials issued yet. Click "Issue Item" to begin tracking.
        </CardContent></Card>
      )}

      <div className="grid gap-4">
        {grouped.map(([learnerId, data]) => (
          <Card key={learnerId} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg">{data.name}</h4>
                  {data.admission && <Badge variant="outline">{data.admission}</Badge>}
                </div>
                <Badge variant="secondary">{data.items.length} items</Badge>
              </div>
              <div className="space-y-2">
                {data.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={it.status} />
                      <div>
                        <p className="text-sm font-medium">{it.item?.name} <span className="text-xs text-muted-foreground">×{it.quantity}</span></p>
                        <p className="text-[11px] text-muted-foreground">Issued {it.issued_date} • {it.condition}</p>
                      </div>
                    </div>
                    <Select value={it.status} onValueChange={(v) => updateStatus.mutate({ id: it.id, status: v })}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
