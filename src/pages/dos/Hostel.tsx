// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Users, Building2, CalendarDays, GraduationCap, BarChart3, UserCheck, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const DosHostel = () => {
  const { data: boarders = [], isLoading: loadingBoarders } = useQuery({
    queryKey: ["dos-boarders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dormitory_residents")
        .select("*, learner:learners(id, full_name, gender, class_id, status, admission_number, class:classes(name, level)), dormitory:dormitories(id, name, gender, capacity)")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: dormitories = [] } = useQuery({
    queryKey: ["dos-dormitories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dormitories")
        .select("*, residents:dormitory_residents(count)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pendingArrivals = 0 } = useQuery({
    queryKey: ["dos-pending-arrivals"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("holiday_arrival_clearances")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const boardersByClass: Record<string, typeof boarders> = {};
  const boardersByGender = { boys: 0, girls: 0 };
  for (const r of boarders) {
    const cls = r.learner?.class?.name || "Unknown";
    (boardersByClass[cls] ??= []).push(r);
    if (r.learner?.gender === "male") boardersByGender.boys++;
    else if (r.learner?.gender === "female") boardersByGender.girls++;
  }

  const totalCapacity = dormitories.reduce((s, d) => s + (d.capacity || 0), 0);

  return (
    <DashboardLayout title="DOS Hostel Oversight" subtitle="Academic supervision of boarding facilities">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bed className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{boarders.length}</p>
                  <p className="text-xs text-muted-foreground">Active Boarders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dormitories.length}</p>
                  <p className="text-xs text-muted-foreground">Dormitories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCapacity > 0 ? Math.round((boarders.length / totalCapacity) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Capacity ({boarders.length}/{totalCapacity})</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{boardersByGender.boys}</p>
                  <p className="text-xs text-muted-foreground">Boys / {boardersByGender.girls} Girls</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingArrivals}</p>
                  <p className="text-xs text-muted-foreground">Pending Arrivals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Boarders by Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBoarders ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : Object.keys(boardersByClass).length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No boarders assigned yet.</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(boardersByClass)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cls, residents]) => (
                      <div key={cls} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <span className="text-sm font-medium">{cls}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{residents.length}</Badge>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {boarders.length > 0 ? Math.round((residents.length / boarders.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Dormitory Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dormitories.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No dormitories configured.</div>
              ) : (
                <div className="space-y-3">
                  {dormitories.map((d) => {
                    const count = d.residents?.[0]?.count ?? 0;
                    const pct = d.capacity > 0 ? Math.round((count / d.capacity) * 100) : 0;
                    const color = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-green-500";
                    return (
                      <div key={d.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{d.name}</span>
                          <span className="text-muted-foreground">{count}/{d.capacity} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Boarding Learner Roster
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBoarders ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : boarders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No boarding learners found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Admission</th>
                      <th className="pb-2 font-medium">Class</th>
                      <th className="pb-2 font-medium">Gender</th>
                      <th className="pb-2 font-medium">Dormitory</th>
                      <th className="pb-2 font-medium">Bed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boarders.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{r.learner?.full_name || "—"}</td>
                        <td className="py-2 text-muted-foreground">{r.learner?.admission_number || "—"}</td>
                        <td className="py-2">{r.learner?.class?.name || "—"}</td>
                        <td className="py-2">
                          <Badge variant={r.learner?.gender === "male" ? "default" : "secondary"} className="text-[10px]">
                            {r.learner?.gender || "—"}
                          </Badge>
                        </td>
                        <td className="py-2">{r.dormitory?.name || "—"}</td>
                        <td className="py-2 text-muted-foreground">{r.bed_number || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4 justify-start gap-3" asChild>
            <Link to="/matron/dormitories">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Manage Dormitories</p>
                <p className="text-xs text-muted-foreground">View and edit dormitory details</p>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start gap-3" asChild>
            <Link to="/matron/residents">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Manage Residents</p>
                <p className="text-xs text-muted-foreground">Assign learners to dormitories</p>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start gap-3" asChild>
            <Link to="/matron/arrivals">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Holiday Clearance</p>
                <p className="text-xs text-muted-foreground">{pendingArrivals} pending arrivals</p>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DosHostel;
