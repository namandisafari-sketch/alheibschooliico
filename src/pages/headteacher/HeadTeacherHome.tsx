import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DirectorDashboard } from "@/components/dashboard/DirectorDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Shield, Users, FileText, ChevronRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeadTeacherHome = () => {
  const { role } = useAuth();
  
  return (
    <DashboardLayout 
      title={role === "head_teacher" ? "Headteacher Dashboard" : "Deputy Headteacher Dashboard"} 
      subtitle="School management & institutional oversight"
    >
      <div className="grid gap-6 md:grid-cols-4 mb-6">
         <Card className="p-4 flex items-center gap-4 bg-blue-50 border-blue-100">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
               <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
               <p className="text-xs font-bold text-blue-900 uppercase">Accountability</p>
               <h3 className="text-xl font-black text-blue-950">High</h3>
            </div>
         </Card>
         <Card className="p-4 flex items-center gap-4 bg-emerald-50 border-emerald-100">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
               <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
               <p className="text-xs font-bold text-emerald-900 uppercase">Staff Sync</p>
               <h3 className="text-xl font-black text-emerald-950">Active</h3>
            </div>
         </Card>
         <Card className="p-4 flex items-center gap-4 bg-amber-50 border-amber-100">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
               <Scale className="h-6 w-6 text-amber-600" />
            </div>
            <div>
               <p className="text-xs font-bold text-amber-900 uppercase">Discipline</p>
               <h3 className="text-xl font-black text-amber-950">Monitored</h3>
            </div>
         </Card>
         <Card className="p-4 flex items-center gap-4 bg-rose-50 border-rose-100">
            <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
               <FileText className="h-6 w-6 text-rose-600" />
            </div>
            <div>
               <p className="text-xs font-bold text-rose-900 uppercase">Term Progress</p>
               <h3 className="text-xl font-black text-rose-950">65%</h3>
            </div>
         </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <DirectorDashboard />
        </div>
        
        <div className="space-y-6">
           <Card className="p-6">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                 <Shield className="h-5 w-5 text-primary" />
                 Institutional Hierarchy
              </h2>
              <div className="space-y-4">
                 {[
                    { level: "Ministry of Education", desc: "National Policy & Standards" },
                    { level: "District Education Office", desc: "Regional Supervision" },
                    { level: "School Management Board", desc: "Governance & Ethics" },
                    { level: "Administration", desc: "Headteacher & Deputies" },
                    { level: "Academic Staff", desc: "HODs & Classroom Teachers" },
                    { level: "Student Leadership", desc: "Prefects & Councils" }
                 ].map((step, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                       <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full border-2 border-primary bg-background shrink-0" />
                          {i < 5 && <div className="w-0.5 h-full bg-slate-200" />}
                       </div>
                       <div className="pb-4">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{step.level}</h4>
                          <p className="text-xs text-slate-500">{step.desc}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Internal Memo</h3>
              <p className="text-sm font-medium mb-4 leading-relaxed italic opacity-90">
                 "Leadership is not a position or a title, it is action and example. Ensure the Term 3 curriculum coverage report is finalized by Friday."
              </p>
              <Button variant="outline" size="sm" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                 View Internal Directives <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HeadTeacherHome;
