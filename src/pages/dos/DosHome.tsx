// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  FileCheck, 
  AlertTriangle, 
  Users, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const DosHome = () => {
  // Real-time stats for the dashboard
  const { data: stats = {
    pendingPlans: 0,
    activeWarnings: 0,
    activeTeachers: 0,
    totalClasses: 0
  }} = useQuery({
    queryKey: ["dos-dashboard-stats"],
    queryFn: async () => {
      const [plans, warnings, staff, classes] = await Promise.all([
        supabase.from("lesson_plans").select("*", { count: "exact" }).eq("status", "pending"),
        supabase.from("academic_warnings").select("*", { count: "exact" }).eq("status", "active"),
        supabase.from("profiles").select("*", { count: "exact" }).eq("role", "teacher"),
        supabase.from("classes").select("*", { count: "exact" })
      ]);
      return {
        pendingPlans: plans.count || 0,
        activeWarnings: warnings.count || 0,
        activeTeachers: staff.count || 0,
        totalClasses: classes.count || 0
      };
    }
  });

  return (
    <DashboardLayout title="DOS Command Center" subtitle="Academic Quality Assurance & Oversight">
      <div className="space-y-8">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Lesson Plans Pnd.</p>
                <p className="text-2xl font-bold">{stats.pendingPlans}</p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
          <Card className="bg-orange-50/50 border-orange-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Active Warnings</p>
                <p className="text-2xl font-bold">{stats.activeWarnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase">Active Teachers</p>
                <p className="text-2xl font-bold">{stats.activeTeachers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 border-emerald-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase">Total Classes</p>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions & Navigation */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Academic Operations</CardTitle>
              <CardDescription>Direct links to management modules</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Teacher Assignments", icon: Users, path: "/dos/assignments", color: "text-blue-500", desc: "Allocate teachers to classes" },
                { label: "Syllabus Coverage", icon: BookOpen, path: "/dos/syllabus", color: "text-emerald-500", desc: "Track curriculum progress" },
                { label: "Exam Scheduling", icon: ClipboardList, path: "/dos/exams", color: "text-orange-500", desc: "Plan assessment series" },
                { label: "Master Timetable", icon: Calendar, path: "/dos/timetable", color: "text-purple-500", desc: "Build school-wide schedule" },
              ].map((action) => (
                <Link to={action.path} key={action.label}>
                  <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group">
                    <div className={`mt-1 ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{action.label}</h4>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Academic Health</CardTitle>
              <CardDescription>Recent system observations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Avg. Coverage</span>
                </div>
                <span className="text-sm font-bold">68%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Timetable Uploaded</span>
                </div>
                <Badge className="bg-emerald-600">Yes</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">High Risk Learners</span>
                </div>
                <span className="text-sm font-bold text-orange-600">{stats.activeWarnings}</span>
              </div>
              
              <Button variant="outline" className="w-full mt-4 text-xs h-9">
                View Performance Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DosHome;
