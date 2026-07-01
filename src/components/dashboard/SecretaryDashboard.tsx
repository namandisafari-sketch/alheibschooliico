import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Kpi, Section } from "@/components/role/RolePage";
import { 
  FileText, Megaphone, Users, FolderOpen, CheckSquare, Clock, 
  FileUp, ClipboardList, MessageSquare, Send, TrendingUp, AlertCircle,
  Coffee, LogOut, LogIn, Inbox, Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const SecretaryDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // Check today's attendance status
  const { data: myAttendance } = useQuery({
    queryKey: ["secretary-attendance-today"],
    queryFn: async () => {
      const { data } = await supabase
        .from("personnel_attendance")
        .select("*")
        .eq("employee_id", user?.id)
        .eq("date", format(today, "yyyy-MM-dd"))
        .single();
      return data;
    },
  });

  const { data: visitorsToday = 0 } = useQuery({
    queryKey: ["office-visitors-today"],
    queryFn: async () => {
      const { count } = await supabase
        .from("visitor_visits")
        .select("id", { count: "exact", head: true })
        .gte("check_in_at", todayStr);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: docCount = 0 } = useQuery({
    queryKey: ["office-doc-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("document_registry")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
    refetchInterval: 60000,
  });

  const { data: docsInToday = 0 } = useQuery({
    queryKey: ["office-docs-today"],
    queryFn: async () => {
      const { count } = await supabase
        .from("document_registry")
        .select("id", { count: "exact", head: true })
        .eq("direction", "inbound")
        .gte("created_at", todayStr);
      return count || 0;
    },
    refetchInterval: 60000,
  });

  const { data: pendingPrints = 0 } = useQuery({
    queryKey: ["pending-prints"],
    queryFn: async () => {
      const { count } = await supabase
        .from("print_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
    refetchInterval: 45000,
  });

  const { data: broadcasts = 0 } = useQuery({
    queryKey: ["broadcasts-today"],
    queryFn: async () => {
      const { count } = await supabase
        .from("communications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStr);
      return count || 0;
    },
    refetchInterval: 60000,
  });

  const { data: inboxCount = 0 } = useQuery({
    queryKey: ["inbox-unread"],
    queryFn: async () => {
      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user?.id)
        .eq("read", false);
      return count || 0;
    },
    refetchInterval: 20000,
  });

  // Attendance check-in/out mutation
  const checkInOut = useMutation({
    mutationFn: async (status: "present" | "absent" | "leave") => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

      if (myAttendance?.id) {
        const { error } = await supabase
          .from("personnel_attendance")
          .update({
            status,
            check_in_time: status === "present" ? timeStr : null,
            recorded_by: user?.id,
          })
          .eq("id", myAttendance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personnel_attendance")
          .insert({
            employee_id: user?.id,
            date: format(today, "yyyy-MM-dd"),
            status,
            check_in_time: status === "present" ? timeStr : null,
            recorded_by: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["secretary-attendance-today"] });
      const messages = {
        present: "✓ Checked in successfully",
        absent: "Marked as absent",
        leave: "Leave recorded",
      };
      toast({
        title: messages[status as keyof typeof messages],
        description: `Time: ${format(new Date(), "h:mm a")}`,
      });
    },
  });

  const getAttendanceStatus = () => {
    if (!myAttendance) return "Not marked";
    return myAttendance.status.charAt(0).toUpperCase() + myAttendance.status.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Status</p>
                <p className="text-lg font-semibold">{getAttendanceStatus()}</p>
              </div>
              <Badge variant={
                myAttendance?.status === "present" ? "default" :
                myAttendance?.status === "absent" ? "destructive" :
                myAttendance?.status === "leave" ? "secondary" : "outline"
              } className="ml-2">
                {format(today, "MMM d")}
              </Badge>
            </div>
            {!myAttendance || myAttendance.status === "absent" ? (
              <Button 
                size="sm" 
                className="w-full mt-3 gap-2"
                onClick={() => checkInOut.mutate("present")}
                disabled={checkInOut.isPending}
              >
                <LogIn className="h-3 w-3" />
                Check In
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-3 gap-2"
                onClick={() => checkInOut.mutate("absent")}
                disabled={checkInOut.isPending}
              >
                <LogOut className="h-3 w-3" />
                Check Out
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Visitors Today</p>
                <p className="text-2xl font-bold">{visitorsToday}</p>
              </div>
              <Users className="h-8 w-8 text-green-500/20" />
            </div>
            <Link to="/gate">
              <Button size="sm" variant="ghost" className="w-full mt-3 text-xs">
                View Gate Log →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Documents In</p>
                <p className="text-2xl font-bold">{docsInToday}</p>
              </div>
              <Inbox className="h-8 w-8 text-purple-500/20" />
            </div>
            <Link to="/office/documents">
              <Button size="sm" variant="ghost" className="w-full mt-3 text-xs">
                Manage Docs →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Print Orders</p>
                <p className="text-2xl font-bold">{pendingPrints}</p>
              </div>
              <FileUp className="h-8 w-8 text-orange-500/20" />
            </div>
            <Link to="/office/print-orders">
              <Button size="sm" variant="ghost" className="w-full mt-3 text-xs">
                View Orders →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Key Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Kpi
              icon={Megaphone}
              label="Broadcasts"
              value={broadcasts}
              actionLabel="Send"
              onAction={() => window.location.href = "/office/comms"}
              color="bg-blue-50"
            />
            <Kpi
              icon={FileUp}
              label="Print Queue"
              value={pendingPrints}
              actionLabel="Manage"
              onAction={() => window.location.href = "/office/print-orders"}
              color="bg-amber-50"
            />
            <Kpi
              icon={FileText}
              label="Total Docs"
              value={docCount}
              actionLabel="Browse"
              onAction={() => window.location.href = "/office/documents"}
              color="bg-purple-50"
            />
            <Kpi
              icon={MessageSquare}
              label="Unread"
              value={inboxCount}
              actionLabel="Inbox"
              onAction={() => window.location.href = "/teacher/inbox"}
              color="bg-pink-50"
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/office/comms" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2">
                  <Send className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Send Broadcast</p>
                    <p className="text-xs text-muted-foreground">Message staff, teachers & parents</p>
                  </div>
                </Button>
              </Link>
              <Link to="/office/documents" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2">
                  <FileText className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Log Document</p>
                    <p className="text-xs text-muted-foreground">Record inbound/outbound files</p>
                  </div>
                </Button>
              </Link>
              <Link to="/office/print-orders" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2">
                  <FileUp className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Print Orders</p>
                    <p className="text-xs text-muted-foreground">Manage printing queue</p>
                  </div>
                </Button>
              </Link>
              <Link to="/secretary/deliveries" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2">
                  <Archive className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Delivery Log</p>
                    <p className="text-xs text-muted-foreground">Track package deliveries</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                My Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">Status</p>
                <p className="text-2xl font-bold text-blue-900">{getAttendanceStatus()}</p>
                {myAttendance?.check_in_time && (
                  <p className="text-xs text-blue-600 mt-2">
                    Checked in at {myAttendance.check_in_time}
                  </p>
                )}
              </div>
              
              {!myAttendance?.check_in_time && (
                <Button 
                  className="w-full gap-2"
                  onClick={() => checkInOut.mutate("present")}
                  disabled={checkInOut.isPending}
                >
                  <LogIn className="h-4 w-4" />
                  Check In Now
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Role Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Secretary Hub</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage office operations, broadcast announcements, track documents, and coordinate printing requests efficiently.
              </p>
              <div className="mt-4 pt-4 border-t space-y-2">
                <Link to="/staff-attendance" className="text-xs text-primary hover:underline block">
                  → View All Staff Attendance
                </Link>
                <Link to="/settings" className="text-xs text-primary hover:underline block">
                  → System Settings
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecretaryDashboard;
