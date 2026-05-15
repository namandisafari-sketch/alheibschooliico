import { useState, useMemo, useEffect, useCallback } from "react";
import { format, startOfDay, endOfDay, addDays, isSameDay } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, User, X, AlertTriangle, CheckCircle2, LayoutGrid, Building, Loader2, Send, Bell, FileText, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAppointments, useCreateAppointment, useUpdateAppointment, type Appointment,
} from "@/hooks/useAppointments";
import { useAllStaff } from "@/hooks/useStaff";
import { useClasses } from "@/hooks/useClasses";
import { useTimetable, useUpsertTimetableEntry, useDeleteTimetableEntry, type TimetableEntry } from "@/hooks/useTimetable";
import { useInAppNotifications, useBroadcastNotification } from "@/hooks/useInAppNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "motion/react";

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
];

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const from = startOfDay(selectedDate).toISOString();
  const { data: appointments = [], isLoading: loadingAppts } = useAppointments({ from, to: endOfDay(addDays(selectedDate, 30)).toISOString() });
  const { data: timetable = [] } = useTimetable(selectedClassId !== "all" ? { class_id: selectedClassId } : undefined);
  const { data: classes = [] } = useClasses();
  const { data: notifications = [], isLoading: loadingNotifs } = useInAppNotifications();
  
  const { data: infra = [] } = useQuery({
    queryKey: ["infrastructure-rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("school_infrastructure").select("*").eq("asset_type", "classroom");
      return data || [];
    }
  });
  
  const todayAppts = appointments.filter((a) => isSameDay(new Date(a.scheduled_for), selectedDate));
  const upcoming = appointments.filter((a) => new Date(a.scheduled_for) > endOfDay(selectedDate));

  // Resource Utilization / Conflicts
  const conflicts = useMemo(() => {
    const list: string[] = [];
    timetable.forEach((entry, i) => {
      timetable.slice(i + 1).forEach((other) => {
        if (entry.day_of_week === other.day_of_week) {
          const startA = entry.start_time;
          const endA = entry.end_time;
          const startB = other.start_time;
          const endB = other.end_time;

          const overlaps = (startA < endB && endA > startB);
          if (overlaps) {
            if (entry.teacher_id === other.teacher_id) {
              list.push(`Teacher booked twice on ${DAYS.find(d => d.id === entry.day_of_week)?.name} at ${startA}`);
            }
            if (entry.room_id && entry.room_id === other.room_id) {
              list.push(`Room conflict on ${DAYS.find(d => d.id === entry.day_of_week)?.name} at ${startA}`);
            }
          }
        }
      });
    });
    return Array.from(new Set(list));
  }, [timetable]);

  return (
    <DashboardLayout title="Schedule" subtitle="Advanced academic timetable, appointments, and notifications">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between border-b pb-1 overflow-x-auto no-scrollbar scroll-smooth">
          <TabsList className="bg-transparent border-none flex-nowrap">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 md:px-6 capitalize font-bold text-[10px] md:text-xs tracking-widest whitespace-nowrap">Appointments</TabsTrigger>
            <TabsTrigger value="timetable" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 md:px-6 capitalize font-bold text-[10px] md:text-xs tracking-widest whitespace-nowrap">Weekly Timetable</TabsTrigger>
            <TabsTrigger value="broadcasts" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 md:px-6 capitalize font-bold text-[10px] md:text-xs tracking-widest whitespace-nowrap">Broadcasts</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 md:px-6 capitalize font-bold text-[10px] md:text-xs tracking-widest whitespace-nowrap">Workload Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* APPOINTMENTS TAB */}
        <TabsContent value="appointments" className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-lg font-bold tracking-tight uppercase text-primary">Visitor Appointments</h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500">Reception and administrative scheduling</p>
            </div>
            <AppointmentDialog />
          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <QuickStat label="Today" value={todayAppts.length} icon={CalendarIcon} color="text-blue-600" bg="bg-blue-50" />
            <QuickStat label="Upcoming" value={upcoming.length} icon={Clock} color="text-indigo-600" bg="bg-indigo-50" />
            <QuickStat label="Pending" value={appointments.filter(a => a.status === "scheduled").length} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" />
            <QuickStat label="Success" value={appointments.filter(a => a.status === "completed").length} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 border-slate-200 rounded-[24px] md:rounded-[32px] overflow-hidden">
               <CardContent className="p-2 md:pt-6">
                 <Calendar
                   mode="single"
                   selected={selectedDate}
                   onSelect={(d) => d && setSelectedDate(d)}
                   className="pointer-events-auto"
                 />
               </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-slate-200 rounded-[24px] md:rounded-[32px] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30 p-4 md:p-6">
                <div>
                  <CardTitle className="text-xs md:text-sm font-black uppercase text-slate-400">{format(selectedDate, "EEEE, dd MMMM")}</CardTitle>
                  <CardDescription className="text-xs">{todayAppts.length} confirmed visits</CardDescription>
                </div>
                <Badge variant="outline" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{format(selectedDate, "yyyy")}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 p-4 md:pt-6">
                {loadingAppts ? (
                  <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
                ) : todayAppts.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-slate-50/50 rounded-2xl md:rounded-3xl border border-dashed border-slate-200">
                    <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">No Appointments Scheduled</p>
                  </div>
                ) : (
                  todayAppts.map((a) => (
                    <motion.div 
                      key={a.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-start gap-3 md:gap-4 rounded-2xl md:rounded-[24px] border border-slate-100 p-3 md:p-4 hover:border-primary/20 hover:bg-primary/[0.02] bg-white transition-all shadow-sm"
                    >
                      <div className="flex h-10 w-10 md:h-14 md:w-14 flex-col items-center justify-center rounded-xl md:rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/5">
                        <span className="text-[10px] md:text-xs font-black">{format(new Date(a.scheduled_for), "HH:mm")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-800 text-sm md:text-lg leading-tight truncate">{a.visitor_name}</p>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">{a.purpose}</p>
                        <div className="flex flex-wrap gap-2 md:gap-4 mt-3 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {a.host_name && <span className="flex items-center gap-1"><User className="h-2.5 w-2.5 md:h-3 md:w-3" />{a.host_name.split(' ')[0]}</span>}
                          {a.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5 md:h-3 md:w-3" />{a.location}</span>}
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />{a.duration_minutes}m</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WEEKLY TIMETABLE TAB */}
        <TabsContent value="timetable" className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-tight">Academic Timetable</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">Global Weekly Matrix & Resource Loading</p>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <LayoutGrid className="w-3 h-3 md:w-4 md:h-4 text-slate-400 ml-2" />
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[120px] md:w-[180px] bg-transparent border-none focus:ring-0 font-bold h-8 md:h-9 shadow-none text-xs">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Global View</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-xl h-8 md:h-10 px-3 md:px-5 border-slate-200 text-xs hidden sm:flex items-center"
                >
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  Print
                </Button>
                <TimetableEntryDialog />
              </div>
            </div>
          </div>

          {conflicts.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-red-50 border-2 border-red-100 p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-start gap-4 overflow-hidden"
            >
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500 shrink-0 mt-0.5 md:mt-1" />
              <div>
                <h4 className="text-[10px] md:text-sm font-black text-red-800 uppercase tracking-widest mb-1">Conflicts ({conflicts.length})</h4>
                <ul className="text-[9px] md:text-xs font-bold text-red-600/80 space-y-1 text-left list-none">
                  {conflicts.slice(0, 3).map((c, i) => <li key={i}>• {c}</li>)}
                  {conflicts.length > 3 && <li>• And {conflicts.length - 3} more conflict(s)...</li>}
                </ul>
              </div>
            </motion.div>
          )}

          <Card className="border-slate-200 rounded-2xl md:rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="p-3 md:p-6 text-left border-b border-slate-100 min-w-[80px]">
                      <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</div>
                    </th>
                    {DAYS.map(day => (
                      <th key={day.id} className="p-3 md:p-6 text-center border-b border-slate-100 min-w-[140px] md:min-w-[180px]">
                        <div className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-widest">{day.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 md:p-6 border-b border-r border-slate-100 bg-slate-50/30">
                        <div className="text-[10px] md:text-xs font-black text-slate-500 whitespace-nowrap">{slot}</div>
                      </td>
                      {DAYS.map(day => {
                        const entries = timetable.filter(e => e.day_of_week === day.id && e.start_time.startsWith(slot));
                        return (
                          <td key={day.id} className="p-1 md:p-2 border-b border-slate-100 align-top">
                            <div className="space-y-1.5 md:space-y-2">
                              {entries.map(entry => (
                                <TimetableEntryCard key={entry.id} entry={entry} isGlobal={selectedClassId === "all"} />
                              ))}
                              {entries.length === 0 && (
                                <div className="h-10 md:h-16 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Plus className="w-3 h-3 md:w-4 md:h-4 text-slate-300" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* BROADCASTS TAB */}
        <TabsContent value="broadcasts" className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-lg font-bold tracking-tight uppercase text-primary">System Broadcasts</h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500">Communicate with staff and management instantly</p>
            </div>
            <BroadcastDialog />
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-slate-200 rounded-2xl md:rounded-[32px] overflow-hidden">
               <CardHeader className="bg-slate-50/50 border-b p-4 md:p-6">
                 <CardTitle className="text-[10px] md:text-xs font-black uppercase text-slate-500">Notification History</CardTitle>
               </CardHeader>
               <div className="overflow-x-auto no-scrollbar">
                  {loadingNotifs ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 md:py-20">
                       <Bell className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">No broadcasts sent yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4 md:pl-6 text-[10px] uppercase font-black">Title</TableHead>
                          <TableHead className="text-[10px] uppercase font-black">Recipients</TableHead>
                          <TableHead className="hidden md:table-cell text-[10px] uppercase font-black">Status</TableHead>
                          <TableHead className="pr-4 md:pr-6 text-[10px] uppercase font-black">Sent At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifications.map((n) => (
                          <TableRow key={n.id} className="group hover:bg-slate-50/50">
                            <TableCell className="pl-4 md:pl-6 font-bold text-slate-700 max-w-[120px] md:max-w-none">
                               <div className="flex items-center gap-2 text-xs md:text-sm">
                                  {n.type === 'activity' ? <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 text-amber-500 shrink-0" /> : <Bell className="w-3 h-3 md:w-4 md:h-4 text-blue-500 shrink-0" />}
                                  <span className="truncate">{n.title}</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-medium text-slate-500">Staff</TableCell>
                            <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border-emerald-100">Delivered</Badge></TableCell>
                            <TableCell className="pr-4 md:pr-6 text-[9px] md:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">{format(new Date(n.created_at), "dd MMM, HH:mm")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
               </div>
            </Card>

            <Card className="border-slate-200 rounded-2xl md:rounded-[32px] overflow-hidden theme-blue bg-primary/5">
               <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-primary font-black uppercase text-[10px] md:text-xs tracking-widest">Broadcast Information</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                  <div className="flex items-start gap-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-primary/10">
                     <Info className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                     <p className="text-[10px] md:text-xs font-medium text-slate-600 leading-relaxed">Broadcasts are delivered instantly as in-app notifications.</p>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-primary/10">
                     <Send className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                     <p className="text-[10px] md:text-xs font-medium text-slate-600 leading-relaxed">Ensure clear communication. Significant changes are also logged.</p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WORKLOAD ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-3">
           <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <Card className="border-slate-200 rounded-2xl md:rounded-[32px] overflow-hidden shadow-sm">
                 <CardHeader className="bg-slate-50/50 border-b p-4 md:p-6">
                    <CardTitle className="text-[10px] md:text-xs font-black uppercase text-slate-500">Teacher Contact Hours</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0 overflow-x-auto no-scrollbar">
                    <Table>
                       <TableHeader>
                          <TableRow className="hover:bg-transparent">
                             <TableHead className="pl-4 md:pl-6 text-[10px] uppercase font-black">Teacher</TableHead>
                             <TableHead className="text-[10px] uppercase font-black">Slots</TableHead>
                             <TableHead className="hidden sm:table-cell text-[10px] uppercase font-black">Hours</TableHead>
                             <TableHead className="pr-4 md:pr-6 text-[10px] uppercase font-black">Workload %</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {(() => {
                            const staffHours: Record<string, { name: string, count: number }> = {};
                            timetable.forEach(e => {
                              if (!staffHours[e.teacher_id]) staffHours[e.teacher_id] = { name: (e.profiles as any)?.full_name || "Unknown", count: 0 };
                              staffHours[e.teacher_id].count++;
                            });
                            const dataEntries = Object.values(staffHours);
                            if (dataEntries.length === 0) return (
                              <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 font-bold uppercase text-[10px]">No load data available</TableCell></TableRow>
                            );
                            return dataEntries.map((s, i) => (
                              <TableRow key={i}>
                                 <TableCell className="pl-4 md:pl-6 font-bold text-slate-700 text-xs">{s.name.split(' ')[0]}</TableCell>
                                 <TableCell className="font-bold text-slate-600 text-xs">{s.count}</TableCell>
                                 <TableCell className="hidden sm:table-cell font-bold text-slate-600 text-xs">{s.count}h</TableCell>
                                 <TableCell className="pr-4 md:pr-6 min-w-[80px]">
                                    <div className="flex items-center gap-2">
                                       <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={cn("h-full rounded-full transition-all duration-1000", s.count > 25 ? "bg-red-500" : s.count > 15 ? "bg-amber-500" : "bg-primary")} 
                                            style={{ width: `${Math.min((s.count / 40) * 100, 100)}%` }} 
                                          />
                                       </div>
                                       <span className="text-[9px] font-black text-slate-400 w-6">{Math.round((s.count / 40) * 100)}%</span>
                                    </div>
                                 </TableCell>
                              </TableRow>
                            ));
                          })()}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>

              <Card className="border-slate-200 rounded-2xl md:rounded-[32px] overflow-hidden shadow-sm">
                 <CardHeader className="bg-slate-50/50 border-b p-4 md:p-6">
                    <CardTitle className="text-[10px] md:text-xs font-black uppercase text-slate-500">Room Occupancy & Flow</CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 md:p-6">
                    <div className="space-y-4">
                       {(() => {
                          const roomLoad: Record<string, { name: string, count: number, total: number }> = {};
                          infra.forEach(r => roomLoad[r.id] = { name: r.name, count: 0, total: 35 }); // 35 slots per week approx
                          timetable.forEach(e => {
                             if (e.room_id && roomLoad[e.room_id]) roomLoad[e.room_id].count++;
                          });
                          const roomData = Object.values(roomLoad).filter(r => r.count > 0);
                          if (roomData.length === 0) return <div className="text-center py-12"><Building className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-[10px] font-bold text-slate-400 uppercase">No dedicated rooms assigned yet</p></div>;
                          
                          return roomData.map((r, i) => (
                             <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                   <span className="text-[10px] font-black uppercase text-slate-700">{r.name}</span>
                                   <span className="text-[9px] font-bold text-slate-500">{r.count} slots filled</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                   <div 
                                      className={cn("h-full rounded-full bg-indigo-500 transition-all duration-1000")} 
                                      style={{ width: `${Math.min((r.count / 35) * 100, 100)}%` }} 
                                   />
                                </div>
                             </div>
                          ));
                       })()}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

const TimetableEntryCard = ({ entry, isGlobal }: { entry: TimetableEntry; isGlobal: boolean }) => {
  const del = useDeleteTimetableEntry();
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-slate-100 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-all relative group/card border-l-4" 
      style={{ borderLeftColor: entry.subjects?.name.includes('Math') ? '#3b82f6' : entry.subjects?.name.includes('Islamic') ? '#10b981' : '#6366f1' }}
    >
      <div className="flex justify-between items-start">
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">{entry.subjects?.code || "SUBJ"}</span>
        <button 
           onClick={() => { if(confirm("Delete this entry?")) del.mutate(entry.id); }}
           className="opacity-1 md:opacity-0 group-hover/card:opacity-100 transition-opacity p-1 text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50"
        >
          <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
        </button>
      </div>
      <h5 className="text-[9px] md:text-[11px] font-black text-slate-800 uppercase truncate mt-0.5">{entry.subjects?.name}</h5>
      {isGlobal && <p className="text-[8px] md:text-[9px] font-bold text-slate-500 truncate mt-1">Class: {entry.classes?.name}</p>}
      <div className="flex items-center gap-1 mt-1.5 md:mt-2 bg-slate-50/50 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-slate-100/50">
        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-100">
          <User className="w-2 h-2 text-slate-400" />
        </div>
        <span className="text-[8px] md:text-[9px] font-bold text-slate-500 truncate">{(entry.profiles as any)?.full_name?.split(' ')[0]}</span>
      </div>
    </motion.div>
  );
};

const QuickStat = ({ label, value, icon: Icon, color, bg }: { label: string; value: number | string; icon: any; color: string; bg: string }) => (
  <Card className="border-slate-100 rounded-2xl md:rounded-[28px] overflow-hidden shadow-sm">
    <CardContent className="p-3 md:p-6">
      <div className="flex items-center justify-between">
        <div className={cn("p-1.5 md:p-2.5 rounded-lg md:rounded-2xl", bg)}>
          <Icon className={cn("w-4 h-4 md:w-5 md:h-5", color)} />
        </div>
        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className="text-xl md:text-3xl font-black mt-2 md:mt-4 text-slate-800 truncate">{value}</p>
    </CardContent>
  </Card>
);

const TimetableEntryDialog = () => {
  const [open, setOpen] = useState(false);
  const upsert = useUpsertTimetableEntry();
  const { data: classes = [] } = useClasses();
  const { data: staff = [] } = useAllStaff();
  const { data: infra = [] } = useQuery({
    queryKey: ["infrastructure-rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("school_infrastructure").select("*").eq("asset_type", "classroom");
      return data || [];
    }
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*");
      return data || [];
    }
  });

  const [form, setForm] = useState({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    room_id: "",
    day_of_week: "1",
    start_time: "08:00",
    end_time: "08:40",
    notes: ""
  });

  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts] = useState<{ type: 'teacher' | 'class' | 'room', message: string }[]>([]);

  const checkConflicts = useCallback(async () => {
    if (!form.day_of_week || !form.start_time || !form.end_time) return;
    setIsChecking(true);
    const newConflicts = [];
    
    const { data: others } = await supabase
      .from("timetable_entries")
      .select("*, classes(name), profiles(full_name), subjects(name)")
      .eq("day_of_week", Number(form.day_of_week));

    if (others) {
       const overlap = (s1: string, e1: string, s2: string, e2: string) => {
          return (s1 < e2 && s2 < e1);
       };

       for (const entry of others) {
          if (overlap(form.start_time, form.end_time, entry.start_time, entry.end_time)) {
             if (entry.teacher_id === form.teacher_id && entry.class_id !== form.class_id) {
                newConflicts.push({ type: 'teacher' as const, message: `Teacher already has ${entry.subjects?.name} in ${entry.classes?.name} at this time.` });
             }
             if (entry.class_id === form.class_id && entry.subject_id !== form.subject_id) {
                newConflicts.push({ type: 'class' as const, message: `Class ${entry.classes?.name} already has ${entry.subjects?.name} at this time.` });
             }
             if (entry.room_id === form.room_id && form.room_id && (entry.class_id !== form.class_id)) {
                newConflicts.push({ type: 'room' as const, message: `Room is occupied by ${entry.classes?.name} for ${entry.subjects?.name}.` });
             }
          }
       }
    }
    
    setConflicts(newConflicts);
    setIsChecking(false);
  }, [form.day_of_week, form.start_time, form.end_time, form.teacher_id, form.class_id, form.room_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.teacher_id || form.class_id || form.room_id) {
        checkConflicts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [checkConflicts, form.teacher_id, form.class_id, form.room_id]);

  const submit = async () => {
    if (!form.class_id || !form.subject_id || !form.teacher_id) {
      toast({ title: "Validation Error", description: "Class, Subject and Teacher are required", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync({
        ...form,
        day_of_week: Number(form.day_of_week),
        room_id: form.room_id || null
      });
      toast({ title: "Timetable Entry Created" });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Conflict Error", description: "This slot is already taken for this class or teacher.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl md:rounded-2xl h-8 md:h-10 px-3 md:px-6 shadow-sm text-xs md:text-sm"><Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />Add Entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl md:rounded-[32px] overflow-hidden p-0 border-none">
        <DialogHeader className="bg-primary p-4 md:p-6 text-white text-left">
          <DialogTitle className="uppercase font-black tracking-tight text-lg md:text-xl">Schedule Activity</DialogTitle>
          <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-primary-foreground/70">Assign teacher and subject to class slot</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:gap-5 p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
             <div className="space-y-1">
               <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Class</Label>
               <Select value={form.class_id} onValueChange={(v) => setForm({...form, class_id: v})}>
                  <SelectTrigger className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{classes.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}</SelectContent>
               </Select>
             </div>
             <div className="space-y-1">
               <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Subject</Label>
               <Select value={form.subject_id} onValueChange={(v) => setForm({...form, subject_id: v})}>
                  <SelectTrigger className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{subjects.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
               </Select>
             </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Assigned Teacher</Label>
            <Select value={form.teacher_id} onValueChange={(v) => setForm({...form, teacher_id: v})}>
              <SelectTrigger className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs"><SelectValue placeholder="Select staff member" /></SelectTrigger>
              <SelectContent className="rounded-2xl">{staff.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
             <div className="space-y-1">
               <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Day</Label>
               <Select value={form.day_of_week} onValueChange={(v) => setForm({...form, day_of_week: v})}>
                 <SelectTrigger className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-2xl">{DAYS.map(d => <SelectItem key={d.id} value={d.id.toString()} className="text-xs">{d.name}</SelectItem>)}</SelectContent>
               </Select>
             </div>
             <div className="space-y-1">
               <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Start</Label>
               <Input type="time" className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
             </div>
             <div className="space-y-1">
               <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">End</Label>
               <Input type="time" className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
             </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Allocation Room</Label>
            <Select value={form.room_id} onValueChange={(v) => setForm({...form, room_id: v === "none" ? "" : v})}>
              <SelectTrigger className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs"><SelectValue placeholder="Standard Classroom" /></SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl overflow-y-auto max-h-[200px]">
                <SelectItem value="none" className="text-xs">Standard Classroom</SelectItem>
                {infra.map(i => <SelectItem key={i.id} value={i.id} className="text-xs">{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {conflicts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
               <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Scheduling Conflicts Detected</span>
               </div>
               <ul className="space-y-1">
                  {conflicts.map((c, i) => (
                    <li key={i} className="text-[10px] font-bold text-red-500 leading-tight">• {c.message}</li>
                  ))}
               </ul>
            </motion.div>
          )}

          {isChecking && (
            <div className="flex items-center justify-center py-2 animate-pulse">
               <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Optimizing schedule slots...</span>
            </div>
          )}
        </div>
        <DialogFooter className="bg-slate-50/50 p-4 md:p-6 border-t border-slate-100 flex-row gap-2 justify-end">
          <Button variant="outline" className="rounded-xl h-10 md:h-11 flex-1 md:flex-none border-slate-200 text-xs md:text-sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="rounded-xl h-10 md:h-11 flex-1 md:flex-none text-xs md:text-sm">Confirm Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BroadcastDialog = () => {
  const [open, setOpen] = useState(false);
  const broadcast = useBroadcastNotification();
  const [form, setForm] = useState<{ title: string; message: string; audience: "all" | "admins" | "teachers" | "staff" }>({
    title: "",
    message: "",
    audience: "all"
  });

  const submit = async () => {
     if (!form.title || !form.message) {
        toast({ title: "Validation Error", description: "Title and message are required", variant: "destructive" });
        return;
     }
     try {
        await broadcast.mutateAsync({ ...form, type: "info" });
        toast({ title: "Broadcast Sent Successfully" });
        setOpen(false);
     } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
     }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl md:rounded-2xl h-8 md:h-10 px-3 md:px-6 shadow-sm bg-blue-600 hover:bg-blue-700 text-white border-none text-xs md:text-sm"><Send className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />New Message</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl md:rounded-[32px] overflow-hidden p-0 border-none">
        <DialogHeader className="bg-blue-600 p-4 md:p-6 text-white text-left">
          <DialogTitle className="uppercase font-black tracking-tight text-lg md:text-xl">New Broadcast Message</DialogTitle>
          <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-white/70">Broadcast important information to specific groups</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:gap-5 p-4 md:p-6">
          <div className="space-y-1">
            <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Target Audience</Label>
            <Select value={form.audience} onValueChange={(v: any) => setForm({...form, audience: v})}>
              <SelectTrigger className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="text-xs">Every Authenticated User</SelectItem>
                <SelectItem value="admins" className="text-xs">Administrative Council Only</SelectItem>
                <SelectItem value="teachers" className="text-xs">Teaching Staff Only</SelectItem>
                <SelectItem value="staff" className="text-xs">Non-Teaching Staff Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Subject Header</Label>
            <Input value={form.title} className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs" onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Urgent Meeting" />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Message Content</Label>
            <Input value={form.message} className="rounded-xl h-10 md:h-11 bg-slate-50 border-slate-100 shadow-none text-xs" onChange={(e) => setForm({...form, message: e.target.value})} placeholder="Write details here..." />
          </div>
        </div>
        <DialogFooter className="bg-slate-50/50 p-4 md:p-6 border-t border-slate-100 flex-row gap-2 justify-end">
          <Button variant="outline" className="rounded-xl h-10 md:h-11 flex-1 md:flex-none border-slate-200 text-xs md:text-sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="rounded-xl h-10 md:h-11 flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-xs md:text-sm">Send Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StatusBadge = ({ status }: { status: Appointment["status"] }) => {
  const map: Record<Appointment["status"], { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-600 border-blue-200" },
    checked_in: { label: "Checked In", className: "bg-amber-50 text-amber-600 border-amber-200" },
    completed: { label: "Completed", className: "bg-green-50 text-green-600 border-green-200" },
    cancelled: { label: "Cancelled", className: "bg-slate-50 text-slate-400 border-slate-200" },
    no_show: { label: "No-show", className: "bg-red-50 text-red-600 border-red-200" },
  };
  const v = map[status] || map.scheduled;
  return <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest", v.className)}>{v.label}</Badge>;
};

const AppointmentDialog = ({
  existing,
  trigger,
}: {
  existing?: Appointment;
  trigger?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const { data: staff = [] } = useAllStaff();

  const [form, setForm] = useState({
    visitor_name: existing?.visitor_name || "",
    visitor_phone: existing?.visitor_phone || "",
    purpose: existing?.purpose || "",
    date: existing ? format(new Date(existing.scheduled_for), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    time: existing ? format(new Date(existing.scheduled_for), "HH:mm") : "09:00",
    duration_minutes: existing?.duration_minutes || 30,
    location: existing?.location || "",
    host_staff_id: existing?.host_staff_id || "",
    learner_id: existing?.learner_id || "",
    notes: existing?.notes || "",
    reminder_enabled: existing?.reminder_enabled ?? true,
    recurrence_pattern: existing?.recurrence_pattern || "none",
    recurrence_end_at: existing?.recurrence_end_at ? format(new Date(existing.recurrence_end_at), "yyyy-MM-dd") : "",
  });

  const submit = async () => {
    if (!form.visitor_name.trim() || !form.purpose.trim()) {
      toast({ title: "Missing fields", description: "Visitor name and purpose are required", variant: "destructive" });
      return;
    }
    const scheduled_for = new Date(`${form.date}T${form.time}:00`).toISOString();
    const recurrence_end_at = form.recurrence_pattern !== "none" && form.recurrence_end_at 
      ? new Date(`${form.recurrence_end_at}T23:59:59`).toISOString() 
      : null;

    const host = staff.find((s) => s.id === form.host_staff_id);
    const payload = {
      visitor_id: null,
      visitor_name: form.visitor_name.trim(),
      visitor_phone: form.visitor_phone.trim() || null,
      purpose: form.purpose.trim(),
      scheduled_for,
      duration_minutes: Number(form.duration_minutes) || 30,
      location: form.location.trim() || null,
      host_staff_id: form.host_staff_id || null,
      host_name: host?.full_name || null,
      learner_id: form.learner_id || null,
      notes: form.notes.trim() || null,
      reminder_enabled: form.reminder_enabled,
      recurrence_pattern: form.recurrence_pattern as any,
      recurrence_end_at,
    };

    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, ...payload });
        toast({ title: "Appointment updated" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Appointment scheduled" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" className="shadow-sm rounded-xl md:rounded-2xl h-8 md:h-10 px-3 md:px-6 border-slate-200 text-xs md:text-sm"><Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />New Booking</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl md:rounded-[40px] p-0 border-none shadow-2xl">
        <div className="bg-primary p-6 md:p-8 text-white text-left">
          <DialogTitle className="uppercase font-black text-xl md:text-2xl tracking-tight">Visitor Entry Protocol</DialogTitle>
          <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Scheduled meetings with staff or management</DialogDescription>
        </div>

        <div className="p-4 md:p-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Visitor Identity</Label>
              <Input value={form.visitor_name} className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} placeholder="Full Name" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Contact Phone</Label>
              <Input value={form.visitor_phone} className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} placeholder="+256..." />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Official Purpose</Label>
            <Input value={form.purpose} className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Admission Inquiry" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Scheduled Date</Label>
              <Input type="date" className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Start Time</Label>
              <Input type="time" className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-1 space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Duration (Mins)</Label>
              <Input type="number" className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Facility Location</Label>
              <Input value={form.location} className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Board Room" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Host Associate</Label>
              <Select value={form.host_staff_id} onValueChange={(v) => setForm({ ...form, host_staff_id: v })}>
                <SelectTrigger className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs"><SelectValue placeholder="Select host" /></SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl overflow-y-auto max-h-[200px]">
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Recurrence</Label>
              <Select value={form.recurrence_pattern} onValueChange={(v: any) => setForm({ ...form, recurrence_pattern: v })}>
                <SelectTrigger className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="none" className="text-xs">One-off Event</SelectItem>
                  <SelectItem value="daily" className="text-xs">Daily Session</SelectItem>
                  <SelectItem value="weekly" className="text-xs">Weekly Assignment</SelectItem>
                  <SelectItem value="monthly" className="text-xs">Monthly Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.recurrence_pattern !== "none" && (
              <div className="space-y-1">
                <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Recurrence End Date</Label>
                <Input type="date" value={form.recurrence_end_at} className="rounded-xl md:rounded-2xl h-10 md:h-12 bg-slate-50 border-slate-100 text-xs" onChange={(e) => setForm({ ...form, recurrence_end_at: e.target.value })} />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8 pt-0 flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
          <Button variant="ghost" className="rounded-xl md:rounded-2xl h-10 md:h-12 flex-1 sm:flex-none px-6 md:px-8 font-bold text-slate-400 text-xs md:text-sm order-2 sm:order-1" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="rounded-xl md:rounded-2xl h-10 md:h-12 flex-1 sm:flex-none px-8 md:px-10 shadow-lg shadow-primary/20 text-xs md:text-sm order-1 sm:order-2" disabled={create.isPending || update.isPending}>
            {existing ? "Save Updates" : "Finalize Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Schedule;
