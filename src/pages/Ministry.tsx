import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, Download, BookOpen, ShieldCheck, Landmark, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMinistryGuidelines } from "@/hooks/useCompliance";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Ministry = () => {
  const { data: guidelines = [], isLoading } = useMinistryGuidelines();

  return (
    <DashboardLayout title="Ministry Context" subtitle="MoES Compliance, Standards & National Regulations">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-3 border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight">Government Guidelines</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Official circulars and directives from MoES</CardDescription>
                </div>
                <Landmark className="h-8 w-8 text-slate-700" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))
                ) : guidelines.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                    No guidelines found in the database.
                  </div>
                ) : (
                  guidelines.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-none">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-1 py-0 border-slate-300">
                              {doc.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {format(new Date(doc.issue_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold">
                          <Download className="h-3.5 w-3.5" /> {doc.file_size || "N/A"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> External Portals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button className="w-full justify-between h-10 px-4 text-xs font-bold" variant="outline">
                  <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Curriculum Center</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Button>
                <Button className="w-full justify-between h-10 px-4 text-xs font-bold" variant="outline">
                  <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> UNEB Portal</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Button>
                <Button className="w-full justify-between h-10 px-4 text-xs font-bold" variant="outline">
                  <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Inspection Log</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-amber-900 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Compliance Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  The EMIS return for Term II is due in 14 days. Failure to upload learner data may affect the school's capitation grant eligibility.
                </p>
                <Button className="w-full mt-4 h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px]" size="sm">
                  Review EMIS Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
           <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">National Standards (NCS)</CardTitle>
              <CardDescription className="text-xs">Minimum requirements for private educational institutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl bg-slate-50/50">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Teacher Ratio</p>
                  <p className="text-xl font-black mt-2">1:25</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-1">Compliant (Current 1:22)</p>
                </div>
                <div className="p-4 border rounded-xl bg-slate-50/50">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Acreage Ratio</p>
                  <p className="text-xl font-black mt-2">5.2 Ac.</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-1">Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Compliance Contacts</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Assigned Inspectors & DES Officers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">DES Central Region</p>
                  <p className="text-[10px] text-slate-400">Regional Inspector of Schools</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-300 hover:text-white">Call Office</Button>
              </div>
              <p className="text-[10px] text-slate-500 italic text-center">
                Last formal inspection: March 22, 2026 | Next scheduled: Aug 2026
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Ministry;
