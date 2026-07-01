// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, Heart, Thermometer, Weight, Eye, Activity, Syringe, AlertTriangle, Stethoscope, Pill, Bandage, User, Calendar, Clock, ArrowRight, Building } from "lucide-react";

const useMedicationItems = () =>
  useQuery({
    queryKey: ["pharmacy-items-list"],
    queryFn: async () => {
      const { data } = await supabase.from("pharmacy_items").select("id, name, unit, strength, form").order("name");
      return data || [];
    },
  });

const useStudents = () =>
  useQuery({
    queryKey: ["learners-for-nurse"],
    queryFn: async () => {
      const { data } = await supabase.from("learners").select("id, full_name, admission_number, class_id, gender, date_of_birth, guardian_phone, dormitory").order("full_name");
      return data || [];
    },
    staleTime: 60000,
  });

const dormitoryCache = new Map<string, string>();

const useLearnerDormitory = (learnerId: string) => {
  const { data } = useQuery({
    queryKey: ["learner-dormitory", learnerId],
    queryFn: async () => {
      if (!learnerId) return null;
      if (dormitoryCache.has(learnerId)) return dormitoryCache.get(learnerId);
      const { data: resident } = await supabase
        .from("dormitory_residents")
        .select("dormitory:dormitories(name)")
        .eq("learner_id", learnerId)
        .eq("is_active", true)
        .maybeSingle();
      const name = (resident as any)?.dormitory?.name || null;
      if (name) dormitoryCache.set(learnerId, name);
      return name;
    },
    enabled: !!learnerId,
    staleTime: 120000,
  });
  return data;
};

const calculateAge = (dob: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) years--;
  return years;
};

const DormitoryLabel = ({ learnerId, dormText }: { learnerId: string; dormText?: string | null }) => {
  const dormName = useLearnerDormitory(learnerId);
  return <>{dormName || dormText || "—"}</>;
};

interface NewVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learners: { id: string; full_name: string; admission_number?: string }[];
}

