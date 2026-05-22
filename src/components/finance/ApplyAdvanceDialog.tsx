// @ts-nocheck
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Coins, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ApplyAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyAdvanceDialog({ open, onOpenChange }: ApplyAdvanceDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [form, setForm] = useState({
    amount: "",
    purpose: "",
    duration: "15 days",
    repayment_schedule: "single" as "single" | "installment"
  });

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Get employee_id for this user
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (empError) throw empError;
      if (!emp) throw new Error("Employee record not found for your account.");

      // 2. Insert advance request
      const { error } = await supabase
        .from("employee_advances")
        .insert({
          employee_id: emp.id,
          amount: Number(form.amount),
          purpose_details: form.purpose,
          duration_text: isCustomDuration ? customDuration : form.duration,
          repayment_schedule: form.repayment_schedule,
          outstanding_balance: Number(form.amount),
          stage: "submitted"
        });

      if (error) throw error;

      toast.success("Advance request submitted successfully!");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["my-advances"] });
      // Reset form
      setForm({ amount: "", purpose: "", duration: "15 days", repayment_schedule: "single" });
      setIsCustomDuration(false);
      setCustomDuration("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Apply for Salary Advance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Requested Amount (UGX)</Label>
            <Input 
              type="number" 
              value={form.amount} 
              onChange={e => setForm({ ...form, amount: e.target.value })} 
              placeholder="e.g. 500000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              {isCustomDuration ? (
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. 45 days" 
                    value={customDuration}
                    onChange={e => setCustomDuration(e.target.value)}
                    className="h-10"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setIsCustomDuration(false);
                      setForm(prev => ({ ...prev, duration: "15 days" }));
                    }} 
                    className="shrink-0 h-10 w-10 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select value={form.duration} onValueChange={v => {
                  if (v === "custom") {
                    setIsCustomDuration(true);
                  } else {
                    setForm({ ...form, duration: v });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 days">15 Days</SelectItem>
                    <SelectItem value="1 month">1 Month</SelectItem>
                    <SelectItem value="2 months">2 Months</SelectItem>
                    <SelectItem value="custom" className="text-amber-600 font-bold italic">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Repayment</Label>
              <Select value={form.repayment_schedule} onValueChange={(v: any) => setForm({ ...form, repayment_schedule: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Payment</SelectItem>
                  <SelectItem value="installment">Installments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Purpose / Reason</Label>
            <Textarea 
              value={form.purpose} 
              onChange={e => setForm({ ...form, purpose: e.target.value })} 
              placeholder="Explain why you need this advance..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.amount || !form.purpose || (isCustomDuration && !customDuration)}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
