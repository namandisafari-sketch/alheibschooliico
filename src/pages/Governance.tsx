// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Scale, FileText, Gavel, Landmark, Eye, PieChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGovernanceMembers, useGovernanceMeetings, useGovernancePolicies } from "@/hooks/useCompliance";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Governance = () => {
  const { data: members = [], isLoading: membersLoading } = useGovernanceMembers();
  const { data: meetings = [], isLoading: meetingsLoading } = useGovernanceMeetings();
  const { data: policies = [], isLoading: policiesLoading } = useGovernancePolicies();

  const nextMeeting = meetings.find(m => m.status === 'scheduled');

  const activeMembers = members.filter(m => m.status === 'active').length;
  const attendanceRate = members.length ? Math.round((activeMembers / members.length) * 100) : 0;

  const activePolicies = policies.filter(p => p.status === 'active').length;
  const policyRatio = policies.length ? (activePolicies / policies.length) : 0;

  // Derive a simple strategic score from policy coverage and meeting frequency
  const meetingsScheduled = meetings.filter(m => m.status === 'scheduled').length;
  const scoreValue = Math.round((policyRatio * 70) + Math.min(meetingsScheduled, 5) * 6 + Math.min(attendanceRate / 100, 1) * 24);
  const strategicGrade = scoreValue >= 90 ? 'A+' : scoreValue >= 75 ? 'A' : scoreValue >= 50 ? 'B' : 'C';

  return (
    <DashboardLayout title="Governance Board" subtitle="Strategic Oversight, Policy Framework & SMB Operations">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Board Members</CardTitle>
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{membersLoading ? "..." : members.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" /> {membersLoading ? '...' : `${attendanceRate}% Active`}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Policies Active</CardTitle>
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{policiesLoading ? "..." : activePolicies}</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-tight">
                Fully Compliant
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upcoming Sessions</CardTitle>
              <div className="p-1.5 bg-amber-50 rounded-md">
                <Scale className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600">{meetingsScheduled}</div>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                Agenda items set
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Score</CardTitle>
              <div className="p-1.5 bg-slate-100 rounded-md">
                <PieChart className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{strategicGrade}</div>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                Audit: Satisfactory
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-slate-200 shadow-lg bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">School Management Board (SMB)</CardTitle>
                    <CardDescription className="text-[11px]">Primary decision-making body and executive committee</CardDescription>
                    <div className="text-[10px] text-muted-foreground mt-1">Members are sourced from the <strong>governance_members</strong> table (SMB).</div>
                  </div>
                    <Button variant="outline" size="sm" className="font-bold text-[10px]" onClick={() => {
                      const constitution = policies.find(p => p.title.toLowerCase().includes("board governance"));
                      if (constitution?.document_url) window.open(constitution.document_url, "_blank");
                      else toast.info("Board Governance Charter not yet uploaded");
                    }}>
                      <Landmark className="h-3 w-3 mr-2" /> Constitution
                    </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {membersLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                         <Skeleton className="h-10 w-10 rounded-full" />
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                         </div>
                       </div>
                       <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))
                ) : members.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm font-medium italic">
                    Board members list is not initialized.
                  </div>
                ) : (
                  members.map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {member.image_url ? (
                          <img src={member.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs text-center">
                            {((member.full_name || "").split(" ").map(n => n[0] || "").join("")) || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm leading-none">{member.full_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${member.status === 'active' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-400 border-slate-200 bg-slate-50'}`}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm border-l-4 border-l-primary bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Gavel className="h-4 w-4" /> Next Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextMeeting ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-primary tracking-tighter uppercase">
                      {format(new Date(nextMeeting.meeting_date), "MMM d")}
                    </p>
                    <p className="text-xs font-bold leading-none">{nextMeeting.title}</p>
                    <p className="text-[10px] text-muted-foreground italic mt-2">Venue: {nextMeeting.venue}</p>
                    {nextMeeting.agenda && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">Agenda: {nextMeeting.agenda}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">No scheduled sessions</p>
                  </div>
                )}
                <Separator className="bg-primary/10" />
                <Button className="w-full h-8 text-[11px] font-bold" disabled={!nextMeeting}> Confirm Attendance </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" /> Policy Library
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 border-t">
                {policiesLoading ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : policies.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-[10px] italic">No documents uploaded.</div>
                ) : (
                  policies.slice(0, 4).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b last:border-0">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold">{doc.title}</span>
                        <span className="text-[9px] text-muted-foreground">v{doc.version} | {doc.category}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        if (doc.document_url) window.open(doc.document_url, "_blank");
                      }}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
                <div className="p-4 pt-2">
                  <Button variant="link" className="text-xs font-bold p-0 h-auto" onClick={() => toast.info(`${policies.length} policies in library`)}>
                    View All Frameworks ({policies.length}) &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Governance;