export function NewVisitDialog({ open, onOpenChange, learners }: NewVisitDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: meds } = useMedicationItems();
  const { data: allStudents } = useStudents();

  const [form, setForm] = useState({
    learner_id: "",
    visit_type: "",
    priority: "",
    temperature: "",
    heart_rate: "",
    respiratory_rate: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    blood_oxygen: "",
    weight: "",
    height: "",
    symptoms: "",
    diagnosis: "",
    action_taken: "",
    medication_given: "",
    medication_dose: "",
    medication_route: "",
    follow_up_date: "",
    follow_up_notes: "",
    referred_to: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) setForm({
      learner_id: "", visit_type: "", priority: "", temperature: "", heart_rate: "",
      respiratory_rate: "", blood_pressure_systolic: "", blood_pressure_diastolic: "",
      blood_oxygen: "", weight: "", height: "", symptoms: "", diagnosis: "",
      action_taken: "", medication_given: "", medication_dose: "", medication_route: "",
      follow_up_date: "", follow_up_notes: "", referred_to: "", notes: "",
    });
  }, [open]);

  const selectedLearner = allStudents?.find((s) => s.id === form.learner_id);

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const visitData: Record<string, any> = {
        learner_id: values.learner_id || null,
        visit_type: values.visit_type || "illness",
        priority: values.priority || "low",
        temperature: values.temperature ? parseFloat(values.temperature) : null,
        heart_rate: values.heart_rate ? parseInt(values.heart_rate) : null,
        respiratory_rate: values.respiratory_rate ? parseInt(values.respiratory_rate) : null,
        blood_pressure_systolic: values.blood_pressure_systolic ? parseInt(values.blood_pressure_systolic) : null,
        blood_pressure_diastolic: values.blood_pressure_diastolic ? parseInt(values.blood_pressure_diastolic) : null,
        blood_oxygen: values.blood_oxygen ? parseInt(values.blood_oxygen) : null,
        weight: values.weight ? parseFloat(values.weight) : null,
        height: values.height ? parseFloat(values.height) : null,
        symptoms: values.symptoms || null,
        diagnosis: values.diagnosis || null,
        action_taken: values.action_taken || null,
        medication_given: values.medication_given || null,
        medication_dose: values.medication_dose || null,
        medication_route: values.medication_route || null,
        follow_up_date: values.follow_up_date || null,
        follow_up_notes: values.follow_up_notes || null,
        referred_to: values.referred_to || null,
        notes: values.notes || null,
        recorded_by: user?.id,
        visit_date: new Date().toISOString(),
      };
      const { error } = await supabase.from("health_visits").insert(visitData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurse-stats"] });
      queryClient.invalidateQueries({ queryKey: ["health-visits"] });
      queryClient.invalidateQueries({ queryKey: ["nurse-stats-enhanced"] });
      toast({ title: "Visit Recorded", description: "Clinic visit has been logged with full clinical data." });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" /> New Clinic Visit
          </DialogTitle>
          <DialogDescription>Record a comprehensive clinical encounter</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Patient Information
            </h4>
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              <SearchableSelect
                options={learners.map((l) => ({ value: l.id, label: `${l.full_name}${l.admission_number ? ` (${l.admission_number})` : ""}`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                value={form.learner_id}
                onValueChange={(v) => setForm(p => ({ ...p, learner_id: v }))}
                placeholder="Select student..."
                searchPlaceholder="Search by name or admission..."
              />
            </div>
            {selectedLearner && (
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div><span className="font-semibold">Class:</span> {selectedLearner.class_id || "—"}</div>
                <div><span className="font-semibold">Gender:</span> {selectedLearner.gender || "—"}</div>
                <div><span className="font-semibold">Age:</span> {calculateAge(selectedLearner.date_of_birth) !== null ? `${calculateAge(selectedLearner.date_of_birth)} yrs` : "—"}</div>
                <div><span className="font-semibold">Dormitory:</span> <DormitoryLabel learnerId={form.learner_id} dormText={selectedLearner.dormitory} /></div>
                <div><span className="font-semibold">Guardian:</span> {selectedLearner.guardian_phone || "—"}</div>
              </div>
            )}
          </div>

          {/* Visit Details */}
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> Visit Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Type <span className="text-destructive">*</span></Label>
                <Select value={form.visit_type} onValueChange={(v) => setForm(p => ({ ...p, visit_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="illness">Illness / Sickness</SelectItem>
                    <SelectItem value="injury">Injury / Trauma</SelectItem>
                    <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                    <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="medication_refill">Medication Refill</SelectItem>
                    <SelectItem value="referral">Referral Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority <span className="text-destructive">*</span></Label>
                <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — Routine</SelectItem>
                    <SelectItem value="medium">Medium — Non-urgent</SelectItem>
                    <SelectItem value="high">High — Urgent</SelectItem>
                    <SelectItem value="critical">Critical — Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Vital Signs
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temp (°C)</Label>
                <Input type="number" step="0.1" placeholder="37.0" value={form.temperature} onChange={(e) => setForm(p => ({ ...p, temperature: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Heart className="h-3 w-3" /> Heart Rate (bpm)</Label>
                <Input type="number" placeholder="72" value={form.heart_rate} onChange={(e) => setForm(p => ({ ...p, heart_rate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Resp. Rate (/min)</Label>
                <Input type="number" placeholder="16" value={form.respiratory_rate} onChange={(e) => setForm(p => ({ ...p, respiratory_rate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SpO₂ (%)</Label>
                <Input type="number" placeholder="98" value={form.blood_oxygen} onChange={(e) => setForm(p => ({ ...p, blood_oxygen: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">BP Systolic</Label>
                <Input type="number" placeholder="120" value={form.blood_pressure_systolic} onChange={(e) => setForm(p => ({ ...p, blood_pressure_systolic: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">BP Diastolic</Label>
                <Input type="number" placeholder="80" value={form.blood_pressure_diastolic} onChange={(e) => setForm(p => ({ ...p, blood_pressure_diastolic: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Weight className="h-3 w-3" /> Weight (kg)</Label>
                <Input type="number" step="0.1" placeholder="45" value={form.weight} onChange={(e) => setForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (cm)</Label>
                <Input type="number" step="0.5" placeholder="150" value={form.height} onChange={(e) => setForm(p => ({ ...p, height: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Clinical Assessment */}
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-3.5 w-3.5" /> Clinical Assessment
            </h4>
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <Textarea placeholder="Describe presenting symptoms in detail..." rows={2} value={form.symptoms} onChange={(e) => setForm(p => ({ ...p, symptoms: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis / Impression</Label>
              <Input placeholder="Provisional diagnosis" value={form.diagnosis} onChange={(e) => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
            </div>
          </div>

          {/* Treatment & Action */}
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Pill className="h-3.5 w-3.5" /> Treatment & Action
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action Taken</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, action_taken: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rest in sick bay">Rest in sick bay</SelectItem>
                    <SelectItem value="Given medication">Given medication</SelectItem>
                    <SelectItem value="Sent home">Sent home</SelectItem>
                    <SelectItem value="Referred to hospital">Referred to hospital</SelectItem>
                    <SelectItem value="First aid administered">First aid administered</SelectItem>
                    <SelectItem value="Counseling provided">Counseling provided</SelectItem>
                    <SelectItem value="Returned to class">Returned to class</SelectItem>
                    <SelectItem value="Admitted to sick bay">Admitted to sick bay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referred To</Label>
                <Input placeholder="e.g. Wakiso Health Center" value={form.referred_to} onChange={(e) => setForm(p => ({ ...p, referred_to: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Medication Given</Label>
                <SearchableSelect
                  options={[...(meds || []).map((m: any) => ({ value: m.name, label: `${m.name}${m.strength ? ` (${m.strength})` : ""}`, searchTerms: [m.name, m.strength || ""] })), { value: "other", label: "Other (type below)" }]}
                  value={form.medication_given}
                  onValueChange={(v) => setForm(p => ({ ...p, medication_given: v }))}
                  placeholder="Select med..."
                  searchPlaceholder="Search medication..."
                />
              </div>
              <div className="space-y-2">
                <Label>Dose</Label>
                <Input placeholder="e.g. 500mg" value={form.medication_dose} onChange={(e) => setForm(p => ({ ...p, medication_dose: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, medication_route: v }))}>
                  <SelectTrigger><SelectValue placeholder="Route" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                    <SelectItem value="intramuscular">Intramuscular (IM)</SelectItem>
                    <SelectItem value="intravenous">Intravenous (IV)</SelectItem>
                    <SelectItem value="subcutaneous">Subcutaneous (SC)</SelectItem>
                    <SelectItem value="inhalation">Inhalation</SelectItem>
                    <SelectItem value="rectal">Rectal</SelectItem>
                    <SelectItem value="ophthalmic">Ophthalmic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Follow-up Plan
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input type="date" value={form.follow_up_date} onChange={(e) => setForm(p => ({ ...p, follow_up_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Follow-up Notes</Label>
                <Input placeholder="Instructions for next visit" value={form.follow_up_notes} onChange={(e) => setForm(p => ({ ...p, follow_up_notes: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea placeholder="Any other observations or notes..." rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full gap-2 h-11" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.learner_id}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <ArrowRight className="h-4 w-4" />
            Record Complete Visit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Log Trauma Dialog ──────────────────────────────────────────────────────

interface LogTraumaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learners: { id: string; full_name: string }[];
}

export function LogTraumaDialog({ open, onOpenChange, learners }: LogTraumaDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    learner_id: "",
    type: "",
    severity: "",
    body_part: "",
    cause: "",
    location_occurred: "",
    witnessed_by: "",
    description: "",
    action_taken: "",
    first_aid_given: "",
    referred_to: "",
    notified_guardian: "no",
    notified_teacher: "no",
    follow_up_required: "no",
    notes: "",
  });

  useEffect(() => {
    if (!open) setForm({
      learner_id: "", type: "", severity: "", body_part: "", cause: "",
      location_occurred: "", witnessed_by: "", description: "", action_taken: "",
      first_aid_given: "", referred_to: "", notified_guardian: "no",
      notified_teacher: "no", follow_up_required: "no", notes: "",
    });
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("medical_incidents").insert({
        learner_id: values.learner_id || null,
        type: values.type || "Injury",
        severity: values.severity || "low",
        body_part: values.body_part || null,
        cause: values.cause || null,
        location_occurred: values.location_occurred || null,
        witnessed_by: values.witnessed_by || null,
        description: values.description || null,
        action_taken: values.action_taken || null,
        first_aid_given: values.first_aid_given || null,
        referred_to: values.referred_to || null,
        notified_guardian: values.notified_guardian === "yes",
        notified_teacher: values.notified_teacher === "yes",
        follow_up_required: values.follow_up_required === "yes",
        notes: values.notes || null,
        recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurse-stats"] });
      queryClient.invalidateQueries({ queryKey: ["medical-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["nurse-stats-enhanced"] });
      toast({ title: "Incident Logged", description: "Trauma/incident has been recorded with full details." });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Log Trauma / Incident
          </DialogTitle>
          <DialogDescription>Comprehensive incident reporting form</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Incident Details</h4>
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              <SearchableSelect
                options={learners.map((l) => ({ value: l.id, label: `${l.full_name}${l.admission_number ? ` (${l.admission_number})` : ""}`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                value={form.learner_id}
                onValueChange={(v) => setForm(p => ({ ...p, learner_id: v }))}
                placeholder="Select student..."
                searchPlaceholder="Search by name or admission..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incident Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Injury">Injury</SelectItem>
                    <SelectItem value="Fainting">Fainting / Collapse</SelectItem>
                    <SelectItem value="Allergic Reaction">Allergic Reaction</SelectItem>
                    <SelectItem value="Seizure">Seizure / Convulsion</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Burn">Burn</SelectItem>
                    <SelectItem value="Fight">Physical Fight</SelectItem>
                    <SelectItem value="Sports Injury">Sports Injury</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm(p => ({ ...p, severity: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — Minor (first aid only)</SelectItem>
                    <SelectItem value="medium">Medium — Moderate (needs assessment)</SelectItem>
                    <SelectItem value="high">High — Severe (needs referral)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Body Part Affected</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, body_part: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select body part" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">Head</SelectItem>
                    <SelectItem value="face">Face</SelectItem>
                    <SelectItem value="eye">Eye</SelectItem>
                    <SelectItem value="neck">Neck</SelectItem>
                    <SelectItem value="shoulder">Shoulder</SelectItem>
                    <SelectItem value="chest">Chest</SelectItem>
                    <SelectItem value="abdomen">Abdomen</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="arm_left">Left Arm</SelectItem>
                    <SelectItem value="arm_right">Right Arm</SelectItem>
                    <SelectItem value="hand_left">Left Hand</SelectItem>
                    <SelectItem value="hand_right">Right Hand</SelectItem>
                    <SelectItem value="leg_left">Left Leg</SelectItem>
                    <SelectItem value="leg_right">Right Leg</SelectItem>
                    <SelectItem value="foot_left">Left Foot</SelectItem>
                    <SelectItem value="foot_right">Right Foot</SelectItem>
                    <SelectItem value="multiple">Multiple Areas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cause / Mechanism</Label>
                <Input placeholder="e.g. fell from stairs" value={form.cause} onChange={(e) => setForm(p => ({ ...p, cause: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location of Incident</Label>
                <Input placeholder="e.g. Playground, Classroom 3B" value={form.location_occurred} onChange={(e) => setForm(p => ({ ...p, location_occurred: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Witnessed By</Label>
                <Input placeholder="Name(s) of witness" value={form.witnessed_by} onChange={(e) => setForm(p => ({ ...p, witnessed_by: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Response & Actions</h4>
            <div className="space-y-2">
              <Label>Description of Incident</Label>
              <Textarea placeholder="Describe what happened in detail..." rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>First Aid Given</Label>
              <Textarea placeholder="e.g. Cleaned wound, applied antiseptic and bandage" rows={2} value={form.first_aid_given} onChange={(e) => setForm(p => ({ ...p, first_aid_given: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action Taken</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, action_taken: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First aid administered">First aid administered</SelectItem>
                    <SelectItem value="Sent to sick bay">Sent to sick bay</SelectItem>
                    <SelectItem value="Sent to hospital">Sent to hospital</SelectItem>
                    <SelectItem value="Returned to class">Returned to class</SelectItem>
                    <SelectItem value="Sent home">Sent home</SelectItem>
                    <SelectItem value="Counseled">Counseled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referred To</Label>
                <Input placeholder="e.g. Referral facility" value={form.referred_to} onChange={(e) => setForm(p => ({ ...p, referred_to: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications & Follow-up</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Guardian Notified</Label>
                <Select value={form.notified_guardian} onValueChange={(v) => setForm(p => ({ ...p, notified_guardian: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teacher Notified</Label>
                <Select value={form.notified_teacher} onValueChange={(v) => setForm(p => ({ ...p, notified_teacher: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Follow-up Required</Label>
                <Select value={form.follow_up_required} onValueChange={(v) => setForm(p => ({ ...p, follow_up_required: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea placeholder="Any other relevant information..." rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full gap-2 h-11" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.learner_id}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <AlertTriangle className="h-4 w-4" />
            Log Complete Incident Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Health Screen Dialog ───────────────────────────────────────────────────

interface HealthScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learners: { id: string; full_name: string; admission_number?: string }[];
}

export function HealthScreenDialog({ open, onOpenChange, learners }: HealthScreenDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    learner_id: "",
    temperature: "",
    heart_rate: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    blood_oxygen: "",
    weight: "",
    height: "",
    bmi: "",
    vision_left: "",
    vision_right: "",
    hearing_left: "",
    hearing_right: "",
    dental_condition: "",
    nutritional_status: "",
    immunization_status: "",
    allergies: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) setForm({
      learner_id: "", temperature: "", heart_rate: "", blood_pressure_systolic: "",
      blood_pressure_diastolic: "", blood_oxygen: "", weight: "", height: "", bmi: "",
      vision_left: "", vision_right: "", hearing_left: "", hearing_right: "",
      dental_condition: "", nutritional_status: "", immunization_status: "",
      allergies: "", notes: "",
    });
  }, [open]);

  useEffect(() => {
    if (form.weight && form.height) {
      const w = parseFloat(form.weight);
      const h = parseFloat(form.height) / 100;
      if (w > 0 && h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        setForm(p => ({ ...p, bmi }));
      }
    }
  }, [form.weight, form.height]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("health_visits").insert({
        learner_id: values.learner_id || null,
        visit_type: "routine_checkup",
        priority: "low",
        temperature: values.temperature ? parseFloat(values.temperature) : null,
        heart_rate: values.heart_rate ? parseInt(values.heart_rate) : null,
        blood_pressure_systolic: values.blood_pressure_systolic ? parseInt(values.blood_pressure_systolic) : null,
        blood_pressure_diastolic: values.blood_pressure_diastolic ? parseInt(values.blood_pressure_diastolic) : null,
        blood_oxygen: values.blood_oxygen ? parseInt(values.blood_oxygen) : null,
        weight: values.weight ? parseFloat(values.weight) : null,
        height: values.height ? parseFloat(values.height) : null,
        symptoms: `Health Screen — BMI: ${values.bmi || "N/A"}, Vision L/R: ${values.vision_left || "N/A"}/${values.vision_right || "N/A"}, Hearing L/R: ${values.hearing_left || "N/A"}/${values.hearing_right || "N/A"}, Dental: ${values.dental_condition || "N/A"}, Nutrition: ${values.nutritional_status || "N/A"}, Allergies: ${values.allergies || "None"}`,
        action_taken: values.notes || "Routine health screening completed",
        recorded_by: user?.id,
        visit_date: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurse-stats"] });
      queryClient.invalidateQueries({ queryKey: ["health-visits"] });
      queryClient.invalidateQueries({ queryKey: ["nurse-stats-enhanced"] });
      toast({ title: "Screen Recorded", description: "Comprehensive health screening results saved." });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" /> Health Screening
          </DialogTitle>
          <DialogDescription>Comprehensive annual / termly health assessment</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student</h4>
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              <SearchableSelect
                options={learners.map((l) => ({ value: l.id, label: `${l.full_name}${l.admission_number ? ` (${l.admission_number})` : ""}`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                value={form.learner_id}
                onValueChange={(v) => setForm(p => ({ ...p, learner_id: v }))}
                placeholder="Select student..."
                searchPlaceholder="Search by name or admission..."
              />
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vital Signs</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Temp (°C)</Label>
                <Input type="number" step="0.1" placeholder="37.0" value={form.temperature} onChange={(e) => setForm(p => ({ ...p, temperature: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Heart Rate (bpm)</Label>
                <Input type="number" placeholder="72" value={form.heart_rate} onChange={(e) => setForm(p => ({ ...p, heart_rate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SpO₂ (%)</Label>
                <Input type="number" placeholder="98" value={form.blood_oxygen} onChange={(e) => setForm(p => ({ ...p, blood_oxygen: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">BP (S/D)</Label>
                <div className="flex gap-1">
                  <Input type="number" placeholder="120" value={form.blood_pressure_systolic} onChange={(e) => setForm(p => ({ ...p, blood_pressure_systolic: e.target.value }))} className="w-1/2" />
                  <Input type="number" placeholder="80" value={form.blood_pressure_diastolic} onChange={(e) => setForm(p => ({ ...p, blood_pressure_diastolic: e.target.value }))} className="w-1/2" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" step="0.1" placeholder="45" value={form.weight} onChange={(e) => setForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (cm)</Label>
                <Input type="number" step="0.5" placeholder="150" value={form.height} onChange={(e) => setForm(p => ({ ...p, height: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">BMI (auto)</Label>
                <Input readOnly placeholder="auto" value={form.bmi} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nutritional Status</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, nutritional_status: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="underweight">Underweight</SelectItem>
                    <SelectItem value="overweight">Overweight</SelectItem>
                    <SelectItem value="malnourished">Malnourished</SelectItem>
                    <SelectItem value="obese">Obese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Special Senses & Dental</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Vision (Left)</Label>
                <Input placeholder="6/6" value={form.vision_left} onChange={(e) => setForm(p => ({ ...p, vision_left: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vision (Right)</Label>
                <Input placeholder="6/6" value={form.vision_right} onChange={(e) => setForm(p => ({ ...p, vision_right: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hearing (Left)</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, hearing_left: v }))}>
                  <SelectTrigger><SelectValue placeholder="Normal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="impaired">Impaired</SelectItem>
                    <SelectItem value="not_tested">Not Tested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hearing (Right)</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, hearing_right: v }))}>
                  <SelectTrigger><SelectValue placeholder="Normal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="impaired">Impaired</SelectItem>
                    <SelectItem value="not_tested">Not Tested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Dental Condition</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, dental_condition: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good — No issues</SelectItem>
                    <SelectItem value="fair">Fair — Minor cavities</SelectItem>
                    <SelectItem value="poor">Poor — Needs dental referral</SelectItem>
                    <SelectItem value="not_checked">Not Checked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Known Allergies</Label>
                <Input placeholder="e.g. Penicillin, peanuts" value={form.allergies} onChange={(e) => setForm(p => ({ ...p, allergies: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Recommendations</Label>
            <Textarea placeholder="Any observations, referrals, or recommendations..." rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <Button className="w-full gap-2 h-11" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.learner_id}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Activity className="h-4 w-4" />
            Save Screening Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Immunization Dialog ────────────────────────────────────────────────────

interface ImmunizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learners: { id: string; full_name: string; admission_number?: string }[];
}

export function ImmunizationDialog({ open, onOpenChange, learners }: ImmunizationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    learner_id: "",
    vaccine: "",
    batch_number: "",
    dosage: "",
    administration_site: "",
    dose_volume: "",
    manufacturer: "",
    next_dose_date: "",
    reaction_notes: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) setForm({
      learner_id: "", vaccine: "", batch_number: "", dosage: "", administration_site: "",
      dose_volume: "", manufacturer: "", next_dose_date: "", reaction_notes: "", notes: "",
    });
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("health_visits").insert({
        learner_id: values.learner_id || null,
        visit_type: "routine_checkup",
        priority: "low",
        action_taken: `Immunization: ${values.vaccine} (${values.dosage}) — Site: ${values.administration_site || "N/A"}, Dose: ${values.dose_volume || "N/A"}, Batch: ${values.batch_number || "N/A"}, Mfr: ${values.manufacturer || "N/A"}${values.next_dose_date ? `, Next: ${values.next_dose_date}` : ""}`,
        symptoms: values.reaction_notes
          ? `Adverse reaction: ${values.reaction_notes}`
          : `Scheduled immunization — ${values.vaccine}`,
        notes: values.notes || null,
        recorded_by: user?.id,
        visit_date: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurse-stats"] });
      queryClient.invalidateQueries({ queryKey: ["health-visits"] });
      queryClient.invalidateQueries({ queryKey: ["nurse-stats-enhanced"] });
      toast({ title: "Immunization Recorded", description: "Vaccination has been logged with full details." });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Syringe className="h-5 w-5 text-primary" /> Record Immunization
          </DialogTitle>
          <DialogDescription>Log vaccination with full batch and administration details</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient & Vaccine</h4>
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              <SearchableSelect
                options={learners.map((l) => ({ value: l.id, label: `${l.full_name}${l.admission_number ? ` (${l.admission_number})` : ""}`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                value={form.learner_id}
                onValueChange={(v) => setForm(p => ({ ...p, learner_id: v }))}
                placeholder="Select student..."
                searchPlaceholder="Search by name or admission..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vaccine <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, vaccine: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vaccine" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCG">BCG (Tuberculosis)</SelectItem>
                    <SelectItem value="Polio (OPV)">Polio (OPV)</SelectItem>
                    <SelectItem value="DPT-HepB-Hib (Pentavalent)">DPT-HepB-Hib (Pentavalent)</SelectItem>
                    <SelectItem value="PCV">PCV (Pneumococcal)</SelectItem>
                    <SelectItem value="Rotavirus">Rotavirus</SelectItem>
                    <SelectItem value="Measles-Rubella">Measles-Rubella</SelectItem>
                    <SelectItem value="Yellow Fever">Yellow Fever</SelectItem>
                    <SelectItem value="HPV">HPV</SelectItem>
                    <SelectItem value="Td (Tetanus)">Td (Tetanus/Diphtheria)</SelectItem>
                    <SelectItem value="COVID-19">COVID-19</SelectItem>
                    <SelectItem value="Hepatitis B">Hepatitis B</SelectItem>
                    <SelectItem value="Typhoid">Typhoid</SelectItem>
                    <SelectItem value="Cholera">Cholera</SelectItem>
                    <SelectItem value="Meningitis">Meningitis</SelectItem>
                    <SelectItem value="Other">Other (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Select value={form.dosage} onValueChange={(v) => setForm(p => ({ ...p, dosage: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Dose">1st Dose (Primary)</SelectItem>
                    <SelectItem value="2nd Dose">2nd Dose</SelectItem>
                    <SelectItem value="3rd Dose">3rd Dose</SelectItem>
                    <SelectItem value="Booster">Booster</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administration Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Administration Site</Label>
                <Select onValueChange={(v) => setForm(p => ({ ...p, administration_site: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left_deltoid">Left Deltoid</SelectItem>
                    <SelectItem value="right_deltoid">Right Deltoid</SelectItem>
                    <SelectItem value="left_thigh">Left Thigh (Vastus Lateralis)</SelectItem>
                    <SelectItem value="right_thigh">Right Thigh (Vastus Lateralis)</SelectItem>
                    <SelectItem value="left_gluteal">Left Gluteal</SelectItem>
                    <SelectItem value="right_gluteal">Right Gluteal</SelectItem>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dose Volume</Label>
                <Input placeholder="e.g. 0.5ml" value={form.dose_volume} onChange={(e) => setForm(p => ({ ...p, dose_volume: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch / Lot Number</Label>
                <Input placeholder="Batch #" value={form.batch_number} onChange={(e) => setForm(p => ({ ...p, batch_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input placeholder="e.g. Serum Institute" value={form.manufacturer} onChange={(e) => setForm(p => ({ ...p, manufacturer: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-up & Reactions</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next Dose Date</Label>
                <Input type="date" value={form.next_dose_date} onChange={(e) => setForm(p => ({ ...p, next_dose_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Adverse Reaction Notes</Label>
                <Input placeholder="Any reaction observed" value={form.reaction_notes} onChange={(e) => setForm(p => ({ ...p, reaction_notes: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea placeholder="Any other relevant information..." rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full gap-2 h-11" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.learner_id || !form.vaccine}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Syringe className="h-4 w-4" />
            Record Immunization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
