// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, AlertCircle } from "lucide-react";
import { useLearnerFamily, useAllLearners, useLinkFamily, useRemoveFamilyLink } from "@/hooks/useFamilyRelationships";

const RELATIONSHIP_TYPES = [
  "brother", "sister", "half_brother", "half_sister", "cousin", "twin", "other"
];

export function FamilyRelationshipsTab({ learnerId }: { learnerId: string }) {
  const { data: family } = useLearnerFamily(learnerId);
  const { data: allLearners } = useAllLearners();
  const linkFamily = useLinkFamily();
  const removeLink = useRemoveFamilyLink();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    related_learner_id: "",
    relationship_type: "brother",
    is_emergency_contact: false,
    notes: "",
  });

  const existingIds = new Set((family || []).map((f: any) => f.related_learner?.id));
  existingIds.add(learnerId);
  const availableLearners = (allLearners || []).filter((l: any) => !existingIds.has(l.id));

  const submit = async () => {
    await linkFamily.mutateAsync({
      learner_id: learnerId,
      ...form,
    });
    setOpen(false);
    setForm({ related_learner_id: "", relationship_type: "brother", is_emergency_contact: false, notes: "" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Family Relationships
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Link Family</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Link Family Member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Related Learner</Label>
                <Select value={form.related_learner_id} onValueChange={(v) => setForm({...form, related_learner_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select learner..." /></SelectTrigger>
                  <SelectContent>
                    {availableLearners.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.full_name} ({l.admission_number || "—"}) {l.classes?.name ? `- ${l.classes.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Relationship Type</Label>
                <Select value={form.relationship_type} onValueChange={(v) => setForm({...form, relationship_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emergency"
                  checked={form.is_emergency_contact}
                  onChange={(e) => setForm({...form, is_emergency_contact: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="emergency">Emergency contact</Label>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Optional notes" />
              </div>
              <Button onClick={submit} className="w-full" disabled={!form.related_learner_id || linkFamily.isPending}>
                {linkFamily.isPending ? "Linking..." : "Link Family Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!family?.length ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            <p>No family relationships linked yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(family || []).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{f.related_learner?.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize text-xs">
                        {f.relationship_type?.replace("_", " ")}
                      </Badge>
                      {f.related_learner?.admission_number && (
                        <span>{f.related_learner.admission_number}</span>
                      )}
                      {f.related_learner?.classes?.name && (
                        <span>• {f.related_learner.classes.name}</span>
                      )}
                      {f.is_emergency_contact && <Badge variant="secondary" className="text-xs">Emergency Contact</Badge>}
                    </div>
                    {f.notes && <p className="text-xs text-muted-foreground mt-1">{f.notes}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeLink.mutate(f.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
