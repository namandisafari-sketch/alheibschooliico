import { useState, useEffect, JSX } from "react";
import { useLibrary, LibraryBook, LibraryMember } from "@/hooks/useLibrary";
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

interface IssueDialogProps {
  open: boolean;
  book?: LibraryBook | null;
  onOpenChange: (open: boolean) => void;
  issuerId?: string;
}

export function IssueDialog({ open, book, onOpenChange, issuerId }: IssueDialogProps): JSX.Element {
  const { members, borrowerCandidates, issueLoan } = useLibrary();
  const [borrowerId, setBorrowerId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [dueDays, setDueDays] = useState(14);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setBorrowerId("");
      setBorrowerName("");
      setDueDays(14);
      setNotes("");
    }
  }, [open]);

  const submit = async () => {
    if (!book?.id || !borrowerId) return;
    setSaving(true);
    const due = new Date();
    due.setDate(due.getDate() + Number(dueDays || 14));
    await issueLoan.mutateAsync({
      book_id: book.id,
      borrower_id: borrowerId,
      borrower_name: borrowerName,
      due_at: due.toISOString(),
      issued_by: issuerId || "",
      notes,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue: {book?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Borrower</Label>
            <Select
              value={borrowerId}
              onValueChange={(v) => {
                setBorrowerId(v);
                const b = (borrowerCandidates.data || []).find((x: any) => x.id === v);
                const m = (members.data || []).find((x: any) => x.profile_id === v);
                setBorrowerName(b?.full_name || b?.email || m?.id_card_number || "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {(borrowerCandidates.data || []).map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.full_name || b.email} {b.role ? `· ${b.role}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Loan period (days)</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={dueDays}
              onChange={(e) => setDueDays(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !borrowerId}>
            {saving ? "Issuing…" : "Issue Book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
