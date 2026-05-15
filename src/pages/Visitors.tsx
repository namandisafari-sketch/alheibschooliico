// @ts-nocheck
import { useState, useRef, ReactNode, useEffect } from "react";
import { format, formatDistanceToNow, isToday, isPast } from "date-fns";
import { BrowserQRCodeReader } from "@zxing/library";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LogIn, LogOut, Plus, Search, Phone, MapPin, Clock, AlertTriangle, Printer, Ban,
  Shield, UserPlus, Users, History, ScanLine, ShieldCheck, ArrowRightLeft,
  CalendarCheck, UserCheck, Timer, TrendingUp, Activity, PieChart as PieChartIcon,
  BarChart3, Calendar, ListFilter, PackageCheck, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Cell, Pie
} from "recharts";
import {
  useVisitors, useCreateVisitor, useVisitorVisits, useCheckInVisitor, useCheckOutVisitor,
  type Visitor, type VisitorVisit,
} from "@/hooks/useVisitors";
import {
  useReentrySlips, useIssueReentrySlip, useVoidReentrySlip, type ReentrySlip,
} from "@/hooks/useReentrySlips";
import { useAppointments } from "@/hooks/useAppointments";
import { useAllStaff } from "@/hooks/useStaff";
import { useLearners } from "@/hooks/useLearners";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmergencyReentrySlip } from "@/components/idcards/EmergencyReentrySlip";
import { IDScannerDialog } from "@/components/visitors/IDScannerDialog";
import { useStudentBalances, formatUGX } from "@/hooks/useFees";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { LocationSelector } from "@/components/common/LocationSelector";
import { useDisciplineFlags } from "@/hooks/useDisciplineFlags";
import { DisciplineFlag } from "@/components/discipline/DisciplineFlag";

const GateStatCard = ({ icon, label, value, color, bgColor }: { icon: ReactNode; label: string; value: number | string; color: string; bgColor: string }) => (
  <div className={cn("flex items-center gap-4 p-4 bg-white border rounded-3xl shadow-sm", bgColor)}>
    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", color, "bg-white")}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
      <p className={cn("text-2xl font-black tracking-tight", color)}>{value}</p>
    </div>
  </div>
);

