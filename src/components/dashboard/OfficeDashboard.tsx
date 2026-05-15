import { Kpi, Section } from "@/components/role/RolePage";
import { FileText, Megaphone, Users, FolderOpen, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const OfficeDashboard = () => (
  <div className="space-y-6">
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Kpi label="Visitors Today" value={0} icon={Users} tone="primary" />
      <Kpi label="Pending Documents" value={0} icon={FileText} tone="warning" />
      <Kpi label="Broadcasts Sent" value={0} hint="This week" icon={Megaphone} tone="info" />
      <Kpi label="Appointments" value={0} icon={Calendar} tone="success" />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Section title="Front-Office Tools" description="Daily reception workflow">
        <div className="grid gap-3">
          <Button asChild className="justify-start h-12 rounded-xl">
            <Link to="/visitors"><Users className="mr-2 h-4 w-4" />Visitor Log</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
            <Link to="/office/documents"><FolderOpen className="mr-2 h-4 w-4" />Document Registry</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
            <Link to="/office/comms"><Megaphone className="mr-2 h-4 w-4" />Communications Hub</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
            <Link to="/calendar"><Calendar className="mr-2 h-4 w-4" />Appointments</Link>
          </Button>
        </div>
      </Section>

      <Section title="Inbox Snapshot" description="Unread internal memos">
        <p className="text-xs text-muted-foreground py-6 text-center"><Mail className="inline h-4 w-4 mr-1" />No new memos</p>
      </Section>

      <Section title="Outgoing Queue" description="Drafts ready to send">
        <p className="text-xs text-muted-foreground py-6 text-center">Queue is empty</p>
      </Section>
    </div>
  </div>
);
