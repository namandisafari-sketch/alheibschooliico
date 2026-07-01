// @ts-nocheck
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, Heart, Users, Clock, Plus, ExternalLink, Calendar, Timer, Pill, Package, BarChart3, Ambulance } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { NewVisitDialog, LogTraumaDialog, HealthScreenDialog, ImmunizationDialog } from "@/components/nurse/QuickActionDialogs";
import { usePharmacyEmergencies, usePharmacyNotifications } from "@/hooks/usePharmacyAdvanced";
import { QuickNavBar } from "@/components/dashboard/QuickNavBar";
import { AssetUnderMyCustody } from "@/components/dashboard/AssetUnderMyCustody";

const NurseHome = () => {
  const [dialog, setDialog] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: emergencies = [] } = usePharmacyEmergencies("active");
  const notifications = usePharmacyNotifications();

  const { data: stats = { visits: 0, critical: 0, onMeds: 0, lowStock: 0, activePrescriptions: 0 } } = useQuery({
    queryKey: ["nurse-stats-enhanced"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [visitsRes, criticalRes, incidentsRes, medsRes, lowStockRes, rxRes] = await Promise.all([
        supabase.from("health_visits").select("*", { count: 'exact', head: true }).gte("visit_date", today),
        supabase.from("health_visits").select("*", { count: 'exact', head: true }).eq("priority", "critical").eq("status", "active"),
        supabase.from("medical_incidents").select("*", { count: 'exact', head: true }).eq("severity", "high").eq("status", "active"),
        supabase.from("medication_logs").select("visit_id").gte("dispensed_at", today),
        supabase.from("pharmacy_items").select("id", { count: 'exact', head: true }).lte("quantity", supabase.rpc('get_pharmacy_low_stock', {})),
        supabase.from("prescriptions").select("id", { count: 'exact', head: true }).eq("status", "active"),
      ]);

      // Fallback for low stock if RPC doesn't exist
      let lowStock = lowStockRes.count || 0;
      if (lowStockRes.error) {
        const { data: items } = await supabase.from("pharmacy_items").select("quantity, min_stock_level");
        lowStock = (items || []).filter(i => i.quantity <= i.min_stock_level).length;
      }

      const activeOnMeds = medsRes.data ? new Set(medsRes.data.map(m => m.visit_id)).size : 0;

      return {
        visits: visitsRes.count || 0,
        critical: (criticalRes.count || 0) + (incidentsRes.count || 0),
        onMeds: activeOnMeds,
        lowStock: lowStock,
        activePrescriptions: rxRes.count || 0,
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

  const { data: recentMedications = [] } = useQuery({
    queryKey: ["nurse-recent-medications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medication_logs")
        .select(`
          *,
          pharmacy_item:pharmacy_items(name, unit),
          visit:health_visits(
            learner:learners(full_name, admission_number, class_name)
          ),
          dispenser:profiles(full_name)
        `)
        .order("dispensed_at", { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: learners = [] } = useQuery({
    queryKey: ["learners-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("learners").select("id, full_name, admission_number");
      return data || [];
    }
  });

  const activeEmergencies = emergencies.length;

  return (
    <DashboardLayout title="Medical Center" subtitle="School Infirmary & Health Management">
      <div className="space-y-6">
        {/* Quick Navigation */}
        <QuickNavBar />

        {/* Emergency Banner */}
        {activeEmergencies > 0 && (
          <Link to="/nurse/pharmacy-reports" className="block">
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-between animate-pulse hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-red-800">{activeEmergencies} Active Emergency/Incident{activeEmergencies > 1 ? 's' : ''}</p>
                  <p className="text-xs text-red-600">Click to view Emergency Response Center</p>
                </div>
              </div>
              <Ambulance className="h-8 w-8 text-red-500" />
            </div>
          </Link>
        )}

        {/* Realtime Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.slice(0, 3).map((n: any, i: number) => (
              <div key={n.id || i} className={`p-3 rounded-xl border flex items-center gap-3 text-sm ${
                n.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                n.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{n.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link to="/nurse/clinic">
            <Card className="bg-rose-50/50 border-rose-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Visits Today</p>
                  <p className="text-2xl font-bold">{stats.visits}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse/medication">
            <Card className="bg-blue-50/50 border-blue-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">On Meds</p>
                  <p className="text-2xl font-bold">{stats.onMeds}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse/prescriptions">
            <Card className="bg-purple-50/50 border-purple-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Prescriptions</p>
                  <p className="text-2xl font-bold">{stats.activePrescriptions}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse/pharmacy-inventory">
            <Card className="bg-orange-50/50 border-orange-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/nurse/pharmacy-reports">
            <Card className="bg-amber-50/50 border-amber-100 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Alerts</p>
                  <p className="text-2xl font-bold">{stats.critical + activeEmergencies}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
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
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed" onClick={() => setDialog("new-visit")}>
                      <Plus className="h-5 w-5" />
                      <span className="text-xs font-bold">New Visit</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed" onClick={() => setDialog("trauma")}>
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-xs font-bold">Log Trauma</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed" onClick={() => setDialog("screen")}>
                      <Users className="h-5 w-5" />
                      <span className="text-xs font-bold">Health Screen</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed" onClick={() => setDialog("immunization")}>
                      <Calendar className="h-5 w-5" />
                      <span className="text-xs font-bold">Immunization</span>
                    </Button>
                    <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                      <Link to="/nurse/prescriptions"><Pill className="h-5 w-5" /><span className="text-xs font-bold">Prescriptions</span></Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                      <Link to="/nurse/pharmacy-inventory"><Package className="h-5 w-5" /><span className="text-xs font-bold">Inventory</span></Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed">
                      <Link to="/nurse/pharmacy-reports"><BarChart3 className="h-5 w-5" /><span className="text-xs font-bold">Reports</span></Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-col h-24 gap-2 rounded-xl border-dashed border-red-200 hover:bg-red-50">
                      <Link to="/nurse/pharmacy-reports"><Ambulance className="h-5 w-5 text-red-500" /><span className="text-xs font-bold text-red-600">Emergency</span></Link>
                    </Button>
                </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2">
                  <Heart className="h-5 w-5" /> Active Medications
                </CardTitle>
                <CardDescription className="text-slate-400">Most recently dispensed medication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMedications.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 text-sm">No medication dispensed yet today.</p>
                ) : (
                  recentMedications.map((med) => {
                    const learner = med.visit?.learner;
                    const item = med.pharmacy_item;
                    return (
                      <div key={med.id} className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl">
                        <div className="bg-slate-700 h-8 w-8 rounded-lg flex items-center justify-center text-[10px] text-slate-300 shrink-0">
                          <Timer className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {learner?.full_name || "Unknown"} {learner?.class_name ? `(${learner.class_name})` : ""}
                          </p>
                          <p className="text-[10px] text-slate-400 italic truncate">
                            {item?.name || "Medication"} — {med.quantity} {item?.unit || ""}
                          </p>
                          {med.dosage_instructions && (
                            <p className="text-[9px] text-slate-500 truncate">{med.dosage_instructions}</p>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 shrink-0">
                          {formatDistanceToNow(new Date(med.dispensed_at), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })
                )}
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl mt-2 text-xs">
                  <Link to="/nurse/medication">Manage Medications</Link>
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

      <NewVisitDialog open={dialog === "new-visit"} onOpenChange={(v) => setDialog(v ? "new-visit" : null)} learners={learners} />
      <LogTraumaDialog open={dialog === "trauma"} onOpenChange={(v) => setDialog(v ? "trauma" : null)} learners={learners} />
      <HealthScreenDialog open={dialog === "screen"} onOpenChange={(v) => setDialog(v ? "screen" : null)} learners={learners} />
      <ImmunizationDialog open={dialog === "immunization"} onOpenChange={(v) => setDialog(v ? "immunization" : null)} learners={learners} />
      <AssetUnderMyCustody />
    </DashboardLayout>
  );
};

export default NurseHome;
