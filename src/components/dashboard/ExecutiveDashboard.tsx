import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Wallet, 
  TrendingUp, 
  Award, 
  FileCheck2, 
  ShieldCheck, 
  Construction, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";
import { format } from "date-fns";

export const ExecutiveDashboard = () => {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  // Mock indicators matching Ugandan educational metrics
  const developmentProjects = [
    { name: "P5-P7 Dormitory Expansion", phase: "Structural Superstructure", budget: "UGX 45,000,000", status: "75% Completed", priority: "High" },
    { name: "Main Dining Hall Solar Installation", phase: "Electrical Wiring", budget: "UGX 12,000,000", status: "completed", priority: "Medium" },
    { name: "Computer Laboratory Resource Kits", phase: "Procurement", budget: "UGX 8,500,000", status: "Pending Supply", priority: "Medium" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Board welcome banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-100 to-transparent p-6 shadow-sm relative overflow-hidden bg-white">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-slate-50 rounded-full -mr-24 -mb-24 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-6.5 w-6.5 text-indigo-600" /> Strategic Governance & Operations Dashboard
            </h3>
            <p className="text-sm text-slate-500 mt-1">Unified command for School Board, SME committee members, MOES compliance officers, District Education Officials, Sponsors, and Alumni.</p>
          </div>
          <div className="lg:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> High Compliance Rating
            </span>
            <p className="text-xs text-muted-foreground mt-1.5">{today}</p>
          </div>
        </div>
      </div>

      {/* Strategic Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Term 3 Fee Target</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-155">UGX 185.4M</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">79% Collected (UGX 146.4M)</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Pupils</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-155">412 Learners</h3>
              <p className="text-[10px] text-indigo-600 font-bold mt-1">+14% Growth YoY</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff & Payroll</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-155">34 Staff</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Monthly Payroll: UGX 32.8M</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:translate-y-[-2px] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">P7 PLE Forecast</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-155">94% First Div</h3>
              <p className="text-[10px] text-yellow-600 font-semibold mt-1">Candidate Assessments</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Governance Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Development & SMC Projects Tracker */}
        <Card className="md:col-span-2 shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Construction className="h-5 w-5 text-indigo-600" /> Infrastructure Projects Ledger (SMC & Donors)
            </CardTitle>
            <CardDescription>Oversight of active building, electrical, and educational equipment acquisitions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border/50">
              {developmentProjects.map((project, idx) => (
                <div key={idx} className="pb-4 pt-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900">{project.name}</p>
                      <Badge variant={project.priority === "High" ? "destructive" : "secondary"} className="text-[9px] h-4.5 uppercase">{project.priority}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{project.phase} • Value: {project.budget}</p>
                  </div>
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-xs font-bold text-slate-800">{project.status}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Approved by SMC</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Inspect Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regulatory, Compliance & PLE Forecast Panel */}
        <div className="space-y-6">
          <Card className="shadow-sm border border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="h-4.5 w-4.5 text-indigo-600" /> Regulatory Compliance (DEO & MOES)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { checklist: "NCDC New Curriculum Compliance Check", val: "APPROVED" },
                { checklist: "Public Health & Sanitary Audit", val: "100% PASS" },
                { checklist: "UPE enrollment ledger reconciliation", val: "SUBMITTED" },
              ].map((comp, idx) => (
                <div key={idx} className="p-3 bg-indigo-50/15 rounded-xl border border-indigo-100/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700">{comp.checklist}</span>
                    <Badge variant="outline" className="text-[9px] text-indigo-700 border-indigo-200 bg-indigo-50 font-bold">{comp.val}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* School growth and metrics */}
          <Card className="shadow-sm border border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" /> Donor & Alumni Contributions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "Sponsor Funds: Solar Well project", status: "Funded", amount: "UGX 15.2M" },
                { title: "Alumni Donation: Classroom Desks", status: "Delivered", amount: "35 Desks" },
              ].map((gift, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/40 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">{gift.title}</span>
                    <span className="text-[10px] text-slate-500">{gift.amount}</span>
                  </div>
                  <Badge variant="success" className="text-[9px] uppercase tracking-wider h-5 font-black">
                    {gift.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
