import { useState } from "react";
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
  Calendar as CalendarIcon
} from "lucide-react";
import { usePharmacy, useHealthVisits, useCreateHealthVisit } from "@/hooks/useHealth";
import { useLearners } from "@/hooks/useLearners";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
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
  Cell
} from 'recharts';

const visitSchema = z.object({
  learner_id: z.string().optional(),
  visit_type: z.enum(['illness', 'injury', 'routine_checkup', 'emergency']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  symptoms: z.string().min(3, "Symptoms required"),
  temperature: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  action_taken: z.string().optional(),
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const HealthManagement = () => {
  const { data: pharmacy = [], isLoading: loadingPharmacy } = usePharmacy();
  const { data: visits = [], isLoading: loadingVisits } = useHealthVisits();
  const { data: learners = [] } = useLearners();
  const createVisit = useCreateHealthVisit();
  
  const [activeTab, setActiveTab] = useState("sick-bay");
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      visit_type: "illness",
      priority: "low",
      symptoms: "",
      temperature: "36.5",
    }
  });

  const onSubmitVisit = async (values: z.infer<typeof visitSchema>) => {
    try {
      await createVisit.mutateAsync({
        ...values,
        temperature: values.temperature ? parseFloat(values.temperature) : null,
        status: 'completed'
      });
      toast({ title: "Visit Recorded", description: "Health record updated successfully." });
      form.reset();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Analytics Data
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const visitTrend = last7Days.map(date => {
    const dayStr = format(date, "MMM dd");
    const count = visits.filter(v => format(new Date(v.visit_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")).length;
    return { name: dayStr, visits: count };
  });

  const categoryData = [
    { name: 'Illness', value: visits.filter(v => v.visit_type === 'illness').length },
    { name: 'Injury', value: visits.filter(v => v.visit_type === 'injury').length },
    { name: 'Routine', value: visits.filter(v => v.visit_type === 'routine_checkup').length },
    { name: 'Emergency', value: visits.filter(v => v.visit_type === 'emergency').length },
  ].filter(d => d.value > 0);

  const stats = [
    { label: "Visits Today", value: visits.filter(v => format(new Date(v.visit_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Critical Cases", value: visits.filter(v => v.priority === 'critical' && v.status === 'active').length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Medicine Alerts", value: pharmacy.filter(p => p.quantity <= p.min_stock_level).length, icon: Pill, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Records", value: visits.length, icon: History, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <DashboardLayout title="Pharmacy & Sick Bay" subtitle="Medical records and pharmacy management">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
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
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between bg-card p-1 rounded-xl shadow-sm border">
            <TabsList className="bg-transparent">
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
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mr-1 shadow-lg hover:shadow-primary/20 transition-all">
                  <Plus className="mr-2 h-4 w-4" /> Record New Visit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record Sick Bay Visit</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitVisit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="learner_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient (Learner)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {learners.map(l => (
                                  <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temp (°C)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="visit_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="illness">Illness</SelectItem>
                                <SelectItem value="injury">Injury</SelectItem>
                                <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symptoms / Complaint</FormLabel>
                          <FormControl><Textarea placeholder="Describe the symptoms..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="diagnosis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diagnosis (if known)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="action_taken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action Taken</FormLabel>
                            <FormControl><Input placeholder="e.g. Bed rest, referral" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full">Record Health Visit</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="sick-bay" className="mt-0">
            <Card className="border-none shadow-xl">
              <CardContent className="p-0">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search patient or symptoms..." 
                      className="pl-9 bg-background h-9 border-none shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 font-bold"><FileText className="mr-2 h-4 w-4" /> Export Log</Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patient</th>
                        <th className="text-left p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</th>
                        <th className="text-left p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Symptoms</th>
                        <th className="text-center p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Temp</th>
                        <th className="text-center p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</th>
                        <th className="text-right p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {visits.filter(v => (v.learner?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || v.symptoms.toLowerCase().includes(searchTerm.toLowerCase())).map((visit) => (
                        <tr key={visit.id} className="hover:bg-muted/5 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1">{visit.learner?.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{visit.learner?.admission_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] capitalize bg-background">{visit.visit_type}</Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{visit.symptoms}</p>
                          </td>
                          <td className="p-4 text-center">
                            {visit.temperature ? (
                              <div className="flex items-center justify-center gap-1">
                                <Thermometer className={cn("h-3 w-3", visit.temperature > 37.5 ? "text-red-500" : "text-muted-foreground")} />
                                <span className={cn("text-sm font-bold", visit.temperature > 37.5 && "text-red-600")}>{visit.temperature}°</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="p-4 text-center">
                            <div className={cn(
                              "h-2 w-2 rounded-full mx-auto ring-4",
                              visit.priority === 'critical' ? "bg-red-500 ring-red-100" :
                              visit.priority === 'high' ? "bg-amber-500 ring-amber-100" :
                              visit.priority === 'medium' ? "bg-blue-500 ring-blue-100" : "bg-slate-300 ring-slate-100"
                            )} />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-col items-end">
                              <p className="text-sm font-bold">{format(new Date(visit.visit_date), "MMM dd")}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(visit.visit_date), "HH:mm")}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pharmacy" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pharmacy.map((item) => (
                <Card key={item.id} className="group overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Pill className="h-6 w-6" />
                      </div>
                      <Badge variant={item.quantity <= item.min_stock_level ? "destructive" : "secondary"}>
                        {item.quantity <= item.min_stock_level ? "Low Stock" : "Available"}
                      </Badge>
                    </div>
                    <h3 className="font-black text-lg mb-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-4">{item.category} • {item.unit}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-background/50 rounded-xl">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Stock</p>
                        <p className="text-2xl font-black">{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Expiry</p>
                        <p className={cn("text-xs font-bold mt-2", item.expiry_date && new Date(item.expiry_date) < new Date() ? "text-red-500" : "text-foreground")}>
                          {item.expiry_date ? format(new Date(item.expiry_date), "MMM yyyy") : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full text-xs font-bold h-9">Manage Item</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" /> Visit Trends
                  </CardTitle>
                  <CardDescription>Patient visits over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visitTrend}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" /> Illness Breakdown
                  </CardTitle>
                  <CardDescription>Most common visit reasons</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Total</p>
                    <p className="text-2xl font-black">{visits.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HealthManagement;
