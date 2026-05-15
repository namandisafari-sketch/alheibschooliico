
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Award, Clock } from "lucide-react";

export const StaffPerformanceTab = () => {
  const staffPerformance = [
    { name: "Akinah Akinah", role: "Matron", score: 92, attendance: 98, tasks: "12/12" },
    { name: "Khalifan M.", role: "Arabic Teacher", score: 88, attendance: 95, tasks: "10/12" },
    { name: "Aidah N.", role: "Head Teacher", score: 95, attendance: 100, tasks: "24/25" },
    { name: "Zaiton S.", role: "Secretary", score: 85, attendance: 92, tasks: "15/18" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">Aidah N.</p>
            <p className="text-xs text-muted-foreground">95% Efficiency Score</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-success/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> Avg. Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">96.4%</p>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Punctuality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">88%</p>
            <p className="text-xs text-muted-foreground">On-time clock in</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Staff Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Task Completion</TableHead>
                <TableHead>Performance Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffPerformance.map((staff) => (
                <TableRow key={staff.name}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell><Badge variant="outline">{staff.role}</Badge></TableCell>
                  <TableCell>{staff.attendance}%</TableCell>
                  <TableCell>{staff.tasks}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={staff.score} className="h-2 w-24" />
                      <span className="font-bold text-sm">{staff.score}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
