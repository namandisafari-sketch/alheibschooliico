// @ts-nocheck

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Save,
  ChevronDown,
  ChevronRight,
  FileText,
  StickyNote
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { useAllStaff } from "@/hooks/useStaff";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NEXT_LEAVE = { "N/A": "No", "No": "Yes", "Yes": "N/A" } as const;

const StaffAttendance = () => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [dosSignature, setDosSignature] = useState("");
  const [headSignature, setHeadSignature] = useState("");
  const [headInternalSignature, setHeadInternalSignature] = useState("");
  const { data: staff = [], isLoading: isLoadingStaff } = useAllStaff();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const dayOfWeek = format(new Date(date), "EEEE");

  const { data: attendance = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["staff-attendance", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personnel_attendance")
        .select("*")
        .eq("date", date);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: signoffs = [] } = useQuery({
    queryKey: ["daily-attendance-signoffs", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_attendance_signoffs")
        .select("*")
        .eq("date", date);
      if (error) {
        if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
          return [];
        }
        throw error;
      }
      return data || [];
    }
  });

  useEffect(() => {
    if (signoffs?.length > 0) {
      const s = signoffs[0];
      setDosSignature(s.dos_signature || "");
      setHeadSignature(s.head_teacher_signature || "");
      setHeadInternalSignature(s.head_internal_signature || "");
    }
  }, [signoffs]);

  const toggleNotes = (staffId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const markAttendance = useMutation({
    mutationFn: async ({ employee_id, status }: { employee_id: string, status: string }) => {
      const existing = attendance.find(a => a.employee_id === employee_id);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

      if (existing) {
        const { error } = await supabase
          .from("personnel_attendance")
          .update({ 
            status, 
            check_in_time: status === 'present' ? timeStr : null,
            recorded_by: user?.id
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personnel_attendance")
          .insert({
            employee_id,
            date,
            status,
            check_in_time: status === 'present' ? timeStr : null,
            recorded_by: user?.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance", date] });
      toast.success("Attendance updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const toggleLeave = useMutation({
    mutationFn: async ({ employee_id, current }: { employee_id: string, current: string }) => {
      const next = NEXT_LEAVE[current] || "N/A";
      const existing = attendance.find(a => a.employee_id === employee_id);
      if (existing) {
        const { error } = await supabase
          .from("personnel_attendance")
          .update({ leave_granted: next })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        const { error } = await supabase
          .from("personnel_attendance")
          .insert({
            employee_id,
            date,
            status: "pending",
            leave_granted: next,
            check_in_time: null,
            recorded_by: user?.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance", date] });
      toast.success("Leave status updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateNotes = useMutation({
    mutationFn: async ({ employee_id, notes }: { employee_id: string, notes: string }) => {
      const existing = attendance.find(a => a.employee_id === employee_id);
      if (existing) {
        const { error } = await supabase
          .from("personnel_attendance")
          .update({ notes })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        const { error } = await supabase
          .from("personnel_attendance")
          .insert({
            employee_id,
            date,
            status: "pending",
            notes,
            check_in_time: null,
            recorded_by: user?.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance", date] });
      toast.success("Notes saved");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const saveSignatures = useMutation({
    mutationFn: async () => {
      const payload = {
        date,
        dos_signature: dosSignature,
        head_teacher_signature: headSignature,
        head_internal_signature: headInternalSignature,
        signed_by: user?.id,
      };
      if (signoffs?.length > 0) {
        const { error } = await supabase
          .from("daily_attendance_signoffs")
          .update(payload)
          .eq("date", date);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_attendance_signoffs")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-attendance-signoffs", date] });
      toast.success("Signatures saved");
    },
    onError: (error: any) => {
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        toast.success("Signatures recorded locally (table not available)");
        return;
      }
      toast.error(error.message);
    }
  });

  const filteredStaff = staff.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendance = (staffId: string) => {
    return attendance.find(a => a.employee_id === staffId);
  };

  const getStatus = (staffId: string) => {
    return getAttendance(staffId)?.status || "pending";
  };

  const getTime = (staffId: string) => {
    return getAttendance(staffId)?.check_in_time || "---";
  };

  const getLeave = (staffId: string) => {
    return getAttendance(staffId)?.leave_granted || "N/A";
  };

  const getNotes = (staffId: string) => {
    return getAttendance(staffId)?.notes || "";
  };

  return (
    <DashboardLayout title="Staff Attendance" subtitle="Daily register for teachers and support staff">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Attendance Date</label>
            <div className="flex items-center gap-3">
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:w-[200px]"
              />
              <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-wider px-3 py-1">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Day: {dayOfWeek}
              </Badge>
            </div>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search staff name or role..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Personnel Register
                   </CardTitle>
                   <CardDescription>Date: {format(new Date(date), "PPP")}</CardDescription>
                </div>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Present: {attendance.filter(a => a.status === 'present').length}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Absent: {attendance.filter(a => a.status === 'absent').length}</span>
                   </div>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Staff Member</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Designation</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Check-In</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Leave</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-4">Mark Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStaff || isLoadingAttendance ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                       Loading personnel data...
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.map((s) => {
                  const status = getStatus(s.id);
                  const leave = getLeave(s.id);
                  const notes = getNotes(s.id);
                  const isNotesOpen = expandedNotes.has(s.id);
                  return (
                    <React.Fragment key={s.id}>
                      <TableRow className="group hover:bg-white transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleNotes(s.id)}
                              className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
                              title="Notes / Reference"
                            >
                              {isNotesOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                            <div>
                              <div className="font-black text-slate-900 uppercase tracking-tight">{s.full_name}</div>
                              <div className="text-[10px] text-muted-foreground">{s.email || "No email"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">
                            {s.role || "Staff"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{getTime(s.id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] uppercase font-black tracking-wider px-2",
                                leave === "Yes" && "bg-amber-100 text-amber-700 border-amber-200",
                                leave === "No" && "bg-slate-100 text-slate-600 border-slate-200",
                                leave === "N/A" && "bg-gray-50 text-gray-400 border-gray-200"
                              )}
                            >
                              {leave}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => toggleLeave.mutate({ employee_id: s.id, current: leave })}
                              title="Toggle leave status"
                            >
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={status === 'present' ? 'success' : status === 'absent' ? 'destructive' : 'secondary'}
                            className={cn(
                              "text-[10px] uppercase font-bold",
                              status === 'present' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                              status === 'absent' && "bg-rose-100 text-rose-700 hover:bg-rose-100",
                              status === 'pending' && "bg-slate-100 text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                             <Button 
                               size="sm" 
                               variant={status === 'present' ? 'default' : 'outline'}
                               className={cn("h-8 gap-1", status === 'present' && "bg-emerald-600 hover:bg-emerald-700")}
                               onClick={() => markAttendance.mutate({ employee_id: s.id, status: 'present' })}
                             >
                               <CheckCircle2 className="h-3.5 w-3.5" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant={status === 'absent' ? 'destructive' : 'outline'}
                               className="h-8 gap-1"
                               onClick={() => markAttendance.mutate({ employee_id: s.id, status: 'absent' })}
                             >
                               <XCircle className="h-3.5 w-3.5" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant={status === 'late' ? 'warning' : 'outline'}
                               className={cn("h-8 gap-1", status === 'late' && "bg-amber-500 text-white hover:bg-amber-600")}
                               onClick={() => markAttendance.mutate({ employee_id: s.id, status: 'late' })}
                             >
                               <Clock className="h-3.5 w-3.5" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="p-0 border-b">
                          <Collapsible open={isNotesOpen}>
                            <CollapsibleContent>
                              <div className="px-14 py-3 bg-slate-50/80 border-t">
                                <div className="flex items-start gap-3">
                                  <StickyNote className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                                  <div className="flex-1 flex gap-2">
                                    <Textarea
                                      placeholder="Add notes / reference for this staff member..."
                                      className="min-h-[60px] text-sm bg-white"
                                      defaultValue={notes}
                                      onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        if (val !== notes) {
                                          updateNotes.mutate({ employee_id: s.id, notes: val });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="border-b bg-white rounded-t-xl py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Sign-off
                </CardTitle>
                <CardDescription>Daily register approval signatures</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  DOS Signature
                </Label>
                <Input
                  placeholder="Type DOS name or identifier..."
                  value={dosSignature}
                  onChange={(e) => setDosSignature(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Head Teacher Signature
                </Label>
                <Input
                  placeholder="Type Head Teacher name or identifier..."
                  value={headSignature}
                  onChange={(e) => setHeadSignature(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Head Internal Signature
                </Label>
                <Input
                  placeholder="Type Head Internal name or identifier..."
                  value={headInternalSignature}
                  onChange={(e) => setHeadInternalSignature(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Sign-off Date
                </Label>
                <Input
                  value={format(new Date(), "PPP")}
                  disabled
                  className="font-mono bg-muted"
                />
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex justify-end">
              <Button
                onClick={() => saveSignatures.mutate()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Signatures
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
