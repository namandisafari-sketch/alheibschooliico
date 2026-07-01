// @ts-nocheck
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Stethoscope,
  Pill,
  Activity,
  History,
  Plus,
  Search,
  AlertCircle,
  Thermometer,
  Clock,
  User,
  HeartPulse,
  TrendingUp,
  FileText,
  BarChart3,
  Calendar as CalendarIcon,
  Package,
  Heart,
  Weight,
  Ruler,
  Bone,
  Eye,
  Ambulance,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Download,
  ChevronDown,
  GripHorizontal,
  Scissors,
  Syringe,
  Heart as HeartIcon,
  Wind,
  Droplets,
  Zap,
  Stethoscope as StethoscopeIcon,
  FileEdit,
  ClipboardList,
  ArrowLeftRight,
  Save,
  Loader2,
  UserCheck,
  Hospital,
  Phone,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  MoreHorizontal,
  Settings2,
  BookOpen,
  Users,
  Bed,
  ShoppingCart,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  GraduationCap,
  PenLine,
  BookMarked,
  Star,
  Clock as ClockIcon,
  FlaskRound,
  Blood,
  Brain,
  ChevronRight,
  ChevronLeft,
  EyeOff,
  Eye as EyeOpen,
} from "lucide-react";
import { usePharmacy, useHealthVisits, useCreateHealthVisit, useMedicationLogs } from "@/hooks/useHealth";
import { useLearners } from "@/hooks/useLearners";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Separator } from "@/components/ui/separator";

