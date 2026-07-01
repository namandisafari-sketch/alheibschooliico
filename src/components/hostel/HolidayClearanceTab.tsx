import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle2, ClipboardList, Plus, RotateCcw, XCircle, ChevronLeft, ChevronRight, User, Home, Heart, Package, CheckSquare, ShieldAlert } from "lucide-react";
import { useHolidayArrivalClearances, type HolidayArrivalClearance } from "@/hooks/useHostel";
import { useLearners } from "@/hooks/useLearners";
import { useBroadcastNotification } from "@/hooks/useInAppNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getUgandaDateString } from "@/lib/ugandaTime";

const statusVariant = (status: string) =>
  status === "approved" ? "success" :
  status === "rejected" ? "destructive" :
  status === "pending" ? "secondary" :
  "outline";

const stageDefinitions = [
  { statusKey: "matron_status", noteKey: "matron_notes", label: "Matron" },
  { statusKey: "head_teacher_status", noteKey: "head_teacher_notes", label: "Head Teacher" },
  { statusKey: "internal_supervisor_status", noteKey: "internal_supervisor_notes", label: "Head of Internal" },
  { statusKey: "centre_director_status", noteKey: "centre_director_notes", label: "Centre Director" },
] as const;

type StageKey = (typeof stageDefinitions)[number]["statusKey"];

const getStageByKey = (key: StageKey) => stageDefinitions.find((stage) => stage.statusKey === key)!;

const steps = [
  { id: "learner", label: "Learner", icon: User },
  { id: "guardian", label: "Guardian", icon: Home },
  { id: "health", label: "Health", icon: Heart },
  { id: "inventory", label: "Items", icon: Package },
  { id: "review", label: "Review", icon: CheckSquare },
];

const NewClearanceDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    learner_id: "",
    arrival_date: getUgandaDateString(),
    holiday_type: "",
    guardian_name: "",
    relative_relationship: "",
    phone_number: "",
    dormitory_number: "",
    proposed_dormitory: "",
    weight: "",
    height: "",
    chronic_disease_history: "",
    health_status: "",
    health_signature: "",
    school_uniforms: "0",
    sports_wear: "0",
    sweater: "0",
    track_suits: "0",
    shoes: "0",
    kanzu_hijab: "0",
    vests: "0",
    casual_wears: "0",
    cap_veils: "0",
    stockings: "0",
    underwear_pants: "0",
    matron_notes: "",
  });
  const { create } = useHolidayArrivalClearances();
  const learners = useLearners();

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setStep(0);
    setForm({
      learner_id: "",
      arrival_date: getUgandaDateString(),
      holiday_type: "",
      guardian_name: "",
      relative_relationship: "",
      phone_number: "",
      dormitory_number: "",
      proposed_dormitory: "",
      weight: "",
      height: "",
      chronic_disease_history: "",
      health_status: "",
      health_signature: "",
      school_uniforms: "0",
      sports_wear: "0",
      sweater: "0",
      track_suits: "0",
      shoes: "0",
      kanzu_hijab: "0",
      vests: "0",
      casual_wears: "0",
      cap_veils: "0",
      stockings: "0",
      underwear_pants: "0",
      matron_notes: "",
    });
  };

  const inventoryItems = [
    { key: "school_uniforms", label: "School Uniforms" },
    { key: "sports_wear", label: "Sports Wear" },
    { key: "sweater", label: "Sweater" },
    { key: "track_suits", label: "Track Suits" },
    { key: "shoes", label: "Shoes" },
    { key: "kanzu_hijab", label: "Kanzu / Hijab" },
    { key: "vests", label: "Vests" },
    { key: "casual_wears", label: "Casual Wears" },
    { key: "cap_veils", label: "Cap / Veils" },
    { key: "stockings", label: "Stockings" },
    { key: "underwear_pants", label: "Underwear / Pants" },
  ];

  const canNext = () => {
    if (step === 0) return !!form.learner_id && !!form.arrival_date;
    return true;
  };

  const submitEnabled = !!form.learner_id && !!form.arrival_date && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200">
          <Plus className="h-4 w-4 mr-2" /> New Clearance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Holiday Arrival Clearance</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6 -mx-1">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1 relative">
                <div className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-colors z-10",
                  isDone ? "bg-emerald-500 text-white" :
                  isActive ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2" :
                  "bg-slate-100 text-slate-400"
                )}>
                  {isDone ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                </div>
                <span className={cn(
                  "text-[9px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:block",
                  isActive || isDone ? "text-slate-900" : "text-slate-400"
                )}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "absolute top-4 md:top-5 left-[60%] right-[-40%] h-0.5 -z-0",
                    isDone ? "bg-emerald-500" : "bg-slate-200"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-5 min-h-[300px] md:min-h-[320px]">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Learner</Label>
                  <Select value={form.learner_id} onValueChange={(v) => updateField("learner_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {(learners.data || []).map((learner: any) => (
                        <SelectItem key={learner.id} value={learner.id}>{learner.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Arrival Date</Label>
                  <Input type="date" value={form.arrival_date} onChange={(e) => updateField("arrival_date", e.target.value)} />
                </div>
                <div>
                  <Label>Holiday Period / Reason</Label>
                  <Input value={form.holiday_type} onChange={(e) => updateField("holiday_type", e.target.value)} placeholder="E.g. Eid holiday, midterm break" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Guardian Name</Label>
                  <Input value={form.guardian_name} onChange={(e) => updateField("guardian_name", e.target.value)} />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input value={form.relative_relationship} onChange={(e) => updateField("relative_relationship", e.target.value)} placeholder="E.g. Father, Mother" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={form.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} type="tel" />
                </div>
                <div>
                  <Label>Dormitory #</Label>
                  <Input value={form.dormitory_number} onChange={(e) => updateField("dormitory_number", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Proposed Dormitory</Label>
                  <Input value={form.proposed_dormitory} onChange={(e) => updateField("proposed_dormitory", e.target.value)} placeholder="Dormitory name or block" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" min={0} step="0.1" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} />
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input type="number" min={0} step="0.1" value={form.height} onChange={(e) => updateField("height", e.target.value)} />
                </div>
                <div>
                  <Label>Health Status</Label>
                  <Select value={form.health_status} onValueChange={(v) => updateField("health_status", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="attention">Needs Attention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Disclosure of Chronic Disease / History</Label>
                <Textarea value={form.chronic_disease_history} onChange={(e) => updateField("chronic_disease_history", e.target.value)} placeholder="Any known medical conditions..." />
              </div>
              <div>
                <Label>Health Signature</Label>
                <Input value={form.health_signature} onChange={(e) => updateField("health_signature", e.target.value)} placeholder="Name / signature note" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dormitory Items Inventory</p>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {inventoryItems.map((item) => (
                  <div key={item.key}>
                    <Label className="text-[11px]">{item.label}</Label>
                    <Input type="number" min={0} value={(form as any)[item.key]} onChange={(e) => updateField(item.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Learner</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {learners.data?.find((l: any) => l.id === form.learner_id)?.full_name || "Not selected"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Arrival Date</p>
                  <p className="text-sm font-semibold text-slate-900">{form.arrival_date}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Guardian</p>
                  <p className="text-sm font-semibold text-slate-900">{form.guardian_name || "—"}</p>
                  <p className="text-[11px] text-slate-500">{form.phone_number}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Holiday Reason</p>
                  <p className="text-sm font-semibold text-slate-900">{form.holiday_type || "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Dormitory Items</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {inventoryItems.filter((item) => Number((form as any)[item.key]) > 0).map((item) => (
                    <div key={item.key} className="bg-slate-50 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-600 truncate mr-1">{item.label}</span>
                      <span className="text-xs font-bold text-slate-900">{(form as any)[item.key]}</span>
                    </div>
                  ))}
                  {inventoryItems.every((item) => Number((form as any)[item.key]) === 0) && (
                    <p className="text-xs text-slate-400 col-span-full">No items recorded</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Matron Notes</Label>
                <Textarea value={form.matron_notes} onChange={(e) => updateField("matron_notes", e.target.value)} placeholder="Optional notes for the first review stage" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-4">
          <div className="flex gap-2 w-full sm:w-auto">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="flex-1 sm:flex-none">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {step < steps.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1 sm:flex-none">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button size="sm" disabled={!submitEnabled} onClick={() => {
                  create.mutate({
                    ...form,
                    school_uniforms: Number(form.school_uniforms),
                    sports_wear: Number(form.sports_wear),
                    sweater: Number(form.sweater),
                    track_suits: Number(form.track_suits),
                    shoes: Number(form.shoes),
                    kanzu_hijab: Number(form.kanzu_hijab),
                    vests: Number(form.vests),
                    casual_wears: Number(form.casual_wears),
                    cap_veils: Number(form.cap_veils),
                    stockings: Number(form.stockings),
                    underwear_pants: Number(form.underwear_pants),
                  }, {
                    onSuccess: () => { setOpen(false); resetForm(); },
                  });
                }} className="flex-1 sm:flex-none">
                  {create.isPending ? "Submitting..." : "Create Clearance"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getStageApproverRoles = (stageKey: StageKey) => {
  switch (stageKey) {
    case "matron_status":
      return ["matron", "staff"];
    case "head_teacher_status":
      return ["head_teacher"];
    case "internal_supervisor_status":
      return ["dos", "staff", "head_of_internal"];
    case "centre_director_status":
      return ["center_director", "director", "admin"];
    default:
      return ["staff"];
  }
};

const getNextStage = (stageKey: StageKey) => {
  const index = stageDefinitions.findIndex((stage) => stage.statusKey === stageKey);
  return index >= 0 && index < stageDefinitions.length - 1 ? stageDefinitions[index + 1] : null;
};

const getApproverUserIds = async (stageKey: StageKey) => {
  const roles = getStageApproverRoles(stageKey);
  const { data, error } = await supabase.from("user_roles").select("user_id").in("role", roles);
  if (error) throw error;
  return Array.from(new Set((data || []).map((role: any) => role.user_id)));
};

const UpdateStageDialog = ({ clearance }: { clearance: HolidayArrivalClearance }) => {
  const [open, setOpen] = useState(false);
  const nextStage = stageDefinitions.find((stage) => clearance[stage.statusKey] === "pending") ?? stageDefinitions[0];
  const [stageKey, setStageKey] = useState<StageKey>(nextStage.statusKey);
  const [status, setStatus] = useState("approved");
  const [notes, setNotes] = useState("");
  const { updateStage } = useHolidayArrivalClearances();
  const broadcast = useBroadcastNotification();

  const notifyNextApprover = async (approvedStageKey: StageKey) => {
    const nextStage = getNextStage(approvedStageKey);
    if (!nextStage) return;
    const userIds = await getApproverUserIds(nextStage.statusKey);
    if (userIds.length === 0) return;

    await broadcast.mutateAsync({
      title: `${nextStage.label} review required`,
      message: `Learner ${clearance.learner?.full_name || "unknown"} needs ${nextStage.label} approval for holiday arrival clearance.`,
      audience: "user_ids",
      user_ids: userIds,
      type: "info",
      link: "/hostel",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) { setStatus("approved"); setNotes(""); setStageKey(nextStage.statusKey); } setOpen(value); }}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full">Update Status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Clearance Stage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Office</Label>
            <Select value={stageKey} onValueChange={(value) => setStageKey(value as StageKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stageDefinitions.map((stage) => (
                  <SelectItem key={stage.statusKey} value={stage.statusKey}>{stage.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Action</Label>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes for this stage" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={updateStage.isPending}
            onClick={async () => {
              const stage = getStageByKey(stageKey);
              const payload: any = {
                id: clearance.id,
                [stage.statusKey]: status,
                status: status === "rejected" ? "rejected" : stageKey === "centre_director_status" && status === "approved" ? "completed" : "in_progress",
              };
              if (notes) payload[stage.noteKey] = notes;

              updateStage.mutate(payload, {
                onSuccess: async () => {
                  if (status === "approved") {
                    try {
                      await notifyNextApprover(stageKey);
                    } catch (error) {
                      console.error("Failed to notify next approver", error);
                    }
                  }
                  setOpen(false);
                },
              });
            }}
          >
            Save Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const HolidayClearanceTab = () => {
  const { list } = useHolidayArrivalClearances();
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!list.data) return [];
    return list.data.filter((clearance) => {
      const learnerName = clearance.learner?.full_name || "";
      const admission = clearance.learner?.admission_number || "";
      const holidayType = clearance.holiday_type || "";
      const matchesSearch = [learnerName, admission, holidayType].some((value) => value.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterStage === "all") return true;
      if (filterStage === "completed") return clearance.status === "completed";
      if (filterStage === "rejected") return clearance.status === "rejected";
      const currentStage = stageDefinitions.find((stage) => clearance[stage.statusKey] === "pending");
      return currentStage?.statusKey === filterStage;
    });
  }, [list.data, search, filterStage]);

  const userCanApproveStage = (clearance: HolidayArrivalClearance) => {
    if (clearance.status === "completed" || clearance.status === "rejected") return false;
    const pendingStage = stageDefinitions.find((stage) => clearance[stage.statusKey] === "pending");
    if (!pendingStage) return false;
    const authorizedRoles = getStageApproverRoles(pendingStage.statusKey);
    return authorizedRoles.includes(role || "");
  };

  const actionsNeeded = useMemo(() => {
    if (!list.data || !role) return 0;
    return list.data.filter((c) => {
      if (c.status === "completed" || c.status === "rejected") return false;
      const pendingStage = stageDefinitions.find((stage) => c[stage.statusKey] === "pending");
      if (!pendingStage) return false;
      return getStageApproverRoles(pendingStage.statusKey).includes(role);
    }).length;
  }, [list.data, role]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Holiday Arrival Clearance</p>
          <p className="text-sm text-muted-foreground">Track learners through arrival clearance, health checks, and administration sign-off.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Input
              className="pr-10"
              placeholder="Search learner or holiday type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <NewClearanceDialog />
        </div>
      </div>

      {actionsNeeded > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-medium">{actionsNeeded} clearance{actionsNeeded > 1 ? "s" : ""} pending your review</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={filterStage === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilterStage("all")}
        >All</Badge>
        {stageDefinitions.map((stage) => (
          <Badge
            key={stage.statusKey}
            variant={filterStage === stage.statusKey ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStage(stage.statusKey)}
          >{stage.label}</Badge>
        ))}
        <Badge
          variant={filterStage === "completed" ? "success" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilterStage("completed")}
        >Completed</Badge>
        <Badge
          variant={filterStage === "rejected" ? "destructive" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilterStage("rejected")}
        >Rejected</Badge>
      </div>

      {list.isLoading && (
        <div className="py-12 text-center text-slate-500">Loading clearances...</div>
      )}

      {filtered.length === 0 && !list.isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No arrival clearances yet</p>
            <p className="text-sm">Create a holiday arrival clearance to begin the review workflow.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filtered.map((clearance) => {
          const currentStage = stageDefinitions.find((stage) => clearance[stage.statusKey] === "pending");
          const isCompleted = clearance.status === "completed";
          const canApprove = userCanApproveStage(clearance);
          return (
            <Card key={clearance.id} className="border-none shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alheib Social Welfare Centre</p>
                    <p className="text-2xl font-bold">Holiday Arrival Clearance Sheet</p>
                    <p className="mt-1 text-sm text-slate-600">Residential hostel arrival clearance form</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Arrival Date</p>
                    <p className="mt-1 text-lg font-semibold">{clearance.arrival_date || "—"}</p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-slate-500">Status</p>
                    <Badge variant={isCompleted ? "success" : clearance.status === "rejected" ? "destructive" : "secondary"}>
                      {isCompleted ? "Completed" : clearance.status === "rejected" ? "Rejected" : "In progress"}
                    </Badge>
                    {currentStage && !isCompleted && clearance.status !== "rejected" && (
                      <p className="mt-1 text-[10px] font-semibold text-amber-600">Awaiting: {currentStage.label}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Full Name</p>
                    <p className="mt-2 text-lg font-semibold">{clearance.learner?.full_name || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Class</p>
                    <p className="mt-2 text-lg font-semibold">{clearance.learner?.class_id || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admission #</p>
                    <p className="mt-2 text-lg font-semibold">{clearance.learner?.admission_number || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dormitory #</p>
                    <p className="mt-2 text-lg font-semibold">{clearance.dormitory_number || "—"}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Guardian</p>
                    <p className="mt-2 font-semibold">{clearance.guardian_name || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Relationship</p>
                    <p className="mt-2 font-semibold">{clearance.relative_relationship || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Phone</p>
                    <p className="mt-2 font-semibold">{clearance.phone_number || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Proposed Dormitory</p>
                    <p className="mt-2 font-semibold">{clearance.proposed_dormitory || "—"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="rounded-lg border p-3 bg-slate-50 lg:flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Holiday / Reason</p>
                    <p className="mt-2 font-semibold">{clearance.holiday_type || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50 lg:flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Health Status</p>
                    <p className="mt-2 font-semibold">{clearance.health_status || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50 lg:flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Health Signature</p>
                    <p className="mt-2 font-semibold">{clearance.health_signature || "—"}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-semibold mb-2">Dormitory Items</p>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                        <tr>
                          <th className="px-3 py-2">School Uniforms</th>
                          <th className="px-3 py-2">Sports Wear</th>
                          <th className="px-3 py-2">Sweater</th>
                          <th className="px-3 py-2">Track Suits</th>
                          <th className="px-3 py-2">Shoes</th>
                          <th className="px-3 py-2">Kanzu / Hijab</th>
                          <th className="px-3 py-2">Vests</th>
                          <th className="px-3 py-2">Casual Wears</th>
                          <th className="px-3 py-2">Cap / Veils</th>
                          <th className="px-3 py-2">Stockings</th>
                          <th className="px-3 py-2">Underwear</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white text-sm">
                          <td className="border-t px-3 py-3">{clearance.school_uniforms ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.sports_wear ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.sweater ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.track_suits ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.shoes ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.kanzu_hijab ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.vests ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.casual_wears ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.cap_veils ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.stockings ?? "0"}</td>
                          <td className="border-t px-3 py-3">{clearance.underwear_pants ?? "0"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Weight</p>
                    <p className="font-semibold">{clearance.weight || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Height</p>
                    <p className="font-semibold">{clearance.height || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50 col-span-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Chronic Disease History</p>
                    <p className="font-semibold">{clearance.chronic_disease_history || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Health Status</p>
                    <p className="font-semibold">{clearance.health_status || "—"}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Disclosure / Chronic Disease History</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{clearance.chronic_disease_history || "No history provided."}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stageDefinitions.map((stage) => {
                    const isCurrentPending = currentStage?.statusKey === stage.statusKey;
                    return (
                      <div key={stage.statusKey} className={`rounded-lg border p-3 bg-slate-50 ${isCurrentPending && !isCompleted && clearance.status !== "rejected" ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stage.label}</p>
                        <div className="mt-3 flex items-center gap-2">
                          {clearance[stage.statusKey] === "approved" ? <CheckCircle2 className="h-4 w-4 text-success" /> : clearance[stage.statusKey] === "rejected" ? <XCircle className="h-4 w-4 text-destructive" /> : <RotateCcw className={`h-4 w-4 ${isCurrentPending && !isCompleted ? "text-amber-500 animate-pulse" : "text-amber-500"}`} />}
                          <Badge variant={statusVariant(clearance[stage.statusKey] || "pending")}>{clearance[stage.statusKey] || "pending"}</Badge>
                        </div>
                        {clearance[stage.noteKey] && <p className="mt-2 text-sm text-muted-foreground">{clearance[stage.noteKey]}</p>}
                        <div className="mt-6 border-t border-slate-200 pt-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Signature</p>
                          <div className="mt-3 h-6 border-b border-slate-300"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canApprove && (
                  <div className="flex justify-end">
                    <UpdateStageDialog clearance={clearance} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
