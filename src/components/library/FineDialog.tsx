import { useState, useEffect, JSX } from "react";
import { useLibrary, LibraryMember } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FineDialogProps {
  open: boolean;
  loanId?: string;
  memberId?: string;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function FineDialog({ open, loanId, memberId, onOpenChange, userId }: FineDialogProps): JSX.Element {
  const { members, addFine } = useLibrary();
  const [selectedMemberId, setSelectedMemberId] = useState(memberId || "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMemberId(memberId || "");
      setAmount("");
      setReason("");
    }
  }, [open, memberId]);

  const submit = async () => {
    if (!selectedMemberId || !amount || !reason.trim()) return;
    setSaving(true);
    try {
      await addFine.mutateAsync({
        loan_id: loanId,
        member_id: selectedMemberId,
        amount: Number(amount),
        reason: reason.trim(),
        issued_by: userId || "",
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Fine</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Member</Label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              disabled={!!memberId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {(members.data || []).map((m: LibraryMember) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.id_card_number}
                    {m.profiles?.full_name ? ` - ${m.profiles.full_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (UGX)</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Overdue book return, damaged book"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !selectedMemberId || !amount || !reason.trim()}
          >
            {saving ? "Adding…" : "Add Fine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