// ─── Enhanced clinical assessment schema ───────────────────────────
const visitSchema = z.object({
  learner_id: z.string({ required_error: "Patient is required" }),
  visit_type: z.enum(["illness", "injury", "routine_checkup", "emergency"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  // Vital Signs
  temperature: z.string().optional(),
  blood_pressure_systolic: z.string().optional(),
  blood_pressure_diastolic: z.string().optional(),
  heart_rate: z.string().optional(),
  respiratory_rate: z.string().optional(),
  oxygen_saturation: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  // Clinical Assessment
  chief_complaint: z.string().min(2, "Chief complaint is required"),
  duration_of_complaint: z.string().optional(),
  onset_date: z.string().optional(),
  body_part_affected: z.string().optional(),
  symptoms: z.string().optional(),
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  // Diagnosis & Treatment
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  prescribed_medication: z.string().optional(),
  medication_dosage: z.string().optional(),
  medication_frequency: z.string().optional(),
  medication_duration: z.string().optional(),
  action_taken: z.string().optional(),
  // Referral
  referred_to: z.string().optional(),
  referred_reason: z.string().optional(),
  // Follow-up
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
  // Nurse Notes
  nurse_notes: z.string().optional(),
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ─── Quick Nav for Health pages ────────────────────────────────────
const healthNavLinks = [
  { icon: Stethoscope, label: "Health Records", path: "/health" },
  { icon: Pill, label: "Prescriptions", path: "/nurse/prescriptions" },
  { icon: Package, label: "Pharmacy Inventory", path: "/nurse/pharmacy-inventory" },
  { icon: BarChart3, label: "Pharmacy Reports", path: "/nurse/pharmacy-reports" },
  { icon: User, label: "Medical Center", path: "/nurse" },
  { icon: Activity, label: "Immunizations", path: "/nurse/clinic" },
];

const HealthNavBar = () => (
  <div className="mb-4 lg:mb-6 overflow-x-auto">
    <div className="flex gap-2 min-w-max pb-2">
      {healthNavLinks.map(l => (
        <Button
          key={l.path}
          asChild
          variant={window.location.pathname === l.path ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5 text-xs font-bold rounded-xl whitespace-nowrap"
        >
          <Link to={l.path}>
            <l.icon className="h-3.5 w-3.5" />
            {l.label}
          </Link>
        </Button>
      ))}
    </div>
  </div>
);

// ─── Stat Card with link ───────────────────────────────────────────
const StatCardLink = ({ stat, to }: { stat: any; to: string }) => (
  <Link to={to}>
    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
          </div>
          <div className={cn("p-3 rounded-xl", stat.bg)}>
            <stat.icon className={cn("h-6 w-6", stat.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const HealthManagement = () => {
  const { user } = useAuth();
  const { data: pharmacy = [], isLoading: loadingPharmacy } = usePharmacy();
  const { data: visits = [], isLoading: loadingVisits } = useHealthVisits();
  const { data: learners = [] } = useLearners();
  const { data: medicationLogs = [] } = useMedicationLogs();
  const createVisit = useCreateHealthVisit();

  const [activeTab, setActiveTab] = useState("sick-bay");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // ─── Form with all clinical fields ────────────────────────────────
  const form = useForm({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      learner_id: "",
      visit_type: "illness",
      priority: "low",
      temperature: "",
      blood_pressure_systolic: "",
      blood_pressure_diastolic: "",
      heart_rate: "",
      respiratory_rate: "",
      oxygen_saturation: "",
      weight: "",
      height: "",
      chief_complaint: "",
      duration_of_complaint: "",
      onset_date: "",
      body_part_affected: "",
      symptoms: "",
      allergies: "",
      chronic_conditions: "",
      diagnosis: "",
      treatment_plan: "",
      prescribed_medication: "",
      medication_dosage: "",
      medication_frequency: "",
      medication_duration: "",
      action_taken: "",
      referred_to: "",
      referred_reason: "",
      follow_up_date: "",
      follow_up_notes: "",
      nurse_notes: "",
    }
  });

  const watchHeight = form.watch("height");
  const watchWeight = form.watch("weight");

  const bmi = useMemo(() => {
    const h = parseFloat(watchHeight);
    const w = parseFloat(watchWeight);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      return (w / (hM * hM)).toFixed(1);
    }
    return null;
  }, [watchHeight, watchWeight]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (val < 25) return { label: "Normal", color: "text-green-500" };
    if (val < 30) return { label: "Overweight", color: "text-orange-500" };
    return { label: "Obese", color: "text-red-500" };
  }, [bmi]);

  const onSubmitVisit = async (values) => {
    try {
      const payload = {
        learner_id: values.learner_id || null,
        recorded_by: user?.id,
        visit_date: new Date().toISOString(),
        visit_type: values.visit_type,
        priority: values.priority,
        temperature: values.temperature ? parseFloat(values.temperature) : null,
        blood_pressure_systolic: values.blood_pressure_systolic ? parseInt(values.blood_pressure_systolic) : null,
        blood_pressure_diastolic: values.blood_pressure_diastolic ? parseInt(values.blood_pressure_diastolic) : null,
        heart_rate: values.heart_rate ? parseInt(values.heart_rate) : null,
        respiratory_rate: values.respiratory_rate ? parseInt(values.respiratory_rate) : null,
        oxygen_saturation: values.oxygen_saturation ? parseFloat(values.oxygen_saturation) : null,
        weight: values.weight ? parseFloat(values.weight) : null,
        height: values.height ? parseFloat(values.height) : null,
        chief_complaint: values.chief_complaint || null,
        duration_of_complaint: values.duration_of_complaint || null,
        onset_date: values.onset_date || null,
        body_part_affected: values.body_part_affected || null,
        symptoms: values.symptoms || null,
        allergies: values.allergies || null,
        chronic_conditions: values.chronic_conditions || null,
        diagnosis: values.diagnosis || null,
        treatment_plan: values.treatment_plan || null,
        prescribed_medication: values.prescribed_medication || null,
        medication_dosage: values.medication_dosage || null,
        medication_frequency: values.medication_frequency || null,
        medication_duration: values.medication_duration || null,
        action_taken: values.action_taken || null,
        referred_to: values.referred_to || null,
        referred_reason: values.referred_reason || null,
        follow_up_date: values.follow_up_date || null,
        follow_up_notes: values.follow_up_notes || null,
        nurse_notes: values.nurse_notes || null,
        status: "active",
        clinical_notes: {
          bmi: bmi ? parseFloat(bmi) : null,
          bmi_category: bmiCategory?.label || null,
        },
      };

      await createVisit.mutateAsync(payload);
      toast({
        title: "Visit Recorded",
        description: "Full clinical assessment has been saved.",
      });
      form.reset();
      setDialogOpen(false);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // ─── Filtered visits ──────────────────────────────────────────────
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const name = (v.learner?.full_name || "").toLowerCase();
      const sx = (v.symptoms || "").toLowerCase();
      const diag = (v.diagnosis || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || sx.includes(search) || diag.includes(search);
      const matchesStatus = filterStatus === "all" || v.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [visits, searchTerm, filterStatus]);

  // ─── Analytics ────────────────────────────────────────────────────
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const visitTrend = last7Days.map(date => {
    const dayStr = format(date, "MMM dd");
    const count = visits.filter(v =>
      format(new Date(v.visit_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    ).length;
    return { name: dayStr, visits: count };
  });

  const categoryData = [
    { name: 'Illness', value: visits.filter(v => v.visit_type === 'illness').length, color: '#3b82f6' },
    { name: 'Injury', value: visits.filter(v => v.visit_type === 'injury').length, color: '#f59e0b' },
    { name: 'Routine', value: visits.filter(v => v.visit_type === 'routine_checkup').length, color: '#10b981' },
    { name: 'Emergency', value: visits.filter(v => v.visit_type === 'emergency').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Critical', value: visits.filter(v => v.priority === 'critical').length, color: '#ef4444' },
    { name: 'High', value: visits.filter(v => v.priority === 'high').length, color: '#f97316' },
    { name: 'Medium', value: visits.filter(v => v.priority === 'medium').length, color: '#3b82f6' },
    { name: 'Low', value: visits.filter(v => v.priority === 'low').length, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // ─── Top diagnoses ────────────────────────────────────────────────
  const diagnosisCounts = visits
    .filter(v => v.diagnosis)
    .reduce((acc, v) => {
      acc[v.diagnosis] = (acc[v.diagnosis] || 0) + 1;
      return acc;
    }, {});
  const topDiagnoses = Object.entries(diagnosisCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // ─── Low stock items ──────────────────────────────────────────────
  const lowStockItems = pharmacy.filter(p => p.quantity <= p.min_stock_level);

  const stats = [
    { label: "Visits Today", value: visits.filter(v => format(new Date(v.visit_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Critical Cases", value: visits.filter(v => v.priority === 'critical' && v.status === 'active').length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Medicine Alerts", value: lowStockItems.length, icon: Pill, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Records", value: visits.length, icon: History, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <DashboardLayout title="Health & Medical Records" subtitle="Sick bay, clinical assessments, pharmacy, and health analytics">
      <div className="space-y-6">
        {/* Health-specific Quick Navigation */}
        <HealthNavBar />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCardLink key={stat.label} stat={stat} to={stat.label === "Medicine Alerts" ? "/nurse/pharmacy-inventory" : "/health"} />
          ))}
        </div>

        {/* Quick Links to Pharmacy Pages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/nurse/prescriptions">
            <Card className="border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-purple-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Pill className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Prescriptions</p>
                  <p className="text-sm font-bold">Manage Rx</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-purple-400" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse/pharmacy-inventory">
            <Card className="border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-orange-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Inventory</p>
                  <p className="text-sm font-bold">Stock & Batches</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-orange-400" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse/pharmacy-reports">
            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Reports</p>
                  <p className="text-sm font-bold">Analytics & EM</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-blue-400" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse">
            <Card className="border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-rose-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Clinic</p>
                  <p className="text-sm font-bold">Nurse Station</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-rose-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between bg-card p-1 rounded-xl shadow-sm border flex-wrap gap-2">
            <TabsList className="bg-transparent flex-wrap">
              <TabsTrigger value="sick-bay" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Stethoscope className="mr-2 h-4 w-4" /> Sick Bay Log
              </TabsTrigger>
              <TabsTrigger value="pharmacy" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Pill className="mr-2 h-4 w-4" /> Pharmacy Stock
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="mr-2 h-4 w-4" /> Health Analytics
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setDialogOpen(true)} className="mr-1 shadow-lg hover:shadow-primary/20 transition-all">
              <Plus className="mr-2 h-4 w-4" /> New Clinical Visit
            </Button>
          </div>

          {/* ─── SICK BAY LOG TAB ──────────────────────────────────── */}
          <TabsContent value="sick-bay" className="mt-0">
            <Card className="border-none shadow-xl">
              <CardContent className="p-0">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20 flex-wrap gap-3">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patient, symptoms, diagnosis..."
                      className="pl-9 bg-background h-9 border-none shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-9 w-[130px] text-xs border-none shadow-sm bg-background">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Discharged</SelectItem>
                        <SelectItem value="referred">Referred</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9 font-bold">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patient</th>
                        <th className="text-left p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Complaint</th>
                        <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vitals</th>
                        <th className="text-left p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Diagnosis</th>
                        <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</th>
                        <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                        <th className="text-right p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredVisits.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                              <p className="text-sm font-medium">No health visits recorded yet</p>
                              <p className="text-xs text-muted-foreground/70">Click "New Clinical Visit" to record the first patient</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredVisits.map((visit) => (
                          <tr key={visit.id} className="hover:bg-muted/5 transition-colors group">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  <User className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm leading-none mb-1 truncate max-w-[150px]">{visit.learner?.full_name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{visit.learner?.admission_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 max-w-[200px]">
                              <p className="text-xs font-medium truncate">{visit.chief_complaint || visit.symptoms || "—"}</p>
                              {visit.body_part_affected && (
                                <p className="text-[9px] text-muted-foreground mt-0.5">{visit.body_part_affected}</p>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2 text-[10px]">
                                {visit.temperature && (
                                  <span className={cn("font-mono font-bold", visit.temperature > 37.5 ? "text-red-500" : "text-muted-foreground")}>
                                    {visit.temperature}°
                                  </span>
                                )}
                                {visit.blood_pressure_systolic && (
                                  <span className="font-mono text-muted-foreground">
                                    {visit.blood_pressure_systolic}/{visit.blood_pressure_diastolic}
                                  </span>
                                )}
                                {!visit.temperature && !visit.blood_pressure_systolic && "—"}
                              </div>
                            </td>
                            <td className="p-3 max-w-[150px]">
                              <p className="text-xs text-muted-foreground truncate">{visit.diagnosis || "—"}</p>
                            </td>
                            <td className="p-3 text-center">
                              <div className={cn(
                                "h-2 w-2 rounded-full mx-auto ring-4",
                                visit.priority === 'critical' ? "bg-red-500 ring-red-100" :
                                visit.priority === 'high' ? "bg-amber-500 ring-amber-100" :
                                visit.priority === 'medium' ? "bg-blue-500 ring-blue-100" : "bg-slate-300 ring-slate-100"
                              )} />
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={
                                visit.status === 'active' ? 'default' :
                                visit.status === 'completed' ? 'secondary' : 'destructive'
                              } className="text-[9px] uppercase font-bold">
                                {visit.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col items-end">
                                <p className="text-sm font-bold">{format(new Date(visit.visit_date), "MMM dd")}</p>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(visit.visit_date), "HH:mm")}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t text-[10px] text-muted-foreground text-right">
                  {filteredVisits.length} of {visits.length} records
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PHARMACY STOCK TAB ────────────────────────────────── */}
          <TabsContent value="pharmacy" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-amber-600">{lowStockItems.length}</span> items below minimum stock level
                </p>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                  <Link to="/nurse/pharmacy-inventory">
                    Full Inventory <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pharmacy.slice(0, 12).map((item) => {
                  const isLow = item.quantity <= item.min_stock_level;
                  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                  return (
                    <Card key={item.id} className={cn(
                      "group overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-muted/30 transition-all hover:shadow-xl",
                      isLow && "ring-2 ring-amber-200",
                      isExpired && "ring-2 ring-red-200"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            "h-10 w-10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                            isLow ? "bg-amber-100 text-amber-600" :
                            isExpired ? "bg-red-100 text-red-600" :
                            "bg-primary/10 text-primary"
                          )}>
                            <Pill className="h-5 w-5" />
                          </div>
                          <Badge variant={isLow ? "destructive" : isExpired ? "destructive" : "secondary"} className="text-[8px] uppercase">
                            {isExpired ? "Expired" : isLow ? `Low (${item.quantity})` : `${item.quantity} in stock`}
                          </Badge>
                        </div>
                        <h3 className="font-black text-sm mb-0.5">{item.name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-3">
                          {item.category || "General"} • {item.unit}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 bg-background/50 rounded-lg text-[11px]">
                          <div>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Current</p>
                            <p className={cn("text-lg font-black", isLow && "text-amber-600")}>{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Min Level</p>
                            <p className="text-lg font-black">{item.min_stock_level}</p>
                          </div>
                          {item.supplier && (
                            <>
                              <div className="col-span-2 border-t pt-1.5 mt-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase">Supplier</p>
                                <p className="text-xs font-medium">{item.supplier}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isLow ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min((item.quantity / Math.max(item.min_stock_level, 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <Button asChild variant="outline" className="w-full text-[10px] font-bold h-8">
                          <Link to="/nurse/pharmacy-inventory">View Details</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {pharmacy.length > 12 && (
                <div className="text-center">
                  <Button asChild variant="outline" size="sm" className="text-xs font-bold gap-1">
                    <Link to="/nurse/pharmacy-inventory">View All {pharmacy.length} Items <ArrowRight className="h-3 w-3" /></Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── ANALYTICS TAB ─────────────────────────────────────── */}
          <TabsContent value="analytics" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Visit Trend */}
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" /> Visit Trends
                  </CardTitle>
                  <CardDescription>Daily patient count over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visitTrend}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Visit by Category */}
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-emerald-500" /> Visit Breakdown
                  </CardTitle>
                  <CardDescription>Distribution by visit type</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] flex items-center justify-center relative">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => <span className="text-xs font-medium">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                  <div className="absolute flex flex-col items-center pointer-events-none">
                    <p className="text-[9px] text-muted-foreground uppercase font-black">Total</p>
                    <p className="text-2xl font-black">{visits.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Top Diagnoses */}
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-500" /> Most Common Diagnoses
                  </CardTitle>
                  <CardDescription>Top conditions recorded</CardDescription>
                </CardHeader>
                <CardContent>
                  {topDiagnoses.length > 0 ? (
                    <div className="space-y-3">
                      {topDiagnoses.map((d, i) => {
                        const maxVal = topDiagnoses[0]?.value || 1;
                        return (
                          <div key={d.name} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium truncate">{d.name}</span>
                                <span className="font-bold text-muted-foreground">{d.value}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600"
                                  style={{ width: `${(d.value / maxVal) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No diagnoses recorded yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" /> Priority Distribution
                  </CardTitle>
                  <CardDescription>Cases by severity level</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No priority data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Summary */}
              <Card className="border-none shadow-lg md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-500" /> Summary
                  </CardTitle>
                  <CardDescription>Aggregate health statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Total Visits", value: visits.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Active Cases", value: visits.filter(v => v.status === 'active').length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Referred", value: visits.filter(v => v.status === 'referred').length, icon: Ambulance, color: "text-red-600", bg: "bg-red-50" },
                      { label: "Discharged", value: visits.filter(v => v.status === 'completed').length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Medications Given", value: medicationLogs.length, icon: Syringe, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("p-1.5 rounded-lg", s.bg)}>
                            <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</span>
                        </div>
                        <p className="text-xl font-black ml-1">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── ENHANCED CLINICAL VISIT DIALOG ────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <StethoscopeIcon className="h-5 w-5 text-primary" />
              New Clinical Assessment
            </DialogTitle>
            <DialogDescription>
              Complete a detailed clinical evaluation for the patient
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitVisit)} className="space-y-6">

              {/* ── Section 1: Patient & Visit Info ────────────────── */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <User className="h-4 w-4" /> Patient & Visit Information
                  <div className="flex-1 border-t border-dashed mx-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="learner_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Patient <span className="text-red-500">*</span></FormLabel>
                      <SearchableSelect
                        options={learners.map(l => ({ value: l.id, label: `${l.full_name}${l.admission_number ? ` (${l.admission_number})` : ""}`, searchTerms: [l.full_name, l.admission_number || ""] }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select learner..."
                        searchPlaceholder="Search by name or admission..."
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="visit_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Visit Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="illness">Illness</SelectItem>
                          <SelectItem value="injury">Injury / Trauma</SelectItem>
                          <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Priority / Severity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low — Routine</SelectItem>
                          <SelectItem value="medium">Medium — Needs Attention</SelectItem>
                          <SelectItem value="high">High — Urgent</SelectItem>
                          <SelectItem value="critical">Critical — Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ── Section 2: Vital Signs ─────────────────────────── */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <HeartPulse className="h-4 w-4" /> Vital Signs
                  <div className="flex-1 border-t border-dashed mx-3" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="temperature" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Temperature (°C)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" step="0.1" placeholder="37.0" {...field} className="pl-7" />
                          <Thermometer className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      {field.value && (
                        <p className={cn("text-[10px] font-medium mt-0.5", parseFloat(field.value) > 37.5 ? "text-red-500" : "text-green-500")}>
                          {parseFloat(field.value) > 37.5 ? "⚠ Fever detected" : "Normal range"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="blood_pressure_systolic" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Systolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" placeholder="120" {...field} className="pl-7" />
                          <HeartIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="blood_pressure_diastolic" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Diastolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" placeholder="80" {...field} className="pl-7" />
                          <HeartIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      {form.watch("blood_pressure_systolic") && field.value && (
                        <p className={cn("text-[10px] font-medium mt-0.5",
                          parseInt(form.watch("blood_pressure_systolic")) >= 140 || parseInt(field.value) >= 90 ? "text-red-500" : "text-green-500"
                        )}>
                          {parseInt(form.watch("blood_pressure_systolic")) >= 140 || parseInt(field.value) >= 90
                            ? "⚠ Elevated — monitor closely"
                            : "Normal reading"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="heart_rate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Heart Rate (bpm)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" placeholder="72" {...field} className="pl-7" />
                          <Activity className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      {field.value && (
                        <p className={cn("text-[10px] font-medium mt-0.5",
                          parseInt(field.value) > 100 ? "text-red-500" :
                          parseInt(field.value) < 60 ? "text-amber-500" : "text-green-500"
                        )}>
                          {parseInt(field.value) > 100 ? "⚠ Tachycardia" :
                           parseInt(field.value) < 60 ? "⚠ Bradycardia" : "Normal range (60-100)"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="respiratory_rate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Respiratory Rate (/min)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" placeholder="16" {...field} className="pl-7" />
                          <Wind className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      {field.value && (
                        <p className={cn("text-[10px] font-medium mt-0.5",
                          parseInt(field.value) > 20 ? "text-red-500" : "text-green-500"
                        )}>
                          {parseInt(field.value) > 20 ? "⚠ Tachypnea" : "Normal (12-20)"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="oxygen_saturation" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">SpO₂ (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" step="0.1" placeholder="98" {...field} className="pl-7" />
                          <Droplets className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      {field.value && (
                        <p className={cn("text-[10px] font-medium mt-0.5",
                          parseFloat(field.value) < 95 ? "text-red-500 font-bold" : "text-green-500"
                        )}>
                          {parseFloat(field.value) < 95 ? "⚠ Hypoxia — urgent attention" : "Normal (>95%)"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="weight" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Weight (kg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" step="0.1" placeholder="45" {...field} className="pl-7" />
                          <Weight className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="height" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Height (cm)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" step="0.5" placeholder="150" {...field} className="pl-7" />
                          <Ruler className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {bmi && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">
                        BMI: <span className="text-lg font-black">{bmi}</span>
                        <span className={cn("ml-2 text-sm font-medium", bmiCategory?.color)}>
                          ({bmiCategory?.label})
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">Auto-calculated from weight and height</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 3: Clinical Assessment ─────────────────── */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <ClipboardList className="h-4 w-4" /> Clinical Assessment
                  <div className="flex-1 border-t border-dashed mx-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="chief_complaint" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Chief Complaint <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="Main reason for visit (e.g. headache, fever, cough)" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="duration_of_complaint" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Duration</FormLabel>
                      <FormControl><Input placeholder="e.g. 2 days, 3 hours, 1 week" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="onset_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Onset Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="body_part_affected" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Body Part Affected</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select body part" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Head">Head</SelectItem>
                          <SelectItem value="Eyes">Eyes</SelectItem>
                          <SelectItem value="Ears">Ears</SelectItem>
                          <SelectItem value="Nose">Nose</SelectItem>
                          <SelectItem value="Throat">Throat</SelectItem>
                          <SelectItem value="Neck">Neck</SelectItem>
                          <SelectItem value="Chest">Chest</SelectItem>
                          <SelectItem value="Abdomen">Abdomen</SelectItem>
                          <SelectItem value="Back">Back</SelectItem>
                          <SelectItem value="Upper Limb (Left)">Upper Limb (Left)</SelectItem>
                          <SelectItem value="Upper Limb (Right)">Upper Limb (Right)</SelectItem>
                          <SelectItem value="Lower Limb (Left)">Lower Limb (Left)</SelectItem>
                          <SelectItem value="Lower Limb (Right)">Lower Limb (Right)</SelectItem>
                          <SelectItem value="Multiple">Multiple / Generalized</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="symptoms" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Detailed Symptoms</FormLabel>
                      <FormControl><Input placeholder="e.g. Productive cough, yellow sputum, night sweats" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="allergies" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Known Allergies</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List known allergies (drug, food, environmental) or 'None known'" className="min-h-[60px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="chronic_conditions" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Chronic Conditions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Asthma, Diabetes, Sickle cell, Epilepsy, or 'None'" className="min-h-[60px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ── Section 4: Diagnosis & Treatment ──────────────── */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <FileEdit className="h-4 w-4" /> Diagnosis & Treatment
                  <div className="flex-1 border-t border-dashed mx-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="diagnosis" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Diagnosis</FormLabel>
                      <FormControl><Input placeholder="Clinical diagnosis" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="action_taken" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Action Taken</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Rest in sick bay">Rest in Sick Bay</SelectItem>
                          <SelectItem value="Given medication">Given Medication</SelectItem>
                          <SelectItem value="First aid administered">First Aid Administered</SelectItem>
                          <SelectItem value="Sent home">Sent Home / Bed Rest</SelectItem>
                          <SelectItem value="Referred to hospital">Referred to Hospital</SelectItem>
                          <SelectItem value="Health education given">Health Education Given</SelectItem>
                          <SelectItem value="Observation">Under Observation</SelectItem>
                          <SelectItem value="Discharged">Discharged</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="treatment_plan" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Treatment Plan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed treatment plan, instructions, and recommendations" className="min-h-[60px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Medication sub-section */}
                <div className="p-3 rounded-lg bg-muted/30 border space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5" /> Prescribed Medication (if applicable)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField control={form.control} name="prescribed_medication" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold">Medication</FormLabel>
                        <FormControl><Input placeholder="Medication name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="medication_dosage" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold">Dosage</FormLabel>
                        <FormControl><Input placeholder="e.g. 500mg, 2 tablets" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField control={form.control} name="medication_frequency" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold">Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="How often?" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Once daily (OD)">Once daily (OD)</SelectItem>
                            <SelectItem value="Twice daily (BD)">Twice daily (BD)</SelectItem>
                            <SelectItem value="Three times daily (TDS)">Three times daily (TDS)</SelectItem>
                            <SelectItem value="Four times daily (QDS)">Four times daily (QDS)</SelectItem>
                            <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                            <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                            <SelectItem value="As needed (PRN)">As needed (PRN)</SelectItem>
                            <SelectItem value="Once (STAT)">Once (STAT)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="medication_duration" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold">Duration</FormLabel>
                        <FormControl><Input placeholder="e.g. 7 days, 2 weeks" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              {/* ── Section 5: Referral ───────────────────────────── */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Ambulance className="h-4 w-4" /> Referral (if applicable)
                  <div className="flex-1 border-t border-dashed mx-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="referred_to" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Referred To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Local Health Centre">Local Health Centre (HC III/IV)</SelectItem>
                          <SelectItem value="General Hospital">General Hospital</SelectItem>
                          <SelectItem value="Regional Referral Hospital">Regional Referral Hospital</SelectItem>
                          <SelectItem value="National Referral Hospital">National Referral Hospital</SelectItem>
                          <SelectItem value="Private Clinic">Private Clinic</SelectItem>
                          <SelectItem value="Dental Clinic">Dental Clinic</SelectItem>
                          <SelectItem value="Eye Clinic">Eye Clinic</SelectItem>
                          <SelectItem value="Mental Health Unit">Mental Health Unit</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="referred_reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Reason for Referral</FormLabel>
                      <FormControl><Input placeholder="Why is the patient being referred?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ── Section 6: Follow-up & Notes ──────────────────── */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <ClockIcon className="h-4 w-4" /> Follow-up & Nurse Notes
                  <div className="flex-1 border-t border-dashed mx-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="follow_up_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Follow-up Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="follow_up_notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Follow-up Notes</FormLabel>
                      <FormControl><Input placeholder="Instructions for follow-up" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="nurse_notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Nurse / Clinician Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional clinical observations, remarks, or confidential notes"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Submit */}
              <DialogFooter className="gap-2 sticky bottom-0 bg-background pt-2 pb-1 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  form.reset();
                  setDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createVisit.isPending} className="gap-2 min-w-[180px]">
                  {createVisit.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {createVisit.isPending ? "Saving..." : "Complete Clinical Assessment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default HealthManagement;
