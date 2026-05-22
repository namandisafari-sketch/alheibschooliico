// @ts-nocheck
import { useState, useMemo } from "react";
import { useLearners } from "@/hooks/useLearners";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowUpRight, 
  Calendar, 
  UserCheck, 
  ShieldAlert 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RegistrationTrackerWidget() {
  const { data: learners = [], isLoading } = useLearners();
  const [selectedCycle, setSelectedCycle] = useState<string>("all");

  // 1. Group & extract registration cycles dynamically based on admission_date or enrollment_date
  const cyclesList = useMemo(() => {
    const cycles = new Set<string>();
    learners.forEach((l) => {
      // admission_date is typically stored as YYYY-MM-DD
      const dateStr = l.admission_date || l.enrollment_date;
      if (dateStr) {
        const year = dateStr.split("-")[0];
        if (year && year.length === 4) {
          cycles.add(`${year} Intake`);
        }
      }
    });
    // Add default fallbacks if empty
    if (cycles.size === 0) {
      cycles.add("2024 Intake");
      cycles.add("2025 Intake");
    }
    return Array.from(cycles).sort().reverse();
  }, [learners]);

  // Set default cycle on load
  useState(() => {
    if (cyclesList.length > 0) {
      setSelectedCycle(cyclesList[0]);
    }
  });

  // 2. Filter learners based on selected cycle
  const filteredLearners = useMemo(() => {
    if (selectedCycle === "all") return learners;
    const yearPrefix = selectedCycle.split(" ")[0];
    return learners.filter((l) => {
      const dateStr = l.admission_date || l.enrollment_date;
      return dateStr ? dateStr.startsWith(yearPrefix) : yearPrefix === "2024"; // Fallback to 2024
    });
  }, [learners, selectedCycle]);

  // 3. Compute registration metrics
  const metrics = useMemo(() => {
    const total = filteredLearners.length;
    let verified = 0; // Has NIN and complete address details
    let incomplete = 0; // Missing NIN or address
    let active = 0;
    let inactive = 0;

    filteredLearners.forEach((l) => {
      // Check completeness: has NIN, district, and village
      const hasNIN = !!l.nin;
      const hasLocation = !!l.district && !!l.home_village;
      const isComplete = hasNIN && hasLocation;

      if (isComplete) {
        verified++;
      } else {
        incomplete++;
      }

      if (l.status === "active") {
        active++;
      } else {
        inactive++;
      }
    });

    const completionRate = total > 0 ? Math.round((verified / total) * 100) : 0;

    return {
      total,
      verified,
      incomplete,
      active,
      inactive,
      completionRate
    };
  }, [filteredLearners]);

  // 4. Get recent registrations in this cycle
  const recentRegistrations = useMemo(() => {
    // Sort by admission_date descending
    return [...filteredLearners]
      .sort((a, b) => {
        const dateA = a.admission_date || a.enrollment_date || "";
        const dateB = b.admission_date || b.enrollment_date || "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [filteredLearners]);

  if (isLoading) {
    return (
      <Card className="border-2 border-slate-100 shadow-sm rounded-3xl p-6">
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-bold uppercase tracking-widest">
          Loading cycles...
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-100 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              Registration Cycle Tracker
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">
              Real-time monitoring of bio-data cycles & completeness
            </CardDescription>
          </div>
          <div>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="w-[160px] h-9 rounded-xl border-2 font-black text-xs uppercase tracking-tight bg-white">
                <Calendar className="mr-2 h-3.5 w-3.5 text-primary" />
                <SelectValue placeholder="Select Cycle" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-black text-xs uppercase">All Cycles</SelectItem>
                {cyclesList.map((cycle) => (
                  <SelectItem key={cycle} value={cycle} className="font-black text-xs uppercase">
                    {cycle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Users className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">Total Intake</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <UserCheck className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{metrics.verified}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">Verified Profile</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 tracking-tight">{metrics.incomplete}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">Pending Review</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600 tracking-tight">{metrics.active}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">Active Status</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="p-5 rounded-2xl border-2 border-slate-100 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black uppercase tracking-wider text-slate-500">Bio-data Completeness Rate</span>
            <span className="font-mono font-black text-emerald-600">{metrics.completionRate}%</span>
          </div>
          <Progress value={metrics.completionRate} className="h-3 rounded-full bg-slate-100" />
          <p className="text-[10px] font-bold text-slate-400 leading-tight">
            * Complete profile requires a registered National Identification Number (NIN) and a verified local address (District, Sub-county, Parish, and Village).
          </p>
        </div>

        {/* Recent Registrations Table */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Recent Intake Entries ({selectedCycle})
          </h4>
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-100 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Learner Name</th>
                  <th className="py-3 px-2 font-black text-[10px] uppercase tracking-widest text-slate-500">Class</th>
                  <th className="py-3 px-2 font-black text-[10px] uppercase tracking-widest text-slate-500">Location</th>
                  <th className="py-3 px-4 text-right font-black text-[10px] uppercase tracking-widest text-slate-500">Verification</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs font-bold text-slate-400 uppercase">
                      No records found in this cycle
                    </td>
                  </tr>
                ) : (
                  recentRegistrations.map((learner) => {
                    const hasNIN = !!learner.nin;
                    const hasLocation = !!learner.district && !!learner.home_village;
                    const isComplete = hasNIN && hasLocation;

                    return (
                      <tr key={learner.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0">
                        <td className="py-3 px-4">
                          <div className="font-black text-xs text-slate-900 uppercase tracking-tight">{learner.full_name}</div>
                          <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                            Admitted: {learner.admission_date || learner.enrollment_date || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 bg-slate-50">
                            {learner.class_name || "—"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-[10px] font-bold text-slate-600 uppercase max-w-[120px] truncate">
                            {learner.district || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5",
                            isComplete ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
                          )}>
                            {isComplete ? "Verified" : "Pending NIN/Address"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
