// @ts-nocheck

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Landmark, 
  Edit2, 
  Trash2,
  Users,
  Shield,
  Car,
  UtensilsCrossed,
  Briefcase,
  GraduationCap,
  Filter,
  Mail,
  Phone,
  BookOpen,
  Printer,
  Coins,
  Search,
  Plus,
  Clock,
  Loader2,
  CheckCircle2,
  History,
  UserPlus
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustodyPrintDialog } from "@/components/finance/CustodyPrintDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

const ArrowUpRight = ({ className }: { className?: string }) => <History className={cn("-rotate-45", className)} />;

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-4 w-4" />,
  teacher: <GraduationCap className="h-4 w-4" />,
  driver: <Car className="h-4 w-4" />,
  cook: <UtensilsCrossed className="h-4 w-4" />,
  accountant: <Briefcase className="h-4 w-4" />,
  security: <Shield className="h-4 w-4 text-red-500" />,
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-600",
  teacher: "bg-blue-500/10 text-blue-600",
  support: "bg-green-500/10 text-green-600",
  driver: "bg-orange-500/10 text-orange-600",
  security: "bg-red-500/10 text-red-600",
  cook: "bg-yellow-500/10 text-yellow-600",
  accountant: "bg-indigo-500/10 text-indigo-600",
};

