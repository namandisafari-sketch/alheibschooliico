import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Kpi, Section } from "@/components/role/RolePage";
import { FileText, Megaphone, Users, FolderOpen, CheckSquare, Calendar, FileUp, ClipboardList, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { uuidToShortId } from "@/lib/shortId";
import { format } from "date-fns";

export const OfficeDashboard = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

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

  const { data: broadcasts = 0 } = useQuery({
    queryKey: ["office-broadcasts"],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from("communications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());
      return count || 0;
    },
  });

  const { data: pendingAppts = 0 } = useQuery({
    queryKey: ["office-pending-appts"],
    queryFn: async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled");
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const { data: appointmentsToday = 0 } = useQuery({
    queryKey: ["office-appts-today"],
    queryFn: async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .in("status", ["approved", "checked_in", "scheduled"])
        .gte("scheduled_for", todayStr);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: pendingList = [] } = useQuery({
    queryKey: ["office-pending-appts-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, visitor_name, visitor_phone, purpose, host_name, scheduled_for, created_at")
        .eq("status", "scheduled")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: recentDocs = [] } = useQuery({
    queryKey: ["office-recent-docs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("document_registry")
        .select("id, title, ref_number, category, direction, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Kpi label="Registered Documents" value={docCount} icon={FileText} tone="primary" />
        <Kpi label="Inbound Today" value={docsInToday} icon={FolderOpen} tone="info" />
        <Kpi label="Visitors Today" value={visitorsToday} icon={Users} tone="success" />
        <Kpi label="Pending Appointments" value={pendingAppts} icon={Clock} tone="warning" />
        <Kpi label="Today's Appointments" value={appointmentsToday} icon={Calendar} tone="info" />
        <Kpi label="Broadcasts (Week)" value={broadcasts} icon={Megaphone} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Office Tools" description="Daily reception & admin workflow">
          <div className="grid gap-3">
            <Button asChild className="justify-start h-12 rounded-xl bg-amber-600 hover:bg-amber-700">
              <Link to="/gate/appointments"><Clock className="mr-2 h-4 w-4" />Approve Appointments</Link>
            </Button>
            <Button asChild className="justify-start h-12 rounded-xl">
              <Link to="/office/documents"><FolderOpen className="mr-2 h-4 w-4" />Document Registry</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/office/comms"><Megaphone className="mr-2 h-4 w-4" />Communications Hub</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate?tab=visitors"><Users className="mr-2 h-4 w-4" />Visitor Sign-In</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/students"><ClipboardList className="mr-2 h-4 w-4" />Learner Records</Link>
            </Button>
          </div>
        </Section>

        <Section title="Recent Documents" description="Latest registry entries">
          {recentDocs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              <FileText className="inline h-4 w-4 mr-1" />No documents logged yet
            </p>
          ) : (
            <div className="divide-y">
              {recentDocs.map((doc: any) => (
                <div key={doc.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{doc.title}</p>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                      {format(new Date(doc.created_at), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">
                      {doc.ref_number || "No ref"}
                    </span>
                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-muted">
                      {doc.direction}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{doc.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Pending Appointment Approvals" description="Booked visits awaiting approval">
          {pendingList.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              <CheckSquare className="inline h-4 w-4 mr-1" />No pending approvals
            </p>
          ) : (
            <div className="divide-y">
              {pendingList.map((a: any) => (
                <div key={a.id} className="py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{a.visitor_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.purpose} {a.host_name ? `· ${a.host_name}` : ""}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {format(new Date(a.scheduled_for), "MMM d, h:mm a")} · ID: {uuidToShortId(a.id)}
                    </p>
                  </div>
                  <Link to={`/gate/appointments?id=${a.id}`} className="text-xs text-primary font-semibold hover:underline shrink-0">Review</Link>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Quick Actions" description="Common tasks">
          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-start h-10 rounded-xl text-xs">
              <Link to="/office/documents"><FileUp className="mr-2 h-3.5 w-3.5" />Log New Document</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-10 rounded-xl text-xs">
              <Link to="/office/comms"><MessageSquare className="mr-2 h-3.5 w-3.5" />Send Broadcast</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-10 rounded-xl text-xs">
              <Link to="/calendar"><Calendar className="mr-2 h-3.5 w-3.5" />Manage Appointments</Link>
            </Button>
            <p className="text-[10px] text-muted-foreground text-center pt-2">
              All office actions are logged with timestamps
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
};