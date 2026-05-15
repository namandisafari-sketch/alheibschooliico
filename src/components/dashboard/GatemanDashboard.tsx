import { Kpi, Section } from "@/components/role/RolePage";
import { Shield, Car, LogOut, ClipboardList, UserCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const GatemanDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Visitors Today" value={0} icon={UserCheck} tone="primary" />
        <Kpi label="Vehicles In" value={0} icon={Car} tone="info" />
        <Kpi label="Exit Passes" value={0} hint="Issued today" icon={LogOut} tone="success" />
        <Kpi label="Open Incidents" value={0} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Gate Operations" description="Front-line controls">
          <div className="grid gap-3">
            <Button asChild className="justify-start h-12 rounded-xl">
              <Link to="/visitors"><Shield className="mr-2 h-4 w-4" />Visitor Sign-In</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate/vehicles"><Car className="mr-2 h-4 w-4" />Vehicle In/Out Log</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate/exit-passes"><LogOut className="mr-2 h-4 w-4" />Learner Exit Passes</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/gate/handover"><ClipboardList className="mr-2 h-4 w-4" />Shift Handover</Link>
            </Button>
          </div>
        </Section>

        <Section title="Pending Approvals" description="Exit passes awaiting verification">
          <p className="text-xs text-muted-foreground py-6 text-center">No pending exit passes</p>
        </Section>

        <Section title="Today's Roster" description="Staff & duty schedule">
          <p className="text-xs text-muted-foreground py-6 text-center">Connect duty_roster table</p>
        </Section>
      </div>
    </div>
  );
};
