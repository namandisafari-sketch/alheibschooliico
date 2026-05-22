// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, Heart, Users, Clock, Plus, ExternalLink, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const NurseHome = () => {
  const { data: stats = { visits: 0, critical: 0, onMeds: 0 } } = useQuery({
    queryKey: ["nurse-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count: visits } = await supabase
        .from("health_visits")
        .select("*", { count: 'exact', head: true })
        .gte("visit_date", today);
        
      const { count: critical } = await supabase
        .from("health_visits")
        .select("*", { count: 'exact', head: true })
        .eq("priority", "critical")
        .eq("status", "active");

      const { count: incidents } = await supabase
        .from("medical_incidents")
        .select("*", { count: 'exact', head: true })
        .eq("severity", "high")
        .eq("status", "active");

      return { 
        visits: visits || 0, 
        critical: (critical || 0) + (incidents || 0), 
        onMeds: 0 // Placeholder for meds
      };
    }
  });

  const { data: recentIncidents = [] } = useQuery({
    queryKey: ["nurse-recent-incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_incidents")
        .select(`*, learner:learners(full_name)`)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    }
  });

  return (
    <DashboardLayout title="Medical Center" subtitle="School Infirmary & Health Management">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-rose-50/50 border-rose-100">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Infirmary Visits</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stats.visits}</p>
                  <span className="text-[10px] text-rose-600 font-medium">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Medical Conditions</p>
                <p className="text-2xl font-bold">{stats.onMeds}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Pending Alerts</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Incidents</CardTitle>
                  <CardDescription>Latest medical occurrences reported</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/nurse/incidents">View All <ExternalLink className="h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentIncidents.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm">No incidents reported recently.</p>
                  ) : (
                    recentIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-all cursor-pointer">
                        <div className="flex gap-3 items-center">
                          <div className={`h-2 w-2 rounded-full ${incident.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <div>
                            <p className="font-bold text-sm">{incident.learner?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{incident.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-mono">{format(new Date(incident.created_at), 'HH:mm')}</p>
                          <Badge variant="outline" className="text-[8px] uppercase">{incident.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                        <Plus className="h-5 w-5" />
                        <span className="text-xs font-bold">New Visit</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-xs font-bold">Log Trauma</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                        <Users className="h-5 w-5" />
                        <span className="text-xs font-bold">Health Screen</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                        <Calendar className="h-5 w-5" />
                        <span className="text-xs font-bold">Immunization</span>
                    </Button>
                </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2">
                  <Heart className="h-5 w-5" /> Active Monitors
                </CardTitle>
                <CardDescription className="text-slate-400">Regular medication schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map(i => (
                   <div key={i} className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl">
                      <div className="bg-slate-700 h-8 w-8 rounded-lg flex items-center justify-center text-[10px] text-slate-300">10am</div>
                      <div>
                        <p className="text-xs font-bold">John Doe (Primary 4)</p>
                        <p className="text-[10px] text-slate-400 italic">Inhaler - 2 puffs</p>
                      </div>
                   </div>
                ))}
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl mt-2 text-xs">
                    Mark Schedule as Complete
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Open Infirmary Hours
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Morning Surgery</span>
                        <span className="font-bold">08:00 - 10:30</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Emergency Cover</span>
                        <span className="font-bold">24 Hours</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Medication Review</span>
                        <span className="font-bold text-orange-500">14:00 Today</span>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NurseHome;
