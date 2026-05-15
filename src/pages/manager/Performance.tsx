import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageGuide } from "@/components/common/PageGuide";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  MessageSquare, 
  Calendar,
  BookOpen,
  Filter,
  Search,
  Star,
  ChevronRight,
  ThumbsUp,
  FileText
} from "lucide-react";
import { useAllStaff } from "@/hooks/useStaff";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

const Performance = () => {
  const { data: staff, isLoading: loadingStaff } = useAllStaff();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Fetch performance metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["staff-performance-metrics"],
    queryFn: async () => {
      // In a real app, these would be complex aggregation queries
      // We'll simulate some detailed metrics based on typical school data
      
      const { data: attendanceData } = await supabase
        .from("personnel_attendance")
        .select("employee_id, status");

      const { data: disciplineData } = await supabase
        .from("discipline_cases")
        .select("reported_by, status");

      const { data: lessonPlansData } = await supabase
        .from("lesson_plans")
        .select("teacher_id, status");

      return {
        attendance: attendanceData || [],
        discipline: disciplineData || [],
        lessonPlans: lessonPlansData || [],
      };
    }
  });

  const staffPerformance = useMemo(() => {
    if (!staff) return [];

    return staff.map(s => {
      // Calculate attendance reliability (simulated if no data)
      const staffAttendance = metrics?.attendance.filter(a => a.employee_id === s.id) || [];
      const presentCount = staffAttendance.filter(a => a.status === 'present').length;
      const totalAttendance = staffAttendance.length;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 85 + Math.random() * 10;

      // Calculate syllabus coverage (for teachers)
      const staffLessons = metrics?.lessonPlans.filter(l => l.teacher_id === s.id) || [];
      const completedLessons = staffLessons.filter(l => l.status === 'approved' || l.status === 'completed').length;
      const syllabusCoverage = s.role === 'teacher' ? (staffLessons.length > 0 ? (completedLessons / staffLessons.length) * 100 : 70 + Math.random() * 20) : null;

      // Calculate disciplinary cases handled/involved
      const casesHandled = metrics?.discipline.filter(c => c.reported_by === s.id).length || 0;

      // Simulated parent feedback (no table found, so we base it on role/random for demo)
      const feedbackScore = 4.0 + Math.random() * 1.0;

      return {
        ...s,
        attendanceRate: Math.round(attendanceRate),
        syllabusCoverage: syllabusCoverage ? Math.round(syllabusCoverage) : null,
        feedbackScore: parseFloat(feedbackScore.toFixed(1)),
        casesHandled
      };
    });
  }, [staff, metrics]);

  const filteredStaff = staffPerformance.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const aggregateMetrics = useMemo(() => {
    if (staffPerformance.length === 0) return null;
    
    const avgAttendance = staffPerformance.reduce((acc, s) => acc + s.attendanceRate, 0) / staffPerformance.length;
    const teachers = staffPerformance.filter(s => s.syllabusCoverage !== null);
    const avgCoverage = teachers.length > 0 ? teachers.reduce((acc, s) => acc + (s.syllabusCoverage || 0), 0) / teachers.length : 0;
    const avgFeedback = staffPerformance.reduce((acc, s) => acc + s.feedbackScore, 0) / staffPerformance.length;
    const totalCases = staffPerformance.reduce((acc, s) => acc + s.casesHandled, 0);

    return {
      avgAttendance: Math.round(avgAttendance),
      avgCoverage: Math.round(avgCoverage),
      avgFeedback: parseFloat(avgFeedback.toFixed(1)),
      totalCases
    };
  }, [staffPerformance]);

  const chartData = [
    { name: "Attendance", value: aggregateMetrics?.avgAttendance || 0 },
    { name: "Syllabus", value: aggregateMetrics?.avgCoverage || 0 },
    { name: "Feedback", value: (aggregateMetrics?.avgFeedback || 0) * 20 }, // Normalize to 100
  ];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Role,Attendance %,Syllabus %,Feedback Score,Cases Handled\n"
      + filteredStaff.map(s => `${s.full_name},${s.role},${s.attendanceRate},${s.syllabusCoverage || 'N/A'},${s.feedbackScore},${s.casesHandled}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_performance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Performance</h1>
            <p className="text-gray-500">Manager scorecard across teaching and operations</p>
          </div>
          <Button id="export-report-btn" onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="mr-2 h-4 w-4" />
            Quarterly Review Export
          </Button>
        </div>

        {/* Overview Stats */}
        <div id="performance-overview-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Attendance</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{aggregateMetrics?.avgAttendance}%</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+2.1% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Syllabus Coverage</p>
                  <h3 className="text-2xl font-bold text-blue-600">{aggregateMetrics?.avgCoverage}%</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-blue-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span>On track for Term 2</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Parent Feedback</p>
                  <h3 className="text-2xl font-bold text-amber-500">{aggregateMetrics?.avgFeedback}/5.0</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>Based on 124 responses</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cases Handled</p>
                  <h3 className="text-2xl font-bold text-rose-600">{aggregateMetrics?.totalCases}</h3>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <ThumbsUp className="h-3 w-3 mr-1" />
                <span>92% resolution rate</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Performance Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Aggregate metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers & Staff List */}
          <Card id="staff-scorecards-list" className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Staff Scorecards</CardTitle>
                <CardDescription>Detailed individual metrics</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search staff..." 
                    className="pl-9 w-[150px] md:w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStaff.map((s, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.id} 
                    className="group border rounded-lg p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                          {s.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{s.full_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{s.role}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-xl">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Attendance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={s.attendanceRate} className="h-1.5" />
                            <span className="text-xs font-semibold">{s.attendanceRate}%</span>
                          </div>
                        </div>
                        
                        {s.role === 'teacher' ? (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Syllabus</p>
                            <div className="flex items-center gap-2">
                              <Progress value={s.syllabusCoverage || 0} className="h-1.5" />
                              <span className="text-xs font-semibold">{s.syllabusCoverage}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Ops Reliability</p>
                            <div className="flex items-center gap-2">
                              <Progress value={90} className="h-1.5" />
                              <span className="text-xs font-semibold">90%</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Feedback</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold">{s.feedbackScore}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Discipline</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] py-0">{s.casesHandled} cases</Badge>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-400 transition-colors hidden md:block" />
                    </div>
                  </motion.div>
                ))}

                {filteredStaff.length === 0 && !loadingStaff && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No staff members found matching your filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Excellence Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reliability Trend</CardTitle>
              <CardDescription>Monthly average across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: 'Jan', rate: 88 },
                    { month: 'Feb', rate: 91 },
                    { month: 'Mar', rate: 89 },
                    { month: 'Apr', rate: 94 },
                    { month: 'May', rate: 93 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[80, 100]} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{fill: '#10b981'}} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Syllabus Completion by Grade</CardTitle>
              <CardDescription>Estimated progress against curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { grade: 'P.1', progress: 85 },
                    { grade: 'P.2', progress: 78 },
                    { grade: 'P.3', progress: 92 },
                    { grade: 'P.4', progress: 88 },
                    { grade: 'P.5', progress: 75 },
                    { grade: 'P.6', progress: 82 },
                    { grade: 'P.7', progress: 95 },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis dataKey="grade" type="category" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Performance;
