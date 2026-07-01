// @ts-nocheck

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, Calendar, Users, ClipboardCheck, FileText, UserCheck, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useAllStaff } from "@/hooks/useStaff";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DailyDutyForm = () => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: staff = [], isLoading: isLoadingStaff } = useAllStaff();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dutyTeachers, setDutyTeachers] = useState<
    { staff_id: string; name: string; role: string; check_in_time: string; signature: string }[]
  >([]);
  const [supervisor, setSupervisor] = useState("");
  const [totalEnrollment, setTotalEnrollment] = useState("");
  const [boysPresent, setBoysPresent] = useState("");
  const [girlsPresent, setGirlsPresent] = useState("");
  const [dayScholars, setDayScholars] = useState("");
  const [sick, setSick] = useState("");
  const [atHome, setAtHome] = useState("");
  const [atSickBay, setAtSickBay] = useState("");
  const [academicReports, setAcademicReports] = useState("");
  const [dosSignature, setDosSignature] = useState("");
  const [headTeacherSignature, setHeadTeacherSignature] = useState("");
  const [headInternalSignature, setHeadInternalSignature] = useState("");
  const [dateSigned, setDateSigned] = useState(format(new Date(), "yyyy-MM-dd"));

  const totalPresent = useMemo(() => {
    const boys = parseInt(boysPresent) || 0;
    const girls = parseInt(girlsPresent) || 0;
    return boys + girls;
  }, [boysPresent, girlsPresent]);

  const { data: existingForm, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["daily-duty-form", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_duty_forms")
        .select("*")
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingForm) {
      setDutyTeachers(existingForm.duty_teachers || []);
      setSupervisor(existingForm.supervisor || "");
      setTotalEnrollment(existingForm.total_enrollment?.toString() || "");
      setBoysPresent(existingForm.boys_present?.toString() || "");
      setGirlsPresent(existingForm.girls_present?.toString() || "");
      setDayScholars(existingForm.day_scholars?.toString() || "");
      setSick(existingForm.sick?.toString() || "");
      setAtHome(existingForm.at_home?.toString() || "");
      setAtSickBay(existingForm.at_sick_bay?.toString() || "");
      setAcademicReports(existingForm.academic_reports || "");
      setDosSignature(existingForm.dos_signature || "");
      setHeadTeacherSignature(existingForm.head_teacher_signature || "");
      setHeadInternalSignature(existingForm.head_internal_signature || "");
      setDateSigned(existingForm.date_signed || format(new Date(), "yyyy-MM-dd"));
    }
  }, [existingForm]);

  const addDutyTeacher = (staffId: string) => {
    const s = staff.find((p) => p.id === staffId);
    if (!s) return;
    if (dutyTeachers.find((d) => d.staff_id === s.id)) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setDutyTeachers((prev) => [
      ...prev,
      { staff_id: s.id, name: s.full_name, role: s.role || "Staff", check_in_time: timeStr, signature: "" },
    ]);
  };

  const removeDutyTeacher = (staffId: string) => {
    setDutyTeachers((prev) => prev.filter((d) => d.staff_id !== staffId));
  };

  const updateDutyTeacher = (staffId: string, field: string, value: string) => {
    setDutyTeachers((prev) =>
      prev.map((d) => (d.staff_id === staffId ? { ...d, [field]: value } : d))
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        date,
        duty_teachers: dutyTeachers,
        supervisor,
        total_enrollment: totalEnrollment ? parseInt(totalEnrollment) : null,
        boys_present: boysPresent ? parseInt(boysPresent) : null,
        girls_present: girlsPresent ? parseInt(girlsPresent) : null,
        day_scholars: dayScholars ? parseInt(dayScholars) : null,
        total_present: totalPresent || null,
        sick: sick ? parseInt(sick) : null,
        at_home: atHome ? parseInt(atHome) : null,
        at_sick_bay: atSickBay ? parseInt(atSickBay) : null,
        academic_reports: academicReports,
        dos_signature: dosSignature,
        head_teacher_signature: headTeacherSignature,
        head_internal_signature: headInternalSignature,
        date_signed: dateSigned,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (existingForm) {
        const { error } = await supabase
          .from("daily_duty_forms")
          .update(payload)
          .eq("id", existingForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_duty_forms")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-duty-form", date] });
      toast.success("Daily duty form saved");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const availableStaff = staff.filter((s) => !dutyTeachers.find((d) => d.staff_id === s.id));

  return (
    <DashboardLayout title="Daily Duty Form" subtitle="Daily duty roster and register">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duty Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-[200px]"
            />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Term {new Date().getMonth() >= 1 && new Date().getMonth() <= 4 ? "I" : new Date().getMonth() >= 5 && new Date().getMonth() <= 8 ? "II" : "III"} • {new Date().getFullYear()}
            </p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(date), "EEEE, PPP")}</p>
          </div>
        </div>

        {isLoadingExisting && (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading existing form data...</div>
        )}

        {/* Duty Teachers */}
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Teachers on Duty
                </CardTitle>
                <CardDescription>Staff assigned for today's duty</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Select onValueChange={addDutyTeacher}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Add teacher on duty..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} — {s.role || "Staff"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dutyTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No teachers added. Select from the dropdown above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Name</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Role</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Check-In Time</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Signature</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dutyTeachers.map((d) => (
                    <TableRow key={d.staff_id} className="group hover:bg-white transition-colors">
                      <TableCell className="py-3">
                        <div className="font-black text-slate-900 uppercase tracking-tight text-sm">{d.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">
                          {d.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={d.check_in_time}
                          onChange={(e) => updateDutyTeacher(d.staff_id, "check_in_time", e.target.value)}
                          className="h-8 w-[130px] text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Signature"
                          value={d.signature}
                          onChange={(e) => updateDutyTeacher(d.staff_id, "signature", e.target.value)}
                          className="h-8 w-full max-w-[180px] text-xs uppercase"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => removeDutyTeacher(d.staff_id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Supervisor on Duty */}
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Supervisor on Duty
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Select value={supervisor} onValueChange={setSupervisor}>
              <SelectTrigger className="w-full sm:w-[400px]">
                <SelectValue placeholder="Select supervisor..." />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} — {s.role || "Staff"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supervisor && (
              <p className="text-xs text-muted-foreground mt-2">
                Supervisor: {staff.find((s) => s.id === supervisor)?.full_name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Summary */}
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Enrollment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Enrollment</Label>
                <Input type="number" min="0" value={totalEnrollment} onChange={(e) => setTotalEnrollment(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Boys Present</Label>
                <Input type="number" min="0" value={boysPresent} onChange={(e) => setBoysPresent(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Girls Present</Label>
                <Input type="number" min="0" value={girlsPresent} onChange={(e) => setGirlsPresent(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Day Scholars</Label>
                <Input type="number" min="0" value={dayScholars} onChange={(e) => setDayScholars(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Present</Label>
                <div className="h-9 flex items-center px-3 bg-primary/5 rounded-md border text-sm font-bold text-primary">
                  {totalPresent}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Notes */}
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Attendance Notes
            </CardTitle>
            <CardDescription>Sick, at home, sick bay counts for the day</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sick</Label>
                <Input type="number" min="0" value={sick} onChange={(e) => setSick(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">At Home</Label>
                <Input type="number" min="0" value={atHome} onChange={(e) => setAtHome(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">At Sick Bay</Label>
                <Input type="number" min="0" value={atSickBay} onChange={(e) => setAtSickBay(e.target.value)} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Reports */}
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Academic Reports
            </CardTitle>
            <CardDescription>Daily academic report notes</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Textarea
              placeholder="Enter academic report notes for the day..."
              value={academicReports}
              onChange={(e) => setAcademicReports(e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Signatures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DOS Signature</Label>
                <Input
                  placeholder="DOS name"
                  value={dosSignature}
                  onChange={(e) => setDosSignature(e.target.value)}
                  className="h-9 uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Head Teacher Signature</Label>
                <Input
                  placeholder="Head Teacher name"
                  value={headTeacherSignature}
                  onChange={(e) => setHeadTeacherSignature(e.target.value)}
                  className="h-9 uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Head Internal Signature</Label>
                <Input
                  placeholder="Head Internal name"
                  value={headInternalSignature}
                  onChange={(e) => setHeadInternalSignature(e.target.value)}
                  className="h-9 uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Signed</Label>
                <Input
                  type="date"
                  value={dateSigned}
                  onChange={(e) => setDateSigned(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg gap-2"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-5 w-5" />
            {saveMutation.isPending ? "Saving..." : "Save Duty Form"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyDutyForm;