const WorkforceHub = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Dialog States
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [isIssuingAdvance, setIsIssuingAdvance] = useState(false);
  const [advanceProjectId, setAdvanceProjectId] = useState<string>("");
  const [advanceDuration, setAdvanceDuration] = useState<string>("15 days");
  const [advancePurpose, setAdvancePurpose] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<string>("");
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);

  // Form States - Employee
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("support");
  const [empSalary, setEmpSalary] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empQual, setEmpQual] = useState("");
  const [empClass, setEmpClass] = useState("");
  const [empSubjects, setEmpSubjects] = useState("");

  const { user, profile: currentUserProfile } = useAuth();

  // Queries
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees", currentUserProfile?.school_id, currentUserProfile?.district_id],
    queryFn: async () => {
      // 1. Fetch profiles (clean, no joins)
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profError) throw profError;

      // 2. Fetch all user roles separately
      const { data: rolesData } = await supabase.from("user_roles").select("*");

      // 3. Fetch employee payroll data
      const { data: employeeData } = await supabase.from("employees").select("*");

      // 4. Fetch personnel attendance for the current month
      const startOfMonth = format(new Date(), 'yyyy-MM-01');
      const { data: attendanceData } = await supabase
        .from("personnel_attendance")
        .select("*")
        .gte("date", startOfMonth);
      
      // Map to a flattened structure
      return (profiles || []).map((p: any) => {
        // Find role in user_roles or fall back to profile role
        const roleRecord = (rolesData || []).find((r: any) => r.user_id === p.id);
        const role = roleRecord?.role || p.role;
        
        const empRecord = (employeeData || []).find((e: any) => e.profile_id === p.id);
        const empAttendance = (attendanceData || []).filter((a: any) => a.employee_id === empRecord?.id || a.employee_id === p.id);
        
        return {
          id: empRecord?.id || p.id,
          profile_id: p.id,
          full_name: p.full_name,
          role: role || 'support',
          email: p.email,
          phone: p.phone,
          qualification: p.qualification,
          base_salary: empRecord?.base_salary || 0,
          assigned_class: empRecord?.assigned_class,
          subjects: empRecord?.subjects,
          has_role: !!role,
          attendance: empAttendance
        };
      });
    }
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*");
      return data || [];
    }
  });

  const showPrintForm = (adv: any) => {
    setSelectedAdvance(adv);
    setIsPrintDialogOpen(true);
  };

  // Mutations
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ employeeId, date, status }: { employeeId: string, date: string, status: string }) => {
      const { error } = await supabase
        .from("personnel_attendance")
        .upsert({ 
          employee_id: employeeId, 
          date, 
          status,
          recorded_by: user?.id 
        }, { onConflict: 'employee_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Attendance Updated");
    }
  });

  const finalizeAttendanceMutation = useMutation({
    mutationFn: async () => {
      const startOfMonth = format(new Date(), 'yyyy-MM-01');
      const { error } = await supabase
        .from("personnel_attendance")
        .update({ is_finalized: true })
        .gte("date", startOfMonth);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Month Finalized", { description: "Attendance logs have been locked for payroll." });
    }
  });


  const { data: advances, isLoading: loadingAdvances } = useQuery({
    queryKey: ["employee_advances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_advances")
        .select("*, employees(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const advanceStageMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string, action: "approve" | "reject", reason?: string }) => {
      const { data, error } = await supabase.rpc("advance_custody_request", {
        _id: id,
        _action: action,
        _reason: reason
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_advances"] });
      toast.success("Workflow stage updated");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const { data: payrollRuns } = useQuery({
    queryKey: ["payroll_runs"],
    queryFn: async () => {
      const { data } = await supabase.from("payroll_runs").select("*").order("created_at", { ascending: false });
      return data || [];
    }
  });

  const executePayrollMutation = useMutation({
    mutationFn: async () => {
      const month = format(new Date(), 'yyyy-MM');
      const empList = employees || [];
      const totalGross = empList.reduce((s, e) => s + Number(e.base_salary || 0), 0);
      const totalNet = empList.reduce((s, e) => {
        const gross = Number(e.base_salary || 0);
        const paye = gross <= 235000 ? 0 : gross <= 335000 ? (gross - 235000) * 0.1 : gross <= 410000 ? 10000 + (gross - 335000) * 0.2 : gross <= 10000000 ? 25000 + (gross - 410000) * 0.3 : 25000 + (10000000 - 410000) * 0.3 + (gross - 10000000) * 0.4;
        const nssf = gross * 0.05;
        return s + gross - paye - nssf;
      }, 0);
      const { error } = await supabase.from("payroll_runs").insert({
        month,
        status: "completed",
        total_gross_pay: totalGross,
        total_net_pay: totalNet,
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      });
      if (error) throw error;
      for (const emp of empList) {
        const gross = Number(emp.base_salary || 0);
        const paye = gross <= 235000 ? 0 : gross <= 335000 ? (gross - 235000) * 0.1 : gross <= 410000 ? 10000 + (gross - 335000) * 0.2 : gross <= 10000000 ? 25000 + (gross - 410000) * 0.3 : 25000 + (10000000 - 410000) * 0.3 + (gross - 10000000) * 0.4;
        const nssf = gross * 0.05;
        await supabase.from("salary_records").insert({
          profile_id: emp.profile_id || emp.id,
          base_salary: gross,
          allowances: 0,
          deductions: paye + nssf,
          net_salary: gross - paye - nssf,
          month,
          status: "pending",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success(`Payroll for ${format(new Date(), 'MMMM yyyy')} processed successfully`);
      setIsGeneratingPayroll(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mutations
  const addEmployeeMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        profile_id: editingEmployee?.profile_id || undefined,
        full_name: empName,
        role: empRole,
        base_salary: parseFloat(empSalary),
        email: empEmail,
        phone: empPhone,
        qualification: empQual,
        assigned_class: empRole === 'teacher' ? empClass : null,
        subjects: empRole === 'teacher' ? empSubjects : null
      };

      // If we have a profile_id, we upsert to link them correctly
      if (editingEmployee?.profile_id) {
        const { error } = await supabase.from("employees").upsert(
          { ...payload, profile_id: editingEmployee.profile_id },
          { onConflict: 'profile_id' }
        );
        if (error) throw error;
      } else if (editingEmployee?.id && !editingEmployee.profile_id) {
        // This is a record that's already in employees but might not have a profile_id (unlikely with new schema but safe)
        const { error } = await supabase.from("employees").update(payload).eq("id", editingEmployee.id);
        if (error) throw error;
      } else {
        // Fresh insert for a person who doesn't even have a profile yet
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(editingEmployee ? "Record updated" : "Workforce record created");
      setIsAddingEmployee(false);
      setEditingEmployee(null);
      resetForm();
    }
  });

  const resetForm = () => {
    setEmpName("");
    setEmpSalary("");
    setEmpEmail("");
    setEmpPhone("");
    setEmpQual("");
    setEmpClass("");
    setEmpSubjects("");
    setEmpRole("support");
  };

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEmpName(emp.full_name);
    setEmpRole(emp.role || "support");
    setEmpSalary(emp.base_salary?.toString() || "");
    setEmpEmail(emp.email || "");
    setEmpPhone(emp.phone || "");
    setEmpQual(emp.qualification || "");
    setEmpClass(emp.assigned_class || "");
    setEmpSubjects(emp.subjects || "");
    setIsAddingEmployee(true);
  };

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Staff record removed");
    }
  });

  const filteredEmployees = employees?.filter(emp => {
    const fullName = emp.full_name || "";
    const email = emp.email || "";
    const role = emp.role || "";
    
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          role.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesRole = roleFilter === "all" || role.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(currentYear, currentMonth, index + 1);
    return {
      iso: format(date, 'yyyy-MM-dd'),
      label: format(date, 'd')
    };
  });

  const stats = [
    { label: "Total Workforce", value: employees?.length || 0, icon: Users, color: "text-slate-900", bg: "bg-slate-100" },
    { label: "Teaching Staff", value: employees?.filter(e => e.role === 'teacher').length || 0, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Support & Workers", value: employees?.filter(e => e.role !== 'teacher').length || 0, icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Attendance Today", value: "94%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <DashboardLayout title="Workforce & HR Hub" subtitle="Unified management center for Teachers, Staff, and Support Workers">
      
      {/* Payroll Summary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
        <Card className="border-2 border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Payroll Cost</p>
          <p className="text-2xl font-black text-indigo-700 font-mono">
            {(employees || []).reduce((s, e) => s + Number(e.base_salary || 0), 0).toLocaleString()}
          </p>
        </Card>
        <Card className="border-2 border-emerald-100 rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Teachers</p>
          <p className="text-2xl font-black text-emerald-700">{(employees || []).filter(e => e.role === 'teacher').length}</p>
        </Card>
        <Card className="border-2 border-amber-100 rounded-2xl bg-gradient-to-br from-amber-50 to-white p-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Support Staff</p>
          <p className="text-2xl font-black text-amber-700">{(employees || []).filter(e => e.role !== 'teacher').length}</p>
        </Card>
        <Card className="border-2 border-rose-100 rounded-2xl bg-gradient-to-br from-rose-50 to-white p-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Avg Salary</p>
          <p className="text-2xl font-black text-rose-700 font-mono">
            {(() => {
              const arr = employees || [];
              return arr.length ? Math.round(arr.reduce((s, e) => s + Number(e.base_salary || 0), 0) / arr.length).toLocaleString() : '0';
            })()}
          </p>
        </Card>
        <Card className="border-2 border-sky-100 rounded-2xl bg-gradient-to-br from-sky-50 to-white p-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Attendance Rate</p>
          <p className="text-2xl font-black text-sky-700">
            {(() => {
              const arr = employees || [];
              if (!arr.length) return '—';
              const avg = arr.reduce((s, e) => {
                const days = (e.attendance || []).length;
                const present = (e.attendance || []).filter((a: any) => a.status === 'present').length;
                return s + (days ? present / days : 0);
              }, 0) / arr.length * 100;
              return `${Math.round(avg)}%`;
            })()}
          </p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-fit p-1 bg-slate-100 rounded-2xl mb-8 overflow-x-auto max-w-full no-scrollbar">
          <TabsTrigger value="directory" className="gap-2 rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Users className="h-4 w-4" /> Workforce Directory
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2 rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Clock className="h-4 w-4" /> Attendance Log
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2 rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Landmark className="h-4 w-4" /> Payroll Runs
          </TabsTrigger>
          <TabsTrigger value="advances" className="gap-2 rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Coins className="h-4 w-4" /> Advances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full xl:max-w-3xl">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search workforce..." 
                    className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>
               <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold">
                     <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <SelectValue placeholder="All Roles" />
                     </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                     <SelectItem value="all">All Workforce</SelectItem>
                     <SelectItem value="teacher">Teachers</SelectItem>
                     <SelectItem value="admin">Administration</SelectItem>
                     <SelectItem value="support">Support/Workers</SelectItem>
                     <SelectItem value="driver">Logistics/Drivers</SelectItem>
                     <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <Button onClick={() => { resetForm(); setIsAddingEmployee(true); }} className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest gap-2 w-full xl:w-auto hover:scale-105 transition-transform shrink-0">
               <Plus className="h-5 w-5" /> New Registration
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingEmployees ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : filteredEmployees?.length === 0 ? (
              <div className="col-span-full py-20 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-center">
                 <Users className="h-16 w-16 mb-4 text-slate-200" />
                 <h3 className="text-xl font-bold text-slate-900">No Personnel Found</h3>
                 <p className="text-sm text-slate-500 mt-1 max-w-xs">We couldn't find any staff or teachers matching your criteria. Try adjusting your filters or register a new member.</p>
              </div>
            ) : filteredEmployees?.map(emp => (
              <Card key={emp.id} className="border-none shadow-sm rounded-[40px] overflow-hidden group hover:shadow-xl transition-all duration-500 bg-white border border-transparent hover:border-slate-100">
                <div className={cn("h-1.5 w-full", roleColors[emp.role] || "bg-slate-200")} />
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn("h-16 w-16 rounded-[28px] flex items-center justify-center text-2xl font-black shadow-inner", roleColors[emp.role] || "bg-slate-100")}>
                      {emp.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-50 hover:bg-slate-100" onClick={() => handleEdit(emp)}><Edit2 className="h-4 w-4" /></Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-9 w-9 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                         onClick={() => confirm("Permanently remove staff record?") && deleteEmployeeMutation.mutate(emp.id)}
                       >
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{emp.full_name}</h3>
                    <div className="flex items-center gap-2">
                       <span className={cn("p-1 rounded-lg", roleColors[emp.role])}>
                          {roleIcons[emp.role] || <Users className="h-3 w-3" />}
                       </span>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{emp.role}</p>
                    </div>
                  </div>

                  {emp.role === 'teacher' && (
                    <div className="mb-6 p-4 rounded-3xl bg-blue-50/50 border border-blue-100/50">
                       <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-3 w-3 text-blue-500" />
                          <span className="text-[10px] font-black uppercase text-blue-600">Academic Assignment</span>
                       </div>
                       <p className="text-xs font-bold text-slate-700">{emp.assigned_class || 'General'} Teacher</p>
                       <p className="text-[10px] text-blue-400 mt-1 truncate">{emp.subjects || 'All Subjects'}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                       <Mail className="h-4 w-4 opacity-30 shrink-0" />
                       <span className="truncate">{emp.email || 'No email registered'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                       <Phone className="h-4 w-4 opacity-30 shrink-0" />
                       <span className="font-medium">{emp.phone || 'No phone number'}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-5 border-t border-slate-50">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl">
                       <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Base Salary</p>
                       <p className="text-sm font-black text-slate-900 font-mono">{(emp.base_salary || 0).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-4 rounded-xl">
                       Full Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
           <div className="bg-white rounded-[44px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/20">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Workforce Attendance Log</h3>
                    <p className="text-sm text-slate-500 font-medium">Daily clock-in verification for {format(new Date(), 'MMMM yyyy')}.</p>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold px-6">Previous Month</Button>
                    <Button 
                        onClick={() => finalizeAttendanceMutation.mutate()}
                        disabled={finalizeAttendanceMutation.isPending}
                        className="h-12 rounded-2xl bg-slate-900 text-xs font-black uppercase px-8"
                    >
                        {finalizeAttendanceMutation.isPending ? "Finalizing..." : "Submit Final Log"}
                    </Button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <tr>
                          <th className="px-10 py-8">Staff Member</th>
                          <th className="px-4 py-8">Department</th>
                          {monthDates.map((day, i) => (
                            <th key={day.iso} className="px-2 py-8 text-center text-[9px] font-black">{day.label}</th>
                          ))}
                          <th className="px-10 py-8 text-right">Utilization</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {employees?.map(emp => {
                         const attendanceRate = emp.attendance?.length ? (emp.attendance.filter((a: any) => a.status === 'present').length / daysInMonth * 100).toFixed(0) : 0;
                         
                         return (
                           <tr key={emp.id} className="text-sm hover:bg-slate-50/80 transition-colors group">
                              <td className="px-10 py-8">
                                 <div className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm", roleColors[emp.role])}>{emp.full_name?.charAt(0) || "?"}</div>
                                    <div>
                                       <p className="font-bold text-slate-900 leading-none mb-1">{emp.full_name}</p>
                                       <p className="text-[10px] text-slate-400 uppercase font-black">{emp.qualification || 'Staff'}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-4 py-8">
                                 <Badge variant="outline" className={cn("text-[9px] uppercase font-black border-none", roleColors[emp.role])}>{emp.role}</Badge>
                              </td>
                              {monthDates.map((day) => {
                                const date = day.iso;
                                const record = emp.attendance?.find((a: any) => a.date === date);
                                const isPresent = record?.status === 'present';
                                const isLate = record?.status === 'late';
                                const statusLabel = record?.status ? record.status.toUpperCase() : '—';

                                return (
                                  <td key={day.iso} className="px-2 py-8 text-center">
                                     <button 
                                       onClick={() => markAttendanceMutation.mutate({ 
                                         employeeId: emp.id, 
                                         date, 
                                         status: isPresent ? 'absent' : 'present' 
                                       })}
                                       disabled={markAttendanceMutation.isPending}
                                       className={cn(
                                         "h-6 w-6 rounded-full mx-auto border-2 flex items-center justify-center transition-all",
                                         isPresent 
                                           ? "bg-emerald-50 border-emerald-400" 
                                           : "bg-slate-50 border-slate-200 hover:border-slate-400"
                                       )}
                                     >
                                        <div className={cn(
                                          "h-1.5 w-1.5 rounded-full transition-all",
                                          isPresent ? "bg-emerald-500 scale-100" : "bg-slate-300 scale-0"
                                        )} />
                                     </button>
                                     <div className={cn(
                                        "text-[10px] mt-1 uppercase tracking-widest",
                                        isLate ? "text-amber-600" : record?.status === 'absent' ? "text-red-600" : "text-slate-500"
                                     )}>{statusLabel}</div>
                                  </td>
                                );
                              })}
                              <td className="px-10 py-8 text-right">
                                 <div className="inline-flex items-center gap-2">
                                    <span className="font-mono font-black text-slate-900">{attendanceRate}%</span>
                                    <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-emerald-500" style={{ width: `${attendanceRate}%` }} />
                                    </div>
                                 </div>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
           <div className="flex justify-between items-center bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm">
              <div>
                 <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Financial Execution</h2>
                 <p className="text-sm text-slate-500 font-medium">Batch process salaries with automated statutory deductions.</p>
              </div>
              <Button className="h-16 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-slate-200 transition-all hover:-translate-y-1" onClick={() => setIsGeneratingPayroll(true)}>
                 <Landmark className="h-6 w-6 text-emerald-400" /> Run Payroll Batch
              </Button>
           </div>
           
           <div className="grid gap-6">
              {payrollRuns?.map(run => (
                <Card key={run.id} className="p-8 rounded-[40px] border-slate-100 hover:border-slate-300 transition-all flex items-center justify-between bg-white shadow-sm group">
                   <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-[28px] bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">
                         {format(new Date(run.month), 'MMM')}
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">{format(new Date(run.month), 'MMMM yyyy')} Salary Run</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[9px] font-black uppercase bg-emerald-500 text-white border-none">{run.status}</Badge>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• All Staff Verified</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Net Disbursement</p>
                      <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{(run.total_net_pay || 0).toLocaleString()} <span className="text-xs text-slate-400">UGX</span></p>
                      <Button variant="ghost" className="mt-2 text-[9px] font-black uppercase text-indigo-600 h-6 px-3">View Report</Button>
                   </div>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="advances" className="space-y-6">
           <div className="flex justify-between items-center bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm">
              <div>
                 <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Advances Control</h2>
                 <p className="text-sm text-slate-500 font-medium">Employee financial support and repayment tracking.</p>
              </div>
              <Button className="h-16 px-10 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-amber-100" onClick={() => setIsIssuingAdvance(true)}>
                 <Coins className="h-6 w-6" /> Issue New Advance
              </Button>
           </div>
           <div className="bg-white rounded-[44px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                       <th className="px-10 py-8">Beneficiary</th>
                       <th className="px-10 py-8">Date</th>
                       <th className="px-10 py-8">Duration</th>
                       <th className="px-10 py-8">Purpose</th>
                       <th className="px-10 py-8 text-right">Amount</th>
                       <th className="px-10 py-8 text-center">Stage</th>
                       <th className="px-10 py-8 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loadingAdvances ? (
                      <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline mr-2" /> Loading advances...</td></tr>
                    ) : advances?.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">No advance records found.</td></tr>
                    ) : advances?.map(adv => (
                      <tr key={adv.id} className="text-sm hover:bg-slate-50 transition-colors">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-[10px]">{adv.employees?.full_name?.charAt(0) || "?"}</div>
                               <span className="font-bold text-slate-900">{adv.employees?.full_name}</span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-slate-500 font-medium">{format(new Date(adv.created_at), 'MMM dd, yyyy')}</td>
                         <td className="px-10 py-8 text-slate-500 font-bold">{adv.duration_text}</td>
                         <td className="px-10 py-8 text-slate-400 text-xs italic">{adv.purpose_details || 'Personal / General'}</td>
                         <td className="px-10 py-8 text-right font-black text-slate-900 font-mono">{(adv.amount || 0).toLocaleString()}</td>
                         <td className="px-10 py-8 text-center">
                            <Badge className={cn(
                              "text-[9px] font-black border-none uppercase px-3 py-1",
                              adv.stage === 'submitted' ? "bg-amber-100 text-amber-700" :
                              adv.stage === 'accountant_verified' ? "bg-blue-100 text-blue-700" :
                              adv.stage === 'final_approved' ? "bg-emerald-100 text-emerald-700" :
                              "bg-slate-100 text-slate-700"
                            )}>{adv.stage?.replace('_', ' ')}</Badge>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex justify-end gap-2">
                               {adv.stage === 'submitted' && (
                                 <>
                                   <Button 
                                     size="sm" 
                                     onClick={() => advanceStageMutation.mutate({ id: adv.id, action: 'approve' })}
                                     className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                   >
                                     Verify
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => {
                                       const reason = prompt("Reason for rejection?");
                                       if(reason) advanceStageMutation.mutate({ id: adv.id, action: 'reject', reason });
                                     }}
                                     className="h-8 px-4 rounded-xl text-red-600 border-red-200 hover:bg-red-50 font-bold"
                                   >
                                     Reject
                                   </Button>
                                 </>
                               )}
                               <Button variant="ghost" size="sm" onClick={() => showPrintForm(adv)} className="h-8 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100">
                                  <Printer className="h-3.5 w-3.5 mr-2" /> Print
                               </Button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </TabsContent>
      </Tabs>

      {/* Unified Registration & Edit Dialog */}
      <Dialog open={isAddingEmployee} onOpenChange={(open) => { setIsAddingEmployee(open); if(!open) setEditingEmployee(null); }}>
        <DialogContent className="max-w-xl rounded-[48px] border-none shadow-2xl p-12 overflow-y-auto max-h-[90vh] no-scrollbar">
           <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-4 text-slate-900">
                 <div className="h-14 w-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                    {editingEmployee ? <Edit2 className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
                 </div>
                 {editingEmployee ? "Update Record" : "Workforce Registration"}
              </DialogTitle>
           </DialogHeader>
           
           <div className="grid grid-cols-2 gap-8 py-8">
              <div className="col-span-2 space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Full Legal Name</Label>
                 <Input value={empName} onChange={e => setEmpName(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-slate-50 focus:bg-white text-lg font-bold" placeholder="e.g. Banga Hamza" />
              </div>
              
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Workforce Role</Label>
                 <Select value={empRole} onValueChange={setEmpRole}>
                    <SelectTrigger className="h-16 rounded-[24px] border-slate-100 bg-slate-50 font-black text-slate-900 uppercase text-xs">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-slate-100 shadow-2xl">
                       <SelectItem value="teacher" className="rounded-xl">Teacher (Academic)</SelectItem>
                       <SelectItem value="admin" className="rounded-xl">Administrator</SelectItem>
                       <SelectItem value="support" className="rounded-xl">Support Worker</SelectItem>
                       <SelectItem value="driver" className="rounded-xl">Logistics/Driver</SelectItem>
                       <SelectItem value="security" className="rounded-xl">Security Guard</SelectItem>
                       <SelectItem value="cook" className="rounded-xl">Catering/Cook</SelectItem>
                       <SelectItem value="cleaner" className="rounded-xl">Facility Cleaner</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Base Salary (UGX)</Label>
                 <Input type="number" value={empSalary} onChange={e => setEmpSalary(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-slate-50 font-mono font-bold" placeholder="0.00" />
              </div>

              {empRole === 'teacher' && (
                <>
                  <div className="space-y-3 animate-slide-in">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Assigned Class</Label>
                    <Input value={empClass} onChange={e => setEmpClass(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-blue-50/50" placeholder="e.g. P.4" />
                  </div>
                  <div className="space-y-3 animate-slide-in">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Primary Subjects</Label>
                    <Input value={empSubjects} onChange={e => setEmpSubjects(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-blue-50/50" placeholder="e.g. Math, Science" />
                  </div>
                </>
              )}

              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Primary Email</Label>
                 <Input value={empEmail} onChange={e => setEmpEmail(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-slate-50" placeholder="mail@alheib.com" />
              </div>
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Phone Contact</Label>
                 <Input value={empPhone} onChange={e => setEmpPhone(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-slate-50" placeholder="+256..." />
              </div>
              <div className="col-span-2 space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Academic/Professional Qualification</Label>
                 <Input value={empQual} onChange={e => setEmpQual(e.target.value)} className="h-16 rounded-[24px] border-slate-100 bg-slate-50" placeholder="e.g. B.Ed, Diploma in Catering, Grade III..." />
              </div>
           </div>

           <DialogFooter className="gap-4">
              <Button variant="ghost" onClick={() => setIsAddingEmployee(false)} className="rounded-[24px] h-16 px-8 font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard</Button>
              <Button 
                onClick={() => addEmployeeMutation.mutate()}
                disabled={!empName || !empSalary || addEmployeeMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] h-16 px-12 font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all active:scale-95"
              >
                 {addEmployeeMutation.isPending ? <Loader2 className="animate-spin" /> : (editingEmployee ? "Update Personnel" : "Finalize Registration")}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance and Payroll dialogs remain functional from previous version */}
      <Dialog open={isIssuingAdvance} onOpenChange={setIsIssuingAdvance}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Coins className="h-6 w-6 text-amber-500" /> Issue Salary Advance
              </DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Select Employee</Label>
                 <Select value={editingEmployee?.id} onValueChange={(val) => setEditingEmployee(employees?.find(e => e.id === val))}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                       <SelectValue placeholder="Choose staff..." />
                    </SelectTrigger>
                    <SelectContent>
                       {employees?.map(emp => (
                         <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Advance Amount (UGX)</Label>
                 <Input 
                   type="number" 
                   className="h-12 rounded-2xl border-slate-200 font-mono" 
                   placeholder="0.00" 
                   value={advanceAmount}
                   onChange={e => setAdvanceAmount(e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Link to Project (Optional)</Label>
                 <Select value={advanceProjectId} onValueChange={setAdvanceProjectId}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                       <SelectValue placeholder="General Ops" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="none">None / General</SelectItem>
                       {projects?.map(p => (
                         <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Duration</Label>
                   <Select value={advanceDuration} onValueChange={setAdvanceDuration}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="15 days">15 Days</SelectItem>
                         <SelectItem value="1 week">1 Week</SelectItem>
                         <SelectItem value="1 month">1 Month</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Compliance</Label>
                   <div className="h-12 flex items-center gap-2 px-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-600">Standard L&R</span>
                   </div>
                </div>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Purpose / Details</Label>
                 <Input 
                   className="h-12 rounded-2xl border-slate-200" 
                   placeholder="e.g. Daily operations support..." 
                   value={advancePurpose}
                   onChange={e => setAdvancePurpose(e.target.value)}
                 />
              </div>
           </div>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsIssuingAdvance(false)} className="rounded-2xl">Cancel</Button>
              <Button className="bg-amber-500 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest">Confirm</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Run Payroll Dialog - Re-linked to existing mutation */}
      <Dialog open={isGeneratingPayroll} onOpenChange={setIsGeneratingPayroll}>
        <DialogContent className="max-w-md rounded-[40px] border-none shadow-2xl p-10">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                 <Landmark className="h-7 w-7 text-emerald-500" /> Process Salaries
              </DialogTitle>
           </DialogHeader>
           <div className="py-8 flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-[36px] bg-slate-900 text-white flex items-center justify-center font-black text-3xl mb-6 shadow-2xl shadow-slate-200">
                 {format(new Date(), 'MMM')}
              </div>
              <h4 className="text-xl font-black text-slate-900">Execute {format(new Date(), 'MMMM yyyy')} Run?</h4>
              <p className="text-sm text-slate-500 mt-3 max-w-xs leading-relaxed font-medium">This will finalize net pay for the entire workforce, adjusting for advances and statutory NSSF contributions.</p>
           </div>
           <DialogFooter className="flex-col sm:flex-row gap-3">
               <Button variant="ghost" onClick={() => setIsGeneratingPayroll(false)} className="rounded-2xl h-14 flex-1 font-bold">Review Manually</Button>
               <Button
                 onClick={() => executePayrollMutation.mutate()}
                 disabled={!employees?.length || executePayrollMutation.isPending}
                 className="bg-slate-900 text-white rounded-2xl h-14 flex-1 font-black uppercase tracking-widest shadow-xl shadow-slate-100"
               >
                 {executePayrollMutation.isPending ? 'Processing...' : 'Initialize Run'}
               </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAdvance && (
        <CustodyPrintDialog
          advance={selectedAdvance}
          open={isPrintDialogOpen}
          onOpenChange={setIsPrintDialogOpen}
        />
      )}

    </DashboardLayout>
  );
};

export default WorkforceHub;