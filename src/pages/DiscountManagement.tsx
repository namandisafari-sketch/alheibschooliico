// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Percent, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import {
  useDiscountRules, useDiscountApplications, useCreateDiscountRule,
  useUpdateDiscountRule, useDeleteDiscountRule, useApproveDiscount,
} from "@/hooks/useDiscounts";
import { format } from "date-fns";

const RULE_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount (UGX)" },
];
const APPLIES_TO = [
  { value: "all", label: "All Learners" },
  { value: "pupil_status", label: "Pupil Status" },
  { value: "class", label: "Class Level" },
  { value: "learner", label: "Specific Learner" },
  { value: "fee_structure", label: "Specific Fee" },
  { value: "relationship", label: "Relationship (Sibling)" },
];
const APPROVER_ROLES = ["admin", "director", "head_teacher", "accountant"];
const PUPIL_STATUSES = ["orphan", "teacher_child", "bait_zakat", "iico", "community", "paying", "other"];

const defaultForm = {
  name: "",
  description: "",
  discount_type: "percentage",
  value: "",
  priority: "0",
  applies_to: "all",
  filter_value: "",
  max_cap: "",
  requires_approval: true,
  approver_role: "admin",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

const DiscountManagement = () => {
  const { data: rules } = useDiscountRules();
  const { data: applications } = useDiscountApplications();
  const createRule = useCreateDiscountRule();
  const updateRule = useUpdateDiscountRule();
  const deleteRule = useDeleteDiscountRule();
  const approveDiscount = useApproveDiscount();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);

  const openEdit = (rule: any) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      description: rule.description || "",
      discount_type: rule.discount_type,
      value: String(rule.value),
      priority: String(rule.priority),
      applies_to: rule.applies_to,
      filter_value: rule.filter_value || "",
      max_cap: rule.max_cap ? String(rule.max_cap) : "",
      requires_approval: rule.requires_approval,
      approver_role: rule.approver_role,
      valid_from: rule.valid_from || "",
      valid_until: rule.valid_until || "",
      is_active: rule.is_active,
    });
    setOpen(true);
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditing(null);
  };

  const submit = async () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      discount_type: form.discount_type,
      value: Number(form.value),
      priority: Number(form.priority),
      applies_to: form.applies_to,
      filter_value: form.filter_value || null,
      max_cap: form.max_cap ? Number(form.max_cap) : null,
      requires_approval: form.requires_approval,
      approver_role: form.approver_role,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
    };
    if (editing) await updateRule.mutateAsync({ id: editing.id, ...payload });
    else await createRule.mutateAsync(payload);
    setOpen(false);
    resetForm();
  };

  const pendingApps = (applications || []).filter((a: any) => a.status === "pending");

  return (
    <DashboardLayout title="Discount Management" subtitle="Configure and manage fee discount rules">
      <div className="space-y-6">
        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules"><Percent className="h-4 w-4 mr-1" /> Discount Rules</TabsTrigger>
            <TabsTrigger value="applications">
              Approvals
              {pendingApps.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">{pendingApps.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={open && !editing} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> New Discount Rule</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Discount Rule</DialogTitle></DialogHeader>
                  <RuleForm form={form} setForm={setForm} onSubmit={submit} isLoading={createRule.isPending || updateRule.isPending} />
                </DialogContent>
              </Dialog>
            </div>

            {editing && (
              <Dialog open={!!editing} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Edit Discount Rule</DialogTitle></DialogHeader>
                  <RuleForm form={form} setForm={setForm} onSubmit={submit} isLoading={updateRule.isPending} />
                </DialogContent>
              </Dialog>
            )}

            {!rules?.length ? (
              <Card><CardContent className="text-center py-12 text-muted-foreground">No discount rules configured yet</CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(rules || []).map((r: any) => (
                  <Card key={r.id} className={r.is_active ? "" : "opacity-60"}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Percent className="h-4 w-4 text-emerald-600" />
                          {r.name}
                        </CardTitle>
                        <Badge variant={r.discount_type === "percentage" ? "default" : "secondary"}>
                          {r.discount_type === "percentage" ? `${r.value}%` : `UGX ${Number(r.value).toLocaleString()}`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {r.description && <p className="text-xs text-muted-foreground mb-2">{r.description}</p>}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className="text-xs capitalize">{r.applies_to.replace("_", " ")}</Badge>
                        {r.filter_value && <Badge variant="outline" className="text-xs">{r.filter_value}</Badge>}
                        {r.max_cap && <Badge variant="outline" className="text-xs">Cap: UGX {Number(r.max_cap).toLocaleString()}</Badge>}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Switch checked={r.is_active} onCheckedChange={(v) => updateRule.mutate({ id: r.id, is_active: v })} />
                          <span className="text-xs text-muted-foreground">Priority {r.priority}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Pending Discount Approvals</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {!pendingApps.length ? (
                  <div className="text-center py-8 text-muted-foreground">No pending approvals</div>
                ) : (
                  pendingApps.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{a.learner?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.discount_rule?.name} • UGX {Number(a.applied_amount).toLocaleString()}
                          {a.notes && ` • ${a.notes}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-emerald-700"
                          onClick={() => approveDiscount.mutate({ id: a.id, status: "approved" })}>
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600"
                          onClick={() => approveDiscount.mutate({ id: a.id, status: "rejected" })}>
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function RuleForm({ form, setForm, onSubmit, isLoading }: any) {
  return (
    <div className="space-y-3">
      <div><Label>Rule Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Orphan Discount" /></div>
      <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Type *</Label>
          <Select value={form.discount_type} onValueChange={(v) => setForm({...form, discount_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{RULE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Value *</Label>
          <Input type="number" value={form.value} onChange={(e) => setForm({...form, value: e.target.value})}
            placeholder={form.discount_type === "percentage" ? "e.g. 50" : "e.g. 500000"} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Applies To *</Label>
          <Select value={form.applies_to} onValueChange={(v) => setForm({...form, applies_to: v, filter_value: ""})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{APPLIES_TO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {form.applies_to === "pupil_status" && (
          <div><Label>Pupil Status</Label>
            <Select value={form.filter_value} onValueChange={(v) => setForm({...form, filter_value: v})}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>{PUPIL_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div><Label>Max Cap (UGX)</Label><Input type="number" value={form.max_cap} onChange={(e) => setForm({...form, max_cap: e.target.value})} placeholder="Optional" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} /></div>
        <div><Label>Approver Role</Label>
          <Select value={form.approver_role} onValueChange={(v) => setForm({...form, approver_role: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{APPROVER_ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Valid From</Label><Input type="date" value={form.valid_from} onChange={(e) => setForm({...form, valid_from: e.target.value})} /></div>
        <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({...form, valid_until: e.target.value})} /></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={form.requires_approval} onCheckedChange={(v) => setForm({...form, requires_approval: v})} />
          <Label>Requires Approval</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.is_active} onCheckedChange={(v) => setForm({...form, is_active: v})} />
          <Label>Active</Label>
        </div>
      </div>
      <Button onClick={onSubmit} className="w-full" disabled={!form.name || !form.value || isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {editing ? "Update Rule" : "Create Rule"}
      </Button>
    </div>
  );
}

export default DiscountManagement;
