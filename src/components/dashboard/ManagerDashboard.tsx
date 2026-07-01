import { Kpi, Section } from "@/components/role/RolePage";
import { TrendingUp, Users, ClipboardCheck, AlertCircle, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLearners } from "@/hooks/useLearners";
import { useTeachers } from "@/hooks/useTeachers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ManagerDashboard = () => {
  const { data: learners } = useLearners();
  const { data: teachers } = useTeachers();

  const { data: pendingApprovals = 0 } = useQuery({
    queryKey: ["manager-pending-approvals"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: openIssues = 0 } = useQuery({
    queryKey: ["manager-open-issues"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("discipline_cases")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active Learners" value={learners?.length ?? 0} icon={Users} tone="primary" />
        <Kpi label="Active Staff" value={teachers?.length ?? 0} icon={Users} tone="info" />
        <Kpi label="Pending Approvals" value={pendingApprovals} hint="Leave requests" icon={ClipboardCheck} tone="warning" />
        <Kpi label="Open Issues" value={openIssues} hint="Discipline cases" icon={AlertCircle} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Department KPIs" description="Cross-team performance pulse">
          <div className="space-y-3 text-sm">
            {[
              { name: "Academic", v: "78%", tone: "text-emerald-600" },
              { name: "Finance Collection", v: "62%", tone: "text-amber-600" },
              { name: "Inventory Health", v: "91%", tone: "text-emerald-600" },
              { name: "Attendance Rate", v: "88%", tone: "text-sky-600" },
            ].map((k) => (
              <div key={k.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <span>{k.name}</span>
                <span className={`font-black ${k.tone}`}>{k.v}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Approvals Queue" description="Items awaiting your decision">
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start rounded-xl">
              <Link to="/manager/approvals"><CheckCircle2 className="mr-2 h-4 w-4" />Open queue</Link>
            </Button>
            {pendingApprovals === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No items pending</p>
            ) : (
              <p className="text-xs font-bold text-amber-600 text-center py-4">
                {pendingApprovals} leave request{pendingApprovals !== 1 ? "s" : ""} awaiting approval
              </p>
            )}
          </div>
        </Section>

        <Section title="Staff Performance" description="Top & bottom performers">
          <Button asChild variant="outline" className="w-full justify-start rounded-xl">
            <Link to="/manager/performance"><BarChart3 className="mr-2 h-4 w-4" />Open scorecards</Link>
          </Button>
        </Section>
      </div>
    </div>
  );
};
