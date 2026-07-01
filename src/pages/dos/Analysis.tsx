import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, BarChart3, Users, Award, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DosAnalysis = () => {
  const { data: stats = { totalLearners: 0, totalClasses: 0, passRate: 0, atRisk: 0 } } = useQuery({
    queryKey: ["dos-analysis-stats"],
    queryFn: async () => {
      const [learners, classes, totalResults, passingResults, lowPerf] = await Promise.all([
        supabase.from("learners").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("term_results").select("id", { count: "exact", head: true }),
        supabase.from("term_results").select("id", { count: "exact", head: true }).gte("score", 50),
        supabase.from("term_results").select("id", { count: "exact", head: true }).lt("score", 50),
      ]);

      const error = [learners.error, classes.error, totalResults.error, passingResults.error, lowPerf.error].find(Boolean);
      if (error) throw error;

      const passRate = totalResults.count
        ? Math.round(((passingResults.count || 0) / totalResults.count) * 100)
        : 0;

      return {
        totalLearners: learners.count || 0,
        totalClasses: classes.count || 0,
        passRate,
        atRisk: lowPerf.count || 0,
      };
    },
  });

  return (
    <DashboardLayout title="Results & Analysis" subtitle="Deep dive into termly performance data">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Learners</p>
                <p className="text-2xl font-bold">{stats.totalLearners}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classes</p>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.passRate}%</p>
                <Badge variant="outline" className="text-[9px] bg-slate-100">No data yet</Badge>
              </div>
              <Award className="h-8 w-8 text-amber-200" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">At Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.atRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Dashboard
            </CardTitle>
            <CardDescription>Termly analysis and learner performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="classes">By Class</TabsTrigger>
                <TabsTrigger value="subjects">By Subject</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-6">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="h-16 w-16 text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-400">No Term Results Yet</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-6">
                    Performance data will appear once term results are recorded.
                  </p>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="classes">
                <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                  Select a term to view class performance.
                </div>
              </TabsContent>
              <TabsContent value="subjects">
                <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                  Subject breakdown will appear here.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DosAnalysis;
