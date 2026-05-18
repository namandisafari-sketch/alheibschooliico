import { useState, useEffect } from "react";
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
  FolderOpen
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

export const HistoricalArchiveExplorer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTemporalModeActive, setIsTemporalModeActive] = useState(false);
  
  // Temporal Filters State
  const [academicYear, setAcademicYear] = useState<string>("all");
  const [academicTerm, setAcademicTerm] = useState<string>("all");
  const [exactDate, setExactDate] = useState<string>("");
  const [exactTime, setExactTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Results Simulation State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  // Load configuration from localstorage on mount
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
    
    // Refresh page to propagate temporal filters to queries
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
    setSearchResults(null);
    setIsOpen(false);
    
    toast.info("Cleared temporal archive mode. Showing current active school year.");
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSimulatedSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term first.");
      return;
    }

    setIsSearching(true);
    
    // Simulate query processing across multi-year archived relational database
    setTimeout(() => {
      const mockHistoricalRecords = [
        {
          id: "rec1",
          year: "2024",
          term: "Term 3",
          category: "Learner Bio-data",
          title: "KASUMBA HASHIM ADMISSION",
          timestamp: "2024-09-12 at 10:30 AM",
          details: "Registered into Primary 3. Fees paid: USh 450,000. Address: Buikwe District, Central Region."
        },
        {
          id: "rec2",
          year: "2024",
          term: "Term 2",
          category: "Academic Assessment",
          title: "Primary 3 End of Term Exam - Marks Summary",
          timestamp: "2024-08-04 at 02:15 PM",
          details: "Grade: A (Mathematics: 92%, English: 88%, Science: 85%). Registered by Class Teacher."
        },
        {
          id: "rec3",
          year: "2025",
          term: "Term 1",
          category: "Financial Receipt",
          title: "Fee Payment Voucher #2025-081",
          timestamp: "2025-02-18 at 09:00 AM",
          details: "Paid: USh 600,000 for Boarding Fee. Bank Ref: UBB-498273. Status: Cleared."
        },
        {
          id: "rec4",
          year: "2023",
          term: "Term 3",
          category: "Medical Log",
          title: "Sick Bay Incident #SB-892",
          timestamp: "2023-11-05 at 11:15 AM",
          details: "Treated for mild fever. Medication administered: Paracetamol 250mg. Approved by School Nurse."
        }
      ];

      // Filter based on search criteria
      const results = mockHistoricalRecords.filter(item => {
        // Query term matching
        const matchesQuery = 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.details.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Year filter matching
        const matchesYear = academicYear === "all" || item.year === academicYear;
        // Term filter matching
        const matchesTerm = academicTerm === "all" || item.term === academicTerm;
        
        // Exact Date filter matching (if provided)
        let matchesDate = true;
        if (exactDate) {
          const target = new Date(exactDate);
          const recordDate = new Date(item.timestamp.split(" at ")[0]);
          // Match if record is on or before exact date
          matchesDate = recordDate <= target;
        }

        return matchesQuery && matchesYear && matchesTerm && matchesDate;
      });

      setSearchResults(results);
      setIsSearching(false);
    }, 800);
  };

  return (
    <>
      {/* 1. Global Temporal Query Alert Banner (Shows at top if active) */}
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

      {/* 2. Header Explorer Trigger Button */}
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
              Query, search, and audit all school data (Students, Staff, Payments, Logs) across multiple academic years. Specify exact dates and times to view point-in-time database snapshots.
            </DialogDescription>
          </DialogHeader>

          {/* Temporal Parameters Grid */}
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Intake / Term</label>
              <Select value={academicTerm} onValueChange={setAcademicTerm}>
                <SelectTrigger className="h-9 bg-white text-xs">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="Term 1">Term 1 (First)</SelectItem>
                  <SelectItem value="Term 2">Term 2 (Second)</SelectItem>
                  <SelectItem value="Term 3">Term 3 (Third)</SelectItem>
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

          {/* Temporal Search Bar */}
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
                placeholder="Search students, staff, assessment registers, logs by exact date/time filters..."
                className="h-10 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSimulatedSearch();
                }}
              />
              <Button 
                onClick={handleSimulatedSearch} 
                disabled={isSearching}
                className="h-10 px-4 font-bold uppercase text-xs tracking-wider bg-slate-900 hover:bg-slate-800"
              >
                {isSearching ? "Searching..." : "Query Database"}
              </Button>
            </div>
          </div>

          {/* Search Results Display */}
          <div className="max-h-[220px] overflow-y-auto mt-2 space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Database className="h-6 w-6 text-primary animate-pulse" />
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 animate-pulse">Running temporal query lookup...</p>
              </div>
            ) : searchResults === null ? (
              <p className="text-[11px] text-muted-foreground text-center py-8">
                Enter your historical filters and search query above to browse previous years' directories.
              </p>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="text-[11px] font-bold text-slate-600">No Archives Found matching search filter</p>
                <p className="text-[10px] text-muted-foreground">Adjust your exact date/time, year filters, or search keywords.</p>
              </div>
            ) : (
              searchResults.map((rec) => (
                <Card key={rec.id} className="border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all">
                  <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-wider bg-slate-200 text-slate-800">
                        {rec.category}
                      </Badge>
                      <Badge className="text-[8px] font-black uppercase tracking-widest bg-blue-500 text-white">
                        {rec.year} | {rec.term}
                      </Badge>
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
              ))
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
