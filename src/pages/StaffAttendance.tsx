
import { useState } from "react";
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
  AlertCircle,
  Search,
  Save,
  CheckCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useAllStaff } from "@/hooks/useStaff";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const StaffAttendance = () => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const { data: staff = [], isLoading: isLoadingStaff } = useAllStaff();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const filteredStaff = staff.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (staffId: string) => {
    return attendance.find(a => a.employee_id === staffId)?.status || "pending";
  };

  const getTime = (staffId: string) => {
    return attendance.find(a => a.employee_id === staffId)?.check_in_time || "---";
  };

  return (
    <DashboardLayout title="Staff Attendance" subtitle="Daily register for teachers and support staff">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Attendance Date</label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-[200px]"
            />
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
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-4">Mark Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStaff || isLoadingAttendance ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                       Loading personnel data...
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.map((s) => {
                  const status = getStatus(s.id);
                  return (
                    <TableRow key={s.id} className="group hover:bg-white transition-colors">
                      <TableCell className="py-4">
                        <div className="font-black text-slate-900 uppercase tracking-tight">{s.full_name}</div>
                        <div className="text-[10px] text-muted-foreground">{s.email || "No email"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">
                          {s.role || "Staff"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{getTime(s.id)}</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
