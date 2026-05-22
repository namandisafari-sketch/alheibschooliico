// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useExitPasses } from "@/hooks/useGate";
import { UserCheck, Search, Clock, ShieldCheck, UserX, CheckCircle2, Filter } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const ExitPasses = () => {
  const [activeTab, setActiveTab] = useState("approved");
  const { data: passes = [], isLoading } = useExitPasses();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPasses = passes.filter(p => 
    p.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.staff?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    pending: passes.filter(p => p.status === "pending").length,
    approved: passes.filter(p => p.status === "approved").length,
    inside: passes.filter(p => p.status === "exit").length,
  };

  return (
    <DashboardLayout title="Exit Passes" subtitle="Learner & Staff Movement Authorization">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-orange-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Pending Approvals</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>
          <Card className="bg-green-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase">Ready for Exit</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Currently Outside</p>
                <p className="text-2xl font-bold">{stats.inside}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading exit passes...</div>
            ) : filteredPasses.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <UserCheck className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">No matching exit passes found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Target Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPasses.map((pass) => (
                    <TableRow key={pass.id}>
                      <TableCell className="font-medium">
                        {pass.pass_type === "learner" ? pass.learner?.full_name : pass.staff?.full_name}
                      </TableCell>
                      <TableCell className="capitalize">{pass.pass_type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{pass.reason || "Official duty"}</TableCell>
                      <TableCell className="text-xs">
                        {pass.return_target_time ? format(new Date(pass.return_target_time), "MMM d, h:mm a") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          pass.status === "approved" ? "default" : 
                          pass.status === "exit" ? "secondary" : 
                          pass.status === "pending" ? "outline" : "destructive"
                        }>
                          {pass.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs italic">{pass.approver?.full_name || "System"}</TableCell>
                      <TableCell className="text-right">
                        {pass.status === "approved" && (
                          <Button size="sm" className="h-7 text-xs">Verify Exit</Button>
                        )}
                        {pass.status === "exit" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs">Mark Return</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExitPasses;