const GateVisitorCard = ({ visit }: { visit: VisitorVisit }) => {
  const checkOut = useCheckOutVisitor();
  const timeIn = formatDistanceToNow(new Date(visit.check_in_at), { addSuffix: true });
  
  return (
    <div className="group relative bg-white border-2 border-slate-100 rounded-2xl p-4 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">
              {visit.badge_number || "NO-BADGE"}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <Timer className="h-3 w-3" />
              Entered {timeIn}
            </div>
          </div>
          
          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 truncate leading-none">
            {visit.visitor_name}
          </h4>
          
          <div className="space-y-1 mb-4">
            {visit.purpose && (
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                {visit.purpose}
              </p>
            )}
            {visit.host_name && (
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-tight">
                <UserCheck className="h-3 w-3" />
                Meeting: {visit.host_name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl font-bold uppercase text-[10px] tracking-widest h-9"
              onClick={() => checkOut.mutate(visit)}
            >
              <LogOut className="h-3 w-3 mr-2" />
              Check Out
            </Button>
            <ReentrySlipDialog
              visit={visit}
              trigger={
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="px-3 border text-slate-500 hover:text-slate-900 rounded-xl"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>

        {visit.visitor_photo_url && (
          <div className="h-24 w-20 rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 shrink-0">
            <img 
              src={visit.visitor_photo_url} 
              alt={visit.visitor_name} 
              className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

function SecurityInsights({ visits, appointments }: { visits: VisitorVisit[], appointments: any[] }) {
  // Pattern: Hourly entries for the last 24h or current day
  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7; // 7 AM to 8 PM
    const count = visits.filter(v => new Date(v.check_in_at).getHours() === hour).length;
    return { hour: `${hour}:00`, count };
  });

  // Pattern: Visitor Types (Simplified for demo)
  const visitorTypes = [
    { name: "Appointments", value: visits.filter(v => v.appointment_id).length, color: "#10b981" },
    { name: "Walk-ins", value: visits.filter(v => !v.appointment_id).length, color: "#f59e0b" },
  ];

  // Pattern: Purpose Distribution
  const purposeCounts: Record<string, number> = {};
  visits.forEach(v => {
    const p = v.purpose || "Other";
    purposeCounts[p] = (purposeCounts[p] || 0) + 1;
  });
  const purposeData = Object.entries(purposeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Pattern: Stay Duration (for checked-out visitors)
  const stayDurations = visits
    .filter(v => v.check_out_at)
    .map(v => {
      const duration = (new Date(v.check_out_at!).getTime() - new Date(v.check_in_at).getTime()) / 60000;
      return Math.round(duration);
    });
  
  const avgStay = stayDurations.length ? Math.round(stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length) : 0;

  // Alerts: Long stays (> 4 hours)
  const longStays = visits.filter(v => {
    if (v.status !== "checked_in") return false;
    const duration = (Date.now() - new Date(v.check_in_at).getTime()) / (1000 * 60 * 60);
    return duration > 4;
  });

  return (
    <div className="space-y-6">
      {longStays.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 flex items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-900 uppercase tracking-widest">Security Alert: Extended Stay</h3>
            <p className="text-xs font-bold text-red-700 uppercase tracking-tight">
              {longStays.length} visitor(s) have been inside for over 4 hours. Please verify their status.
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto border-red-200 text-red-700 hover:bg-red-100 uppercase text-[10px] font-black">
            View Details
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Traffic Bar Chart */}
        <Card className="lg:col-span-2 border-2 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Traffic Patterns
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold">Hourly Entry Volume (Live Today)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visitor Composition Pie */}
        <Card className="border-2 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-amber-500" />
              Source Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitorTypes}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {visitorTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-4">
              {visitorTypes.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </div>
                  <span>{t.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Primary Access Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purposeData.map((p, i) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>{p.name}</span>
                    <span>{Math.round((p.value / visits.length) * 100 || 0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full" 
                      style={{ width: `${(p.value / visits.length) * 100 || 0}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-3xl shadow-sm bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Security Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Occupancy</p>
                  <p className="text-xl font-black">{visits.filter(v => v.status === "checked_in").length} Souls</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Optimal</Badge>
            </div>
            
            <Separator className="bg-slate-800" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Appointments Fulfilled</p>
                  <p className="text-xl font-black">{appointments.filter(a => a.status === "completed" && isToday(new Date(a.scheduled_for))).length}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Daily Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppointmentsList({ appointments }: { appointments: any[] }) {
  const [filter, setFilter] = useState<"all" | "scheduled" | "checked_in" | "completed">("all");
  const filtered = appointments.filter(a => filter === "all" || a.status === filter);

  return (
    <Card className="border-2 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 bg-white border-b flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <Calendar className="h-6 w-6 text-slate-900" />
            Expected Arrivals
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Full Security Schedule</p>
        </div>
        
        <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-auto">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-[10px] font-black uppercase px-4 rounded-lg">All</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-[10px] font-black uppercase px-4 rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="checked_in" className="text-[10px] font-black uppercase px-4 rounded-lg">Inside</TabsTrigger>
            <TabsTrigger value="completed" className="text-[10px] font-black uppercase px-4 rounded-lg">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 px-6">Visitor / Phone</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Scheduled For</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Meeting With</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Purpose</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 px-6">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No matching appointments found</p>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((a) => (
              <TableRow key={a.id} className="group hover:bg-slate-50 transition-colors">
                <TableCell className="py-4 px-6">
                  <div className="font-black text-slate-900 uppercase tracking-tight">{a.visitor_name}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">{a.visitor_phone || "No phone"}</div>
                </TableCell>
                <TableCell className="py-4 font-mono text-[11px] font-bold">
                  {format(new Date(a.scheduled_for), "dd MMM • HH:mm")}
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-[11px] font-black text-slate-700 uppercase">{a.host_name || "General"}</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-[11px] font-medium text-slate-600 line-clamp-1">{a.purpose}</div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    a.status === "scheduled" ? "bg-amber-500" : 
                    a.status === "checked_in" ? "bg-emerald-500" : 
                    "bg-slate-400"
                  )}>
                    {a.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-4 px-6">
                  {a.status === "scheduled" && (
                    <CheckInDialog
                      appointment={a}
                      trigger={
                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white rounded-lg">
                          Check In
                        </Button>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function LearnerVerificationDialog({ initialId, onClose }: { initialId?: string, onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [learner, setLearner] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: learners = [] } = useLearners();
  const { data: balances = [] } = useStudentBalances();
  const { data: flags } = useDisciplineFlags();

  // Handle hardware scan (initialId)
  useEffect(() => {
    if (initialId) {
      const found = learners.find(l => l.id.toUpperCase() === initialId.toUpperCase());
      const balance = balances.find(b => b.id.toUpperCase() === initialId.toUpperCase());
      if (found) {
        setLearner({ ...found, balance });
        setOpen(true);
      } else {
        toast({ title: "Student Not Found", description: `ID: ${initialId}`, variant: "destructive" });
        onClose?.();
      }
    }
  }, [initialId, learners, balances]);

  const startScan = async () => {
    setScanning(true);
    setLearner(null);
    const codeReader = new BrowserQRCodeReader();
    try {
      const result = await codeReader.decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
        if (res) {
          const text = res.getText();
          if (text.startsWith("ALHEIB:FEE:")) {
            const id = text.split(":")[2];
            const found = learners.find(l => l.id.toUpperCase() === id.toUpperCase());
            const balance = balances.find(b => b.id.toUpperCase() === id.toUpperCase());
            if (found) {
              setLearner({ ...found, balance });
              codeReader.reset();
              setScanning(false);
            }
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (scanning && videoRef.current) {
      startScan();
    }
    return () => {
      const codeReader = new BrowserQRCodeReader();
      codeReader.reset();
    };
  }, [scanning]);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) {
        setScanning(false);
        onClose?.();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 bg-blue-50/30">
          <ScanLine className="h-4 w-4 text-blue-600" />
          Student Gate Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Learner Identity Verification
          </DialogTitle>
          <DialogDescription>Scan the QR code on the student ID card to verify access</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!learner && (
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl">
              {!scanning ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <ScanLine className="h-12 w-12 text-blue-400 mb-4 animate-pulse" />
                  <p className="text-lg font-black uppercase tracking-widest">Ready to Verify</p>
                  <Button onClick={() => setScanning(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest px-8">
                    Start Camera
                  </Button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-blue-500 rounded-lg animate-pulse" />
                  </div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    Align QR Code in Center
                  </div>
                </>
              )}
            </div>
          )}

          {learner && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xl">
                <div className="bg-slate-900 p-6 flex items-center gap-6">
                  <div className="h-32 w-28 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shrink-0">
                    {learner.photo_url ? (
                      <img src={learner.photo_url} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Users className="h-12 w-12 text-slate-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-blue-500 text-white mb-2 uppercase text-[9px] font-black tracking-widest">
                      Verified Student
                    </Badge>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1 truncate">
                      {learner.full_name}
                    </h3>
                    <p className="text-blue-400 font-mono text-sm font-bold uppercase tracking-tighter">
                      ADM: {learner.admission_number || learner.id.slice(0, 8)}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Class</p>
                        <p className="text-white font-bold uppercase">{learner.class_name || "N/A"}</p>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-slate-800" />
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gender</p>
                        <p className="text-white font-bold uppercase">{learner.gender}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {flags?.[learner.id] && (
                  <div className="px-6 pt-6">
                    <DisciplineFlag disciplineCase={flags[learner.id]} className="py-4 px-6 border-4 shadow-2xl scale-[1.02]" />
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Guardian Contact</p>
                      <p className="text-sm font-black text-slate-900 uppercase">{learner.guardian_name || "None"}</p>
                      <p className="text-xs font-bold text-slate-500">{learner.guardian_phone || "---"}</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl border",
                      learner.balance?.status === 'paid' ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                    )}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Clearance</p>
                      <p className={cn(
                        "text-sm font-black uppercase",
                        learner.balance?.status === 'paid' ? "text-emerald-700" : "text-amber-700"
                      )}>
                        {learner.balance?.status === 'paid' ? "Fully Cleared" : "Balance Due"}
                      </p>
                      <p className="text-xs font-bold text-slate-500">{learner.balance ? formatUGX(learner.balance.balance) : "---"}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Home Location</p>
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-tight">{learner.village}, {learner.district}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="uppercase text-[10px] font-black">Close</Button>
          {learner && (
            <Button onClick={() => setLearner(null)} variant="outline" className="uppercase text-[10px] font-black">Scan Another</Button>
          )}
          {learner && (
            <Button className="bg-slate-900 hover:bg-black text-white uppercase text-[10px] font-black tracking-widest px-8">
              Log Gate Entry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Visitors = () => {
  const { data: activeVisits = [] } = useVisitorVisits("active");
  const { data: allVisits = [] } = useVisitorVisits("all");
  const { data: visitors = [] } = useVisitors();
  const { data: appointments = [] } = useAppointments();
  const { data: slips = [] } = useReentrySlips();

  const todayApptsScheduled = appointments.filter(
    (a) => isToday(new Date(a.scheduled_for)) && a.status === "scheduled"
  );

  const activeSlips = slips.filter((s) => !s.voided && !isPast(new Date(s.expires_at))).length;

  const { data: settings } = useSiteSettings();
  const voidSlip = useVoidReentrySlip();

  // Hardware Barcode Scanner Listener
  const scanBufferRef = useRef("");
  const lastKeyTime = useRef<number>(0);
  const [manualVerifyId, setManualVerifyId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const now = Date.now();
      
      // If interval > 50ms, it's likely manual typing, reset buffer
      if (now - lastKeyTime.current > 50) {
        scanBufferRef.current = "";
      }
      
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (scanBufferRef.current.startsWith("ALHEIB:FEE:")) {
          const id = scanBufferRef.current.split(":")[2];
          setManualVerifyId(id);
          toast({ title: "Hardware Scan Detected", description: "Verifying learner identity..." });
        }
        scanBufferRef.current = "";
      } else if (e.key.length === 1) {
        scanBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <DashboardLayout 
      title="Gate Control Center" 
      subtitle="Physical security and visitor access management"
    >
      {manualVerifyId && (
        <LearnerVerificationDialog 
          initialId={manualVerifyId} 
          onClose={() => setManualVerifyId(null)} 
        />
      )}
      <div className="flex flex-col gap-6">
        {/* TOP STATUS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GateStatCard 
            icon={<Users className="h-5 w-5" />} 
            label="Currently Inside" 
            value={activeVisits.length} 
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <GateStatCard 
            icon={<CalendarCheck className="h-5 w-5" />} 
            label="Expected Today" 
            value={appointments.filter(a => isToday(new Date(a.scheduled_for))).length} 
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <GateStatCard 
            icon={<ShieldCheck className="h-5 w-5" />} 
            label="Security Clearances" 
            value={activeSlips} 
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <GateStatCard 
            icon={<History className="h-5 w-5" />} 
            label="Total Visits Today" 
            value={allVisits.filter(v => isToday(new Date(v.check_in_at))).length} 
            color="text-slate-600"
            bgColor="bg-slate-50"
          />
        </div>

        <Tabs id="visitor-log-container" defaultValue="gate" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-white border p-1 h-12 shadow-sm">
              <TabsTrigger value="gate" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Shield className="h-4 w-4 mr-2" />
                Live Gate
              </TabsTrigger>
              <TabsTrigger value="insights" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Activity className="h-4 w-4 mr-2" />
                Gate Insights
              </TabsTrigger>
              <TabsTrigger value="appointments" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Calendar className="h-4 w-4 mr-2" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="reentry" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Gate Passes
              </TabsTrigger>
              <TabsTrigger value="inventory" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <PackageCheck className="h-4 w-4 mr-2" />
                Item Clearance
              </TabsTrigger>
              <TabsTrigger value="log" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <History className="h-4 w-4 mr-2" />
                Access Log
              </TabsTrigger>
              <TabsTrigger value="visitors" className="h-10 px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <UserCheck className="h-4 w-4 mr-2" />
                Trusted List
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <IDScannerDialog onScanComplete={(res) => {
                toast({ title: "ID Scanned", description: `Ready to check in ${res.identity.name}` });
              }} />
              <LearnerVerificationDialog />
              <CheckInDialog trigger={
                <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Direct Check-In
                </Button>
              } />
            </div>
          </div>

          {/* LIVE GATE EXPERIENCE */}
          <TabsContent value="gate" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[600px]">
              
              {/* ENTRY LANE (Left) */}
              <div className="flex flex-col gap-4 bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Entry Lane</h2>
                    <p className="text-sm text-muted-foreground font-medium">Arrivals & Appointments</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 uppercase tracking-widest text-[10px]">Gate Open</Badge>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-4 pr-4">
                    {todayApptsScheduled.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <CalendarCheck className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-slate-900">No pending arrivals</h3>
                        <p className="text-sm text-muted-foreground">All scheduled visitors for today have been processed.</p>
                      </div>
                    ) : (
                      todayApptsScheduled.map((a) => (
                        <div key={a.id} className="group relative bg-slate-50 border-l-4 border-l-blue-500 rounded-xl p-4 hover:bg-slate-100 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-blue-600 font-mono text-[10px]">{format(new Date(a.scheduled_for), "HH:mm")}</Badge>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Visit</span>
                              </div>
                              <h4 className="font-black text-slate-900 truncate uppercase tracking-tight">{a.visitor_name}</h4>
                              <p className="text-xs text-slate-600 line-clamp-1 mb-2 font-medium">{a.purpose}</p>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {a.host_name && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    <Shield className="h-3 w-3" />
                                    Host: {a.host_name}
                                  </div>
                                )}
                                {a.visitor_phone && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    <Phone className="h-3 w-3" />
                                    {a.visitor_phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <CheckInDialog
                              appointment={a}
                              trigger={
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md">
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Check In
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* EXIT LANE (Right) */}
              <div className="flex flex-col gap-4 bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-orange-500" />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Exit Lane</h2>
                    <p className="text-sm text-muted-foreground font-medium">On-Site & Check-Out</p>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 font-bold px-3 py-1 uppercase tracking-widest text-[10px]">Live Tracking</Badge>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-4 pr-4">
                    {activeVisits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <ShieldCheck className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-slate-900">Secure Premises</h3>
                        <p className="text-sm text-muted-foreground">There are currently no visitors recorded on-site.</p>
                      </div>
                    ) : (
                      activeVisits.map((v) => <GateVisitorCard key={v.id} visit={v} />)
                    )}
                  </div>
                </ScrollArea>
              </div>

            </div>
          </TabsContent>

          {/* SECURITY INSIGHTS & PATTERNS */}
          <TabsContent value="insights" className="mt-0">
            <SecurityInsights visits={allVisits} appointments={appointments} />
          </TabsContent>

          {/* FULL APPOINTMENTS LIST */}
          <TabsContent value="appointments" className="mt-0">
            <AppointmentsList appointments={appointments} />
          </TabsContent>

        {/* RE-ENTRY SLIPS LOG (Gate Passes) */}
        <TabsContent value="reentry" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px]">
              <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Printer className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Issue Emergency Pass</h3>
              <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">Create a time-limited thermal pass for returning visitors.</p>
              <ReentrySlipDialog
                trigger={
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    New Gate Pass
                  </Button>
                }
              />
            </Card>

            {slips.map((s) => (
              <div key={s.id} className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-3xl blur transition-all group-hover:blur-md",
                  !s.voided && !isPast(new Date(s.expires_at)) ? "bg-emerald-100/50" : "bg-slate-100"
                )} />
                <Card className="relative bg-white border-2 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full">
                  <div className={cn(
                    "h-1.5 w-full",
                    s.voided ? "bg-slate-300" : isPast(new Date(s.expires_at)) ? "bg-red-500" : "bg-emerald-500"
                  )} />
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Pass</span>
                          <Badge variant="outline" className="font-mono text-[9px] font-bold">{s.serial}</Badge>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 uppercase leading-none">{s.visitor_name}</h4>
                      </div>
                      <ReprintSlipButton slip={s} />
                    </div>

                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        Host: {s.host_name || "—"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Issued: {format(new Date(s.issued_at), "HH:mm")}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-900">
                        <Timer className="h-3.5 w-3.5 text-slate-400" />
                        Expires: {format(new Date(s.expires_at), "HH:mm")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        s.voided ? "bg-slate-200 text-slate-500" : isPast(new Date(s.expires_at)) ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {s.voided ? "Voided" : isPast(new Date(s.expires_at)) ? "Expired" : "Active Pass"}
                      </Badge>
                      {!s.voided && !isPast(new Date(s.expires_at)) && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 rounded-lg"
                          onClick={() => voidSlip.mutate(s.id)}
                        >
                          <Ban className="h-3.5 w-3.5 mr-2" />
                          <span className="text-[10px] font-bold uppercase">Void</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* LOG (Logbook Style) */}
        <TabsContent value="log" className="mt-0">
          <Card className="border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <History className="h-6 w-6 text-slate-400" />
                  Security Logbook
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Official Access History • {format(new Date(), "MMMM yyyy")}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Daily Log
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 px-6">Identity / Contact</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Security Badge</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Host / Purpose</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Entry / Exit</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 px-6">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVisits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                          <p className="text-muted-foreground font-medium">Logbook is currently empty for this period.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allVisits.map((v) => (
                        <TableRow key={v.id} className="group hover:bg-slate-50/80 transition-colors">
                          <TableCell className="py-4 px-6">
                            <div className="font-black text-slate-900 uppercase tracking-tight">{v.visitor_name}</div>
                            {v.visitor_phone && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-0.5">
                                <Phone className="h-3 w-3" />
                                {v.visitor_phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="font-mono text-[10px] font-bold border-slate-200 bg-white">
                              {v.badge_number}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-[11px] font-bold text-slate-700 uppercase leading-tight max-w-[200px]">
                              {v.host_name || "General Visit"}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{v.purpose || "—"}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                                <LogIn className="h-3 w-3" />
                                {format(new Date(v.check_in_at), "HH:mm")}
                              </div>
                              {v.check_out_at && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 uppercase">
                                  <LogOut className="h-3 w-3" />
                                  {format(new Date(v.check_out_at), "HH:mm")}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                              v.status === "checked_in" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-400 hover:bg-slate-500"
                            )}>
                              {v.status === "checked_in" ? "Inside" : "Exited"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-4 px-6">
                            {v.status === "checked_out" && (
                              <ReentrySlipDialog
                                visit={v}
                                trigger={
                                  <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">
                                    <ArrowRightLeft className="h-3 w-3 mr-2" />
                                    Re-issue Pass
                                  </Button>
                                }
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <InventoryMovementTab />
        </TabsContent>

        {/* VISITORS DIRECTORY */}
        <TabsContent value="visitors" className="space-y-4">
          <RecurringVisitors visitors={visitors} />
        </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
function ReentrySlipRow({ slip }: { slip: ReentrySlip }) {
  const voidSlip = useVoidReentrySlip();
  const expired = isPast(new Date(slip.expires_at));
  const status = slip.voided
    ? { label: "Voided", cls: "bg-muted text-muted-foreground" }
    : expired
      ? { label: "Expired", cls: "bg-destructive text-destructive-foreground" }
      : { label: "Active", cls: "bg-green-600 text-white" };

  return (
    <TableRow>
      <TableCell><span className="font-mono text-xs">{slip.serial}</span></TableCell>
      <TableCell>
        <div className="font-medium">{slip.visitor_name}</div>
        {slip.visitor_phone && <div className="text-xs text-muted-foreground">{slip.visitor_phone}</div>}
      </TableCell>
      <TableCell className="text-sm">
        {slip.host_name && <div>{slip.host_name}</div>}
        {slip.purpose && <div className="text-xs text-muted-foreground line-clamp-1">{slip.purpose}</div>}
      </TableCell>
      <TableCell className="text-xs">{format(new Date(slip.issued_at), "dd MMM HH:mm")}</TableCell>
      <TableCell className="text-xs">
        {format(new Date(slip.expires_at), "dd MMM HH:mm")}
        <div className="text-muted-foreground">{slip.duration_minutes} min</div>
      </TableCell>
      <TableCell className="text-xs">{slip.print_width}mm</TableCell>
      <TableCell><Badge className={status.cls}>{status.label}</Badge></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <ReprintSlipButton slip={slip} />
          {!slip.voided && !expired && (
            <Button size="sm" variant="ghost" onClick={() => voidSlip.mutate(slip.id)}>
              <Ban className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function ReprintSlipButton({ slip }: { slip: ReentrySlip }) {
  const [open, setOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const schoolName = settings?.landing_hero?.school_name || "Al-Heb School";

  const remainingMin = Math.max(
    0,
    Math.round((new Date(slip.expires_at).getTime() - Date.now()) / 60000),
  );

  const handlePrint = () => {
    if (!ref.current) return;
    const w = window.open("", "_blank", "width=400,height=700");
    if (!w) return;
    w.document.write(`<html><head><title>${slip.serial}</title>
      <style>body{margin:0;padding:8px;font-family:monospace;}</style>
    </head><body>${ref.current.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Printer className="h-3 w-3" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reprint Re-entry Slip</DialogTitle>
          <DialogDescription>Serial {slip.serial}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center bg-muted/30 p-4 rounded">
          <div ref={ref}>
            <EmergencyReentrySlip
              schoolName={schoolName}
              visitorName={slip.visitor_name}
              visitorPhone={slip.visitor_phone}
              idNumber={slip.id_number}
              purpose={slip.purpose}
              host={slip.host_name}
              durationMinutes={remainingMin > 0 ? remainingMin : slip.duration_minutes}
              width={slip.print_width as 54 | 80}
              isRTL={language === "ar"}
              badgeNumber={slip.badge_number}
              originalVisitId={slip.original_visit_id}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReentrySlipDialog({
  visit,
  trigger,
}: {
  visit?: VisitorVisit;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const issue = useIssueReentrySlip();
  const { data: settings } = useSiteSettings();
  const { language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [issued, setIssued] = useState<ReentrySlip | null>(null);
  const schoolName = settings?.landing_hero?.school_name || "Al-Heb School";

  const [form, setForm] = useState<{
    visitor_name: string;
    visitor_phone: string;
    id_number: string;
    purpose: string;
    host_name: string;
    duration_minutes: number;
    print_width: 54 | 80;
    notes: string;
    district?: string;
  }>({
    visitor_name: visit?.visitor_name || "",
    visitor_phone: visit?.visitor_phone || "",
    id_number: "",
    purpose: visit?.purpose || "",
    host_name: visit?.host_name || "",
    duration_minutes: 60,
    print_width: 80 as 54 | 80,
    notes: "",
  });

  const submit = async () => {
    if (!form.visitor_name.trim()) {
      toast({ title: "Visitor name required", variant: "destructive" });
      return;
    }
    try {
      const slip = await issue.mutateAsync({
        visitor_name: form.visitor_name.trim(),
        visitor_phone: form.visitor_phone.trim() || null,
        id_number: form.id_number.trim() || null,
        purpose: form.purpose.trim() || null,
        host_name: form.host_name.trim() || null,
        duration_minutes: form.duration_minutes,
        print_width: form.print_width,
        original_visit_id: visit?.id || null,
        visitor_id: visit?.visitor_id || null,
        notes: form.notes.trim() || null,
      });
      setIssued(slip);
      toast({ title: "Slip issued", description: `Serial ${slip.serial}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!ref.current) return;
    const w = window.open("", "_blank", "width=400,height=700");
    if (!w) return;
    w.document.write(`<html><head><title>${issued?.serial}</title>
      <style>body{margin:0;padding:8px;font-family:monospace;}</style>
    </head><body>${ref.current.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => setIssued(null), 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Emergency Re-entry Slip
          </DialogTitle>
          <DialogDescription>
            Time-limited thermal pass for a visitor returning after checkout.
          </DialogDescription>
          <div className="pt-2">
            <IDScannerDialog onScanComplete={(res) => {
              setForm({
                ...form,
                visitor_name: res.identity.name,
                id_number: res.identity.nin,
                district: res.address.district,
                notes: `Address: ${res.address.village}, ${res.address.parish}, ${res.address.sub_county}`
              });
            }} />
          </div>
        </DialogHeader>

        {!issued ? (
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Visitor Name *</Label>
                <Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} maxLength={30} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>National ID No.</Label>
                <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} maxLength={40} />
              </div>
              <div className="space-y-1.5">
                <Label>Host</Label>
                <Input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} maxLength={120} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Select value={String(form.duration_minutes)} onValueChange={(v) => setForm({ ...form, duration_minutes: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Print Width</Label>
                <Select value={String(form.print_width)} onValueChange={(v) => setForm({ ...form, print_width: Number(v) as 54 | 80 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="54">54mm thermal</SelectItem>
                    <SelectItem value="80">80mm thermal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} />
            </div>
          </div>
        ) : (
          <div className="flex justify-center bg-muted/30 p-4 rounded">
            <div ref={ref}>
              <EmergencyReentrySlip
                schoolName={schoolName}
                visitorName={issued.visitor_name}
                visitorPhone={issued.visitor_phone}
                idNumber={issued.id_number}
                purpose={issued.purpose}
                host={issued.host_name}
                durationMinutes={issued.duration_minutes}
                width={issued.print_width as 54 | 80}
                isRTL={language === "ar"}
                badgeNumber={issued.badge_number}
                originalVisitId={issued.original_visit_id}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>Close</Button>
          {!issued ? (
            <Button onClick={submit} disabled={issue.isPending}>
              <Printer className="h-4 w-4 mr-2" />Issue Slip
            </Button>
          ) : (
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InventoryMovementTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: passes = [], isLoading } = useQuery({
    queryKey: ["active-gate-passes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`
          *,
          item:inventory_items(name, unit),
          learner:learners(full_name),
          staff:profiles(full_name)
        `)
        .in('status', ['director_approved', 'dispatched'])
        .order("director_approval_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_transactions")
        .update({
          status: 'verified_at_gate',
          gate_verified_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Verified", description: "Item clearance confirmed. Movement logged." });
      queryClient.invalidateQueries({ queryKey: ["active-gate-passes"] });
      setSearchTerm("");
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const filteredPasses = passes.filter(p => 
    p.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.learner?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.staff?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input 
                 placeholder="Search tracking number or recipient..." 
                 className="h-12 pl-12 font-mono"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <Button className="h-12 gap-2 font-bold px-8">
               <ScanLine className="h-5 w-5" /> Scan Pass
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">Loading clearances...</div>
        ) : filteredPasses.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
             <PackageCheck className="h-12 w-12 mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active clearances found</p>
          </div>
        ) : (
          filteredPasses.map((pass) => (
            <Card key={pass.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all bg-white">
               <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-5 border-b md:border-b-0 md:border-r">
                     <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="font-mono text-[10px]">{pass.tracking_number}</Badge>
                        <Badge className="bg-emerald-500 text-white text-[9px] uppercase font-black tracking-widest">Director Cleared</Badge>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 uppercase">{pass.item?.name}</h4>
                     <p className="text-xs text-slate-500 font-bold">Qty: {pass.quantity} {pass.item?.unit} • For: {pass.learner?.full_name || pass.staff?.full_name || 'General'}</p>
                  </div>
                  <div className="p-5 flex flex-col justify-center bg-slate-50/50 min-w-[200px]">
                     <Button 
                       className="w-full gap-2 bg-slate-900 hover:bg-black text-white shadow-lg"
                       onClick={() => verifyMutation.mutate(pass.id)}
                       disabled={verifyMutation.isPending}
                     >
                       {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                       Verify Exit
                     </Button>
                  </div>
               </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function RecurringVisitors({ visitors }: { visitors: Visitor[] }) {
  const [search, setSearch] = useState("");
  const filtered = visitors.filter((v) => v.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <div>
          <CardTitle className="text-base">Visitor Directory</CardTitle>
          <CardDescription>Reusable visitor records (contractors, vendors, etc.)</CardDescription>
        </div>
        <NewVisitorDialog />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No visitors yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quick Check-In</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.full_name}</TableCell>
                  <TableCell className="text-sm">{v.phone || "—"}</TableCell>
                  <TableCell className="text-sm">{v.company || "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{v.id_number || "—"}</TableCell>
                  <TableCell>
                    {v.is_recurring ? <Badge variant="secondary">Recurring</Badge> : <Badge variant="outline">One-time</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <CheckInDialog
                      visitor={v}
                      trigger={<Button size="sm" variant="outline"><LogIn className="h-4 w-4 mr-2" />Check In</Button>}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NewVisitorDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateVisitor();
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", company: "", id_number: "", notes: "", is_recurring: true,
    district: "",
  });

  const submit = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        id_number: form.id_number.trim() || null,
        photo_url: null,
        notes: form.notes.trim() || null,
        is_recurring: form.is_recurring,
        ...(form.district ? { district: form.district } : {}),
      } as any);
      toast({ title: "Visitor saved" });
      setOpen(false);
      setForm({ full_name: "", phone: "", email: "", company: "", id_number: "", notes: "", is_recurring: true, district: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Add Visitor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Visitor</DialogTitle>
          <DialogDescription>Reusable record for recurring visitors</DialogDescription>
          <div className="pt-2">
            <IDScannerDialog onScanComplete={(res) => {
              setForm({
                ...form,
                full_name: res.identity.name,
                id_number: res.identity.nin,
                district: res.address.district,
                notes: `Address: ${res.address.village}, ${res.address.parish}, ${res.address.sub_county}`
              });
            }} />
          </div>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>National ID No.</Label>
              <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} maxLength={40} />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <LocationSelector 
              districtValue={form.district} 
              onDistrictChange={(v) => setForm({ ...form, district: v })} 
              label="Visitor District"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
            Recurring visitor (vendor, contractor, etc.)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckInDialog({
  appointment,
  visitor,
  trigger,
}: {
  appointment?: any;
  visitor?: Visitor;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const checkIn = useCheckInVisitor();
  const { data: staff = [] } = useAllStaff();
  const { data: learners = [] } = useLearners();

  const [form, setForm] = useState({
    visitor_name: appointment?.visitor_name || visitor?.full_name || "",
    visitor_phone: appointment?.visitor_phone || visitor?.phone || "",
    purpose: appointment?.purpose || "",
    host_staff_id: appointment?.host_staff_id || "",
    learner_id: appointment?.learner_id || "",
    notes: "",
  });

  const submit = async () => {
    if (!form.visitor_name.trim()) {
      toast({ title: "Visitor name required", variant: "destructive" });
      return;
    }
    const host = staff.find((s) => s.id === form.host_staff_id);
    try {
      await checkIn.mutateAsync({
        visitor_id: visitor?.id || null,
        appointment_id: appointment?.id || null,
        visitor_name: form.visitor_name.trim(),
        visitor_phone: form.visitor_phone.trim() || null,
        visitor_photo_url: visitor?.photo_url || null,
        purpose: form.purpose.trim() || null,
        host_staff_id: form.host_staff_id || null,
        host_name: host?.full_name || appointment?.host_name || null,
        learner_id: form.learner_id || null,
        notes: form.notes.trim() || null,
      });
      toast({ title: "Visitor checked in", description: "Day pass issued" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check In Visitor</DialogTitle>
          <DialogDescription>
            {appointment ? "From scheduled appointment" : visitor ? "Recurring visitor" : "Walk-in visitor"}
          </DialogDescription>
          <div className="pt-2">
            <IDScannerDialog onScanComplete={(res) => {
              setForm({
                ...form,
                visitor_name: res.identity.name,
                notes: `NIN: ${res.identity.nin} | Address: ${res.address.village}, ${res.address.parish}, ${res.address.sub_county}, ${res.address.district}`
              });
            }} />
          </div>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Visitor Name *</Label>
              <Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} maxLength={30} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Host Staff</Label>
              <Select value={form.host_staff_id} onValueChange={(v) => setForm({ ...form, host_staff_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Linked Learner</Label>
              <Select value={form.learner_id} onValueChange={(v) => setForm({ ...form, learner_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {learners.slice(0, 200).map((l) => <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={checkIn.isPending}>
            <LogIn className="h-4 w-4 mr-2" />Check In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Visitors;