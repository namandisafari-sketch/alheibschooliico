import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, History, User, Calendar, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Handover = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Local state for demo since real hook is simple, 
  // in production we'd use useQuery with the gate table
  const [reports, setReports] = useState([
    {
      id: "1",
      outgoing_officer: "John Security",
      incoming_officer: "Sam Guard",
      shift_date: "2024-05-15",
      shift_type: "Day",
      incidents_summary: "All quiet. One delivery from Stationery World at 10 AM.",
      is_acknowledged: true,
    }
  ]);

  const [formData, setFormData] = useState({
    incoming_officer_id: "",
    shift_type: "Day",
    ob_references: "",
    items_handed_over: "Keys, Radio, Guard Book",
    incidents_summary: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport = {
      id: Math.random().toString(),
      outgoing_officer: user?.full_name || "Current User",
      incoming_officer: "Selected Officer",
      shift_date: format(new Date(), "yyyy-MM-dd"),
      shift_type: formData.shift_type,
      incidents_summary: formData.incidents_summary,
      is_acknowledged: false,
    };
    setReports([newReport, ...reports]);
    toast({ title: "Handover Filed", description: "Report has been logged and awaits acknowledgement." });
    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout title="Shift Handover" subtitle="Security Accountability & Continuity">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Logged in as: {user?.full_name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Start Handover
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Shift Handover Report</DialogTitle>
                <DialogDescription>Document your shift findings for the next officer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shift Type</Label>
                    <Select defaultValue="Day" onValueChange={(v) => setFormData(p => ({...p, shift_type: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Day">Day Shift</SelectItem>
                        <SelectItem value="Night">Night Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input value={format(new Date(), "yyyy-MM-dd")} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Handed Over Items</Label>
                  <Input 
                    value={formData.items_handed_over}
                    onChange={(e) => setFormData(p => ({...p, items_handed_over: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incidents / Observations</Label>
                  <Textarea 
                    rows={4}
                    placeholder="Briefly describe events of your shift..."
                    value={formData.incidents_summary}
                    onChange={(e) => setFormData(p => ({...p, incidents_summary: e.target.value}))}
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded text-amber-800 text-xs">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>By submitting, you confirm all duty items are accounted for and the next officer is present.</p>
                </div>
                <Button type="submit" className="w-full">Sign Off & Handover</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Recent Handovers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date / Shift</TableHead>
                  <TableHead>Outgoing Officer</TableHead>
                  <TableHead>Incoming Officer</TableHead>
                  <TableHead>Incidents</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{format(new Date(report.shift_date), "MMM d, yyyy")}</span>
                        <span className="text-xs text-muted-foreground">{report.shift_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{report.outgoing_officer}</TableCell>
                    <TableCell className="text-sm">{report.incoming_officer}</TableCell>
                    <TableCell className="max-w-[250px]">
                      <p className="text-xs line-clamp-2">{report.incidents_summary}</p>
                    </TableCell>
                    <TableCell>
                      {report.is_acknowledged ? (
                        <Badge className="bg-green-600">Acknowleged</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Handover;
