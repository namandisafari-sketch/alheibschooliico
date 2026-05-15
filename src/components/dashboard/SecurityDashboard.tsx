
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  LogIn, 
  LogOut, 
  FileText, 
  AlertTriangle, 
  Truck,
  Search,
  Plus
} from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { useVisitorVisits, useVisitors, useCheckOutVisitor } from "@/hooks/useVisitors";
import { useAppointments } from "@/hooks/useAppointments";
import { useReentrySlips } from "@/hooks/useReentrySlips";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const SecurityDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: activeVisits = [] } = useVisitorVisits("active");
  const { data: appointments = [] } = useAppointments();
  const { data: reentrySlips = [] } = useReentrySlips();
  const checkOut = useCheckOutVisitor();

  const todayAppts = appointments.filter(
    (a) => isToday(new Date(a.scheduled_for)) && a.status === "scheduled"
  );

  const activeSlipsCount = reentrySlips.filter(
    (s) => !s.voided && !isPast(new Date(s.expires_at))
  ).length;

  // Fetch pending inventory gate passes
  const { data: inventoryGatePasses = [] } = useQuery({
    queryKey: ["inventory-gate-passes-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*, item:inventory_items(name), learner:learners(full_name)")
        .eq("status", "approved")
        .eq("type", "issuance")
        .order("transaction_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">On-Site Visitors</p>
              <h3 className="text-2xl font-bold">{activeVisits.length}</h3>
            </div>
            <Users className="h-8 w-8 text-amber-500/20" />
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Appts</p>
              <h3 className="text-2xl font-bold">{todayAppts.length}</h3>
            </div>
            <Clock className="h-8 w-8 text-blue-500/20" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Re-entry</p>
              <h3 className="text-2xl font-bold">{activeSlipsCount}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-green-500/20" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Items Out (Pending)</p>
              <h3 className="text-2xl font-bold">{inventoryGatePasses.length}</h3>
            </div>
            <Truck className="h-8 w-8 text-purple-500/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Visitor Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gate Operations</CardTitle>
              <CardDescription>Check-in/out visitors and staff</CardDescription>
            </div>
            <Button onClick={() => navigate("/visitors")}>
              <Plus className="h-4 w-4 mr-2" /> New Entry
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                placeholder="Scan badge or search visitor..."
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currently On-Site</h4>
              {activeVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">No visitors currently on-site</p>
              ) : (
                activeVisits.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{v.visitor_name}</p>
                      <p className="text-xs text-muted-foreground">Badge: {v.badge_number}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => checkOut.mutate(v)}>
                      <LogOut className="h-3.5 w-3.5 mr-1" /> Exit
                    </Button>
                  </div>
                ))
              )}
              {activeVisits.length > 5 && (
                <Button variant="link" className="text-xs p-0 h-auto" onClick={() => navigate("/visitors")}>
                  View all {activeVisits.length} visitors
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Gate Passes */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Gate Passes</CardTitle>
            <CardDescription>Verified items leaving the school</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryGatePasses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">No pending items for gate clearance</p>
            ) : (
              <div className="space-y-3">
                {inventoryGatePasses.map((pass) => (
                  <div key={pass.id} className="p-3 rounded-lg border border-purple-100 bg-purple-50/30 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{pass.item?.name}</p>
                        <Badge variant="outline" className="text-[10px] h-4 uppercase">{pass.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Qty: <span className="font-bold">{pass.quantity}</span> | 
                        For: {pass.learner?.full_name || "General"}
                      </p>
                      <p className="text-[10px] font-mono mt-1 text-purple-600/70">{pass.tracking_number}</p>
                    </div>
                    <Button size="sm" variant="secondary" className="h-8 text-xs">
                      Verify
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full text-xs" onClick={() => navigate("/inventory")}>
                  Manage All Inventory
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/visitors?tab=reentry")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Emergency Slips</p>
              <p className="text-xs text-muted-foreground">Issue re-entry passes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/visitors?tab=log")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Visit History</p>
              <p className="text-xs text-muted-foreground">View all gate logs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/inventory")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Asset Clearance</p>
              <p className="text-xs text-muted-foreground">Verify items leaving</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
