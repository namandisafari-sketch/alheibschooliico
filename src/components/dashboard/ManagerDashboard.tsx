import { Kpi, Section } from "@/components/role/RolePage";
import { TrendingUp, Users, ClipboardCheck, AlertCircle, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLearners } from "@/hooks/useLearners";
import { useTeachers } from "@/hooks/useTeachers";

export const ManagerDashboard = () => {
  const { data: learners } = useLearners();
  const { data: teachers } = useTeachers();
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active Learners" value={learners?.length ?? 0} icon={Users} tone="primary" />
        <Kpi label="Active Staff" value={teachers?.length ?? 0} icon={Users} tone="info" />
        <Kpi label="Pending Approvals" value={0} hint="Across all departments" icon={ClipboardCheck} tone="warning" />
        <Kpi label="Open Issues" value={0} icon={AlertCircle} tone="warning" />
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
            <p className="text-xs text-muted-foreground text-center py-4">No items pending</p>
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
