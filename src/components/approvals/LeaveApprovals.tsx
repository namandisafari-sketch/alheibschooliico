// @ts-nocheck
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, Loader2 } from "lucide-react";

interface Props {
  /** "supervisor" = HOD/Manager, "admin" = Administration/Director */
  level: "supervisor" | "admin";
}

export const LeaveApprovals = ({ level }: Props) => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  // Supervisor sees leaves not yet supervisor-decided.
  // Admin sees leaves supervisor-approved but not yet admin-decided.
  const filterCol = level === "supervisor" ? "supervisor_decision" : "admin_decision";
  const { data = [], isLoading } = useQuery({
    queryKey: ["leave-approvals", level],
    queryFn: async () => {
      let q = supabase.from("leave_requests" as any).select("*").is(filterCol, null).order("created_at", { ascending: false });
      const { data } = await q;
      return data || [];
    },
  });

  const decide = async (decision: "approved" | "not_approved") => {
    if (!open) return;
    setBusy(true);
    const now = new Date().toISOString();
    const name = (user as any)?.user_metadata?.full_name || user?.email || "Officer";
    const patch: any = level === "supervisor"
      ? { supervisor_user_id: user!.id, supervisor_name: name, supervisor_decision: decision, supervisor_signed_at: now }
      : { admin_user_id: user!.id, admin_name: name, admin_decision: decision, admin_comments: comment || null, admin_signed_at: now,
          status: decision === "approved" ? "approved" : "rejected" };
    const { error } = await supabase.from("leave_requests" as any).update(patch).eq("id", open.id);
    setBusy(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Leave ${decision === "approved" ? "approved" : "rejected"}` });
    setOpen(null); setComment("");
    qc.invalidateQueries({ queryKey: ["leave-approvals"] });
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black">Leave requests awaiting {level === "supervisor" ? "Supervisor / HOD" : "Administration"} sign-off</h3>
          <Badge variant="secondary">{data.length}</Badge>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nothing awaiting your decision.</p>
        ) : (
          <div className="divide-y">
            {data.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-muted-foreground">{l.form_ref}</p>
                  <p className="font-semibold">{l.employee_full_name || "—"} <span className="text-muted-foreground font-normal">· {l.employee_department}</span></p>
                  <p className="text-xs">{l.leave_type} · {l.start_date} → {l.end_date} · {l.days_count}d</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setOpen(l)}>
                  <Eye className="h-4 w-4 mr-1" />Review
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Review leave request {open?.form_ref}</DialogTitle></DialogHeader>
            {open && (
              <div className="space-y-2 text-sm">
                <KV k="Employee" v={open.employee_full_name} />
                <KV k="Department" v={open.employee_department} />
                <KV k="Position" v={open.employee_position} />
                <KV k="Phone" v={open.employee_phone} />
                <KV k="Type" v={open.leave_type === "other" ? open.leave_type_other : open.leave_type} />
                <KV k="Period" v={`${open.start_date} → ${open.end_date} (${open.days_count} days)`} />
                <KV k="Reason" v={open.reason} />
                <KV k="Covering staff" v={`${open.covering_staff_name || "—"} · ${open.covering_staff_position || ""}`} />
                <KV k="Responsibilities" v={open.responsibilities_summary} />
                {open.supervisor_decision && <KV k="Supervisor decision" v={`${open.supervisor_decision} (by ${open.supervisor_name})`} />}
                {level === "admin" && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mt-2">Administration comments</p>
                    <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Optional comments" />
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => decide("not_approved")} disabled={busy}>
                <X className="h-4 w-4 mr-1" />Reject
              </Button>
              <Button onClick={() => decide("approved")} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const KV = ({ k, v }: any) => (
  <div className="flex gap-3">
    <span className="w-36 shrink-0 text-xs uppercase text-muted-foreground">{k}</span>
    <span className="flex-1 text-sm whitespace-pre-wrap">{v || "—"}</span>
  </div>
);
