// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Building, Users, Plane, ClipboardList, Plus, Search, BedDouble } from "lucide-react";

const MatronHome = () => {
  const { user, role } = useAuth();

  const { data: assignedDormIds = [] } = useQuery({
    queryKey: ["my-dormitories", user?.id],
    queryFn: async () => {
      if (role !== "matron") return [];
      const { data } = await supabase.from("dormitories").select("id").eq("matron_staff_id", user?.id);
      return (data || []).map((d) => d.id);
    },
    enabled: role === "matron",
  });

  const { data: stats = { dormitories: 0, residents: 0, pendingArrivals: 0 } } = useQuery({
    queryKey: ["matron-stats", assignedDormIds],
    queryFn: async () => {
      let dormQuery = supabase.from("dormitories").select("*", { count: 'exact', head: true });
      let residentQuery = supabase.from("dormitory_residents").select("*", { count: 'exact', head: true }).eq("is_active", true);
      if (role === "matron" && assignedDormIds.length > 0) {
        dormQuery = dormQuery.in("id", assignedDormIds);
        residentQuery = residentQuery.in("dormitory_id", assignedDormIds);
      }
      const [dormRes, residentRes, arrivalsRes] = await Promise.all([
        dormQuery,
        residentQuery,
        supabase.from("holiday_arrival_clearances").select("*", { count: 'exact', head: true }).eq("matron_status", "pending"),
      ]);
      return { dormitories: dormRes.count || 0, residents: residentRes.count || 0, pendingArrivals: arrivalsRes.count || 0 };
    },
    enabled: role !== "matron" || assignedDormIds.length > 0,
  });

  const { data: recentArrivals = [] } = useQuery({
    queryKey: ["matron-recent-arrivals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("holiday_arrival_clearances")
        .select("*, learner:learners(full_name, admission_number)")
        .order("arrival_date", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const STAT_CARDS = [
    { label: "Dormitories", value: stats.dormitories, icon: Building, color: "indigo", link: "/matron/dormitories" },
    { label: "Residents", value: stats.residents, icon: Users, color: "emerald", link: "/matron/residents" },
    { label: "Pending Arrivals", value: stats.pendingArrivals, icon: Plane, color: "amber", link: "/matron/arrivals" },
  ];

  return (
    <DashboardLayout title="Matron's Dashboard" subtitle="Boarding & Dormitory Management">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <Link key={s.label} to={s.link}>
              <Card className={`bg-${s.color}-50/50 border-${s.color}-100 hover:shadow-md transition-all cursor-pointer h-full`}>
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className={`h-10 w-10 bg-${s.color}-100 rounded-xl flex items-center justify-center text-${s.color}-600`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Link to="/matron/essentials">
            <Card className="bg-rose-50/50 border-rose-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Essentials</p>
                  <p className="text-2xl font-bold">{stats.pendingEssentials || 0}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Tabs defaultValue="arrivals">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="arrivals">Recent Arrivals</TabsTrigger>
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="arrivals">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Arrival Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentArrivals.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No arrivals recorded yet.</TableCell></TableRow>
                  ) : recentArrivals.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.learner?.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.learner?.admission_number || "-"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(a.arrival_date), "dd MMM yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{a.matron_status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                <Link to="/matron/residents"><Plus className="h-5 w-5" /><span className="text-xs font-bold">New Resident</span></Link>
              </Button>
              <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                <Link to="/matron/arrivals"><Plane className="h-5 w-5" /><span className="text-xs font-bold">Process Arrival</span></Link>
              </Button>
              <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                <Link to="/matron/dormitories"><BedDouble className="h-5 w-5" /><span className="text-xs font-bold">Dormitories</span></Link>
              </Button>
              <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                <Link to="/matron/essentials"><ClipboardList className="h-5 w-5" /><span className="text-xs font-bold">Essentials</span></Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MatronHome;
