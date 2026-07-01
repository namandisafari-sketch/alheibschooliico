import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  Database, 
  Search, 
  History, 
  Filter, 
  X, 
  Check, 
  AlertTriangle,
  FolderOpen,
  User,
  DollarSign,
  ShieldAlert,
  Stethoscope,
  BookOpen,
  Award,
  Heart,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ArchiveRecord {
  id: string;
  year: string;
  term: string;
  category: string;
  title: string;
  timestamp: string;
  details: string;
  icon: any;
  color: string;
}

const iconMap: Record<string, any> = {
  User, DollarSign, ShieldAlert, Stethoscope, FolderOpen, BookOpen, Award, Heart, FileText,
};

export const HistoricalArchiveExplorer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTemporalModeActive, setIsTemporalModeActive] = useState(false);
  
  const [academicYear, setAcademicYear] = useState<string>("all");
  const [academicTerm, setAcademicTerm] = useState<string>("all");
  const [exactDate, setExactDate] = useState<string>("");
  const [exactTime, setExactTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [archiveCategories, setArchiveCategories] = useState<any[]>([]);
  const [categoryConfig, setCategoryConfig] = useState<Record<string, { icon: any; color: string }>>({
    "Learner Bio-data": { icon: User, color: "bg-blue-100 text-blue-600" },
    "Financial Receipt": { icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
    "Discipline Case": { icon: ShieldAlert, color: "bg-red-100 text-red-600" },
    "Medical Log": { icon: Stethoscope, color: "bg-purple-100 text-purple-600" },
  });

  useEffect(() => {
    supabase.from("archive_categories").select("*").eq("is_active", true).order("name").then(({ data }) => {
      if (data?.length) {
        setArchiveCategories(data);
        const colors = ["bg-blue-100 text-blue-600", "bg-emerald-100 text-emerald-600", "bg-red-100 text-red-600", "bg-purple-100 text-purple-600", "bg-amber-100 text-amber-600", "bg-indigo-100 text-indigo-600", "bg-pink-100 text-pink-600", "bg-teal-100 text-teal-600"];
        const config: Record<string, { icon: any; color: string }> = {};
        data.forEach((c: any, i: number) => {
          config[c.name] = { icon: iconMap[c.icon] || FolderOpen, color: colors[i % colors.length] };
        });
        setCategoryConfig(config);
      }
    });
  }, []);

  useEffect(() => {
    const active = localStorage.getItem("temp_query_active") === "true";
    if (active) {
      setIsTemporalModeActive(true);
      setAcademicYear(localStorage.getItem("temp_query_year") || "all");
      setAcademicTerm(localStorage.getItem("temp_query_term") || "all");
      setExactDate(localStorage.getItem("temp_query_date") || "");
      setExactTime(localStorage.getItem("temp_query_time") || "");
    }
  }, []);

  const { data: realResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["archive-search", searchQuery, academicYear, academicTerm, exactDate, categoryFilter],
    enabled: isOpen && searchQuery.length > 0,
    queryFn: async (): Promise<ArchiveRecord[]> => {
      const yearFilter = academicYear !== "all" ? parseInt(academicYear) : null;
      const results: ArchiveRecord[] = [];

      const searchPattern = searchQuery ? `%${searchQuery}%` : "%%";

      if (categoryFilter === "all" || categoryFilter === "learners") {
        const { data: learners } = await supabase
          .from("learners")
          .select("id, full_name, created_at, admission_number, classes(name), status")
          .or(`full_name.ilike.${searchPattern},admission_number.ilike.${searchPattern}`)
          .limit(20);
        (learners || []).forEach((l: any) => {
          results.push({
            id: `l-${l.id}`, year: format(new Date(l.created_at), "yyyy"),
            term: "", category: "Learner Bio-data",
            title: `${l.full_name} (${l.admission_number || "N/A"})`,
            timestamp: format(new Date(l.created_at), "dd MMM yyyy HH:mm"),
            details: `Status: ${l.status} | Class: ${l.classes?.name || "N/A"} | Registered: ${format(new Date(l.created_at), "dd MMM yyyy")}`,
            icon: User, color: "bg-blue-100 text-blue-600",
          });
        });
      }

      if (categoryFilter === "all" || categoryFilter === "fees") {
        const { data: payments } = await supabase
          .from("fee_payments")
          .select("id, amount, payment_date, receipt_number, learners(full_name), term, academic_year")
          .or(`receipt_number.ilike.${searchPattern},learners.full_name.ilike.${searchPattern}`)
          .limit(20);
        (payments || []).forEach((p: any) => {
          results.push({
            id: `f-${p.id}`, year: String(p.academic_year || format(new Date(p.payment_date), "yyyy")),
            term: p.term || "", category: "Financial Receipt",
            title: `Receipt #${p.receipt_number} - UGX ${Number(p.amount).toLocaleString()}`,
            timestamp: format(new Date(p.payment_date), "dd MMM yyyy"),
            details: `Payer: ${p.learners?.full_name || "N/A"} | Amount: UGX ${Number(p.amount).toLocaleString()} | Term: ${p.term || "N/A"}`,
            icon: DollarSign, color: "bg-emerald-100 text-emerald-600",
          });
        });
      }

      if (categoryFilter === "all" || categoryFilter === "discipline") {
        const { data: cases } = await supabase
          .from("discipline_cases")
          .select("id, incident_type, incident_date, description, severity, status, learners(full_name)")
          .or(`incident_type.ilike.${searchPattern},learners.full_name.ilike.${searchPattern}`)
          .limit(20);
        (cases || []).forEach((c: any) => {
          results.push({
            id: `d-${c.id}`, year: format(new Date(c.incident_date), "yyyy"),
            term: "", category: "Discipline Case",
            title: `${c.incident_type} - ${c.learners?.full_name || "N/A"}`,
            timestamp: format(new Date(c.incident_date), "dd MMM yyyy"),
            details: `Severity: ${c.severity} | Status: ${c.status} | ${c.description ? c.description.slice(0, 100) : "No description"}`,
            icon: ShieldAlert, color: "bg-red-100 text-red-600",
          });
        });
      }

      if (categoryFilter === "all" || categoryFilter === "medical") {
        const { data: incidents } = await supabase
          .from("medical_incidents")
          .select("id, type, created_at, description, severity, status, learners(full_name)")
          .or(`type.ilike.${searchPattern},learners.full_name.ilike.${searchPattern}`)
          .limit(20);
        (incidents || []).forEach((m: any) => {
          results.push({
            id: `m-${m.id}`, year: format(new Date(m.created_at), "yyyy"),
            term: "", category: "Medical Log",
            title: `${m.type} - ${m.learners?.full_name || "N/A"}`,
            timestamp: format(new Date(m.created_at), "dd MMM yyyy HH:mm"),
            details: `Severity: ${m.severity} | Status: ${m.status} | ${m.description ? m.description.slice(0, 100) : ""}`,
            icon: Stethoscope, color: "bg-purple-100 text-purple-600",
          });
        });
      }

      return results
        .filter(r => !yearFilter || r.year === String(yearFilter))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 30);
    },
  });

  const handleActivateTemporalMode = () => {
    if (academicYear === "all" && !exactDate) {
      toast.warning("Please specify at least an Academic Year or Exact Date to query historical archives.");
      return;
    }

    localStorage.setItem("temp_query_active", "true");
    localStorage.setItem("temp_query_year", academicYear);
    localStorage.setItem("temp_query_term", academicTerm);
    localStorage.setItem("temp_query_date", exactDate);
    localStorage.setItem("temp_query_time", exactTime);
    
    setIsTemporalModeActive(true);
    setIsOpen(false);
    
    toast.success(`Temporal Query Activated! Now viewing school records as of: ${
      exactDate ? `${exactDate} ${exactTime || "00:00"}` : `Academic Year ${academicYear}`
    }`);
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleClearTemporalMode = () => {
    localStorage.removeItem("temp_query_active");
    localStorage.removeItem("temp_query_year");
    localStorage.removeItem("temp_query_term");
    localStorage.removeItem("temp_query_date");
    localStorage.removeItem("temp_query_time");
    
    setIsTemporalModeActive(false);
    setAcademicYear("all");
    setAcademicTerm("all");
    setExactDate("");
    setExactTime("");
    setSearchQuery("");
    setIsOpen(false);
    
    toast.info("Cleared temporal archive mode. Showing current active school year.");
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <>
      {isTemporalModeActive && (
        <div className="w-full bg-slate-900 text-slate-100 px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner border-b border-slate-800 z-50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-amber-400">Temporal Query Mode Active:</span>
            <span className="opacity-90">
              Viewing historical record archives for:{" "}
              <strong>
                {academicYear !== "all" ? `Year ${academicYear}` : ""}
                {academicTerm !== "all" ? ` | ${academicTerm}` : ""}
                {exactDate ? ` | Date: ${exactDate} ${exactTime ? `@ ${exactTime}` : ""}` : ""}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="outline" 
              className="h-6 px-2 text-[10px] uppercase font-black tracking-tighter bg-amber-500 hover:bg-amber-600 text-slate-900 border-none rounded"
              onClick={() => setIsOpen(true)}
            >
              Adjust Time
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-6 px-2 text-[10px] uppercase font-black tracking-tighter bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded"
              onClick={handleClearTemporalMode}
            >
              Return to Present
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "h-9 rounded-xl text-xs font-bold uppercase tracking-wider gap-2 flex items-center px-3 border-2 shadow-sm shrink-0",
              isTemporalModeActive 
                ? "border-amber-400 bg-amber-50/50 text-amber-800 hover:bg-amber-100" 
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <History className={cn("h-4 w-4", isTemporalModeActive && "animate-spin-slow text-amber-600")} />
            <span className="hidden sm:inline">
              {isTemporalModeActive ? "Temporal Active" : "Archive Explorer"}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl sm:rounded-2xl backdrop-blur-md bg-white/95">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <FolderOpen className="h-6 w-6" />
              <DialogTitle className="font-display text-xl font-bold">Historical Archive & Search Engine</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Query, search, and audit all school data (Students, Payments, Discipline, Medical) across multiple academic years. Specify exact dates and times to view point-in-time database snapshots.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-100 my-2">
            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Academic Year</label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="h-9 bg-white text-xs">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2026">2026 Academic Year</SelectItem>
                  <SelectItem value="2025">2025 Academic Year</SelectItem>
                  <SelectItem value="2024">2024 Academic Year</SelectItem>
                  <SelectItem value="2023">2023 Academic Year</SelectItem>
                  <SelectItem value="2022">2022 Academic Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 bg-white text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="learners">Learner Bio-data</SelectItem>
                  <SelectItem value="fees">Financial Receipts</SelectItem>
                  <SelectItem value="discipline">Discipline Cases</SelectItem>
                  <SelectItem value="medical">Medical Logs</SelectItem>
                  {archiveCategories.filter(c => !["Learner Bio-data", "Financial Receipt", "Discipline Case", "Medical Log"].includes(c.name)).map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Exact Date
              </label>
              <Input 
                type="date" 
                value={exactDate} 
                onChange={(e) => setExactDate(e.target.value)}
                className="h-9 bg-white text-xs" 
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                Exact Time
              </label>
              <Input 
                type="time" 
                value={exactTime} 
                onChange={(e) => setExactTime(e.target.value)}
                className="h-9 bg-white text-xs" 
              />
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Direct Temporal Query Search
            </h4>
            <div className="flex gap-2">
              <Input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, fees, discipline cases, medical logs..."
                className="h-10 text-xs flex-1"
              />
              <Button 
                className="h-10 px-4 font-bold uppercase text-xs tracking-wider bg-slate-900 hover:bg-slate-800"
                disabled={!searchQuery.trim()}
                onClick={() => {}} // query auto-runs via useQuery
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto mt-2 space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Database className="h-6 w-6 text-primary animate-pulse" />
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 animate-pulse">Running temporal query lookup...</p>
              </div>
            ) : !searchQuery.trim() ? (
              <p className="text-[11px] text-muted-foreground text-center py-8">
                Enter search terms and select filters above to browse historical records.
              </p>
            ) : realResults.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="text-[11px] font-bold text-slate-600">No Archives Found matching search filter</p>
                <p className="text-[10px] text-muted-foreground">Adjust your exact date/time, year filters, or search keywords.</p>
              </div>
            ) : (
              realResults.map((rec) => {
                const cfg = categoryConfig[rec.category] || { icon: FolderOpen, color: "bg-slate-100 text-slate-600" };
                const Icon = rec.icon || cfg.icon;
                return (
                  <Card key={rec.id} className="border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all">
                    <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", rec.color)}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-wider bg-slate-200 text-slate-800">
                          {rec.category}
                        </Badge>
                        {rec.year && (
                          <Badge className="text-[8px] font-black uppercase tracking-widest bg-blue-500 text-white">
                            {rec.year}{rec.term ? ` | ${rec.term}` : ""}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {rec.timestamp}
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <h5 className="text-xs font-black text-slate-900 mt-1">{rec.title}</h5>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal bg-white p-2 rounded-lg border border-slate-100">{rec.details}</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 flex sm:justify-between items-center w-full gap-2">
            <div>
              {isTemporalModeActive && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] uppercase font-bold tracking-wider"
                  onClick={handleClearTemporalMode}
                >
                  Reset Active Filters
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              <Button 
                type="button" 
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleActivateTemporalMode}
              >
                {isTemporalModeActive ? "Update Active Filter" : "Activate Temporal Filter"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
