// @ts-nocheck
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, BookOpen, Star, Sparkles, Check, Loader2,
  Filter, RefreshCw, ArrowUpDown, ChevronDown, ChevronUp,
  BarChart3, Users, Award, BookMarked, Clock,
  QrCode, ExternalLink, GraduationCap, CalendarDays,
} from "lucide-react";
import { useQuranProgress, useAddQuranProgress, useMadrasaStats } from "@/hooks/useMadrasa";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import { SURAHS, formatSurahDisplay, getSurahByNumber } from "@/data/surahs";
import { cn } from "@/lib/utils";

const HIFDH_TYPES = [
  { value: "memorization", label: "Hifdh (Memorization)", icon: BookMarked },
  { value: "recitation", label: "Tilawah (Recitation)", icon: BookOpen },
  { value: "tajweed", label: "Tajweed (Pronunciation)", icon: Star },
  { value: "revision", label: "Muraja'ah (Revision)", icon: RefreshCw },
  { value: "samaa", label: "Samaa' (Listening)", icon: QrCode },
];

export const QuranTrackingTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("recorded_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: records = [], isLoading, refetch } = useQuranProgress();
  const { data: learners = [], isLoading: learnersLoading } = useLearners();
  const { data: stats } = useMadrasaStats();

  // Dialog state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<string>("");
  const [lastAyah, setLastAyah] = useState("");
  const [ayatCovered, setAyatCovered] = useState("");
  const [hifdhType, setHifdhType] = useState("memorization");
  const [juzNumber, setJuzNumber] = useState("");
  const [juzFrom, setJuzFrom] = useState("");
  const [juzTo, setJuzTo] = useState("");
  const [tajweedScore, setTajweedScore] = useState("10");
  const [makhrajScore, setMakhrajScore] = useState("10");
  const [hifdhStrength, setHifdhStrength] = useState("10");
  const [nextReviewDate, setNextReviewDate] = useState("");
  const [notes, setNotes] = useState("");

  const addProgress = useAddQuranProgress();

  const selectedSurah = useMemo(() => {
    if (!selectedSurahNumber) return null;
    return getSurahByNumber(parseInt(selectedSurahNumber));
  }, [selectedSurahNumber]);

  const surahOptions = useMemo(() => SURAHS.map(s => ({
    value: String(s.number),
    label: `${s.number}. ${s.name} (${s.arabicName}) — ${s.totalAyat} ayahs [Juz ${s.juz[0]}${s.juz.length > 1 ? `-${s.juz[s.juz.length - 1]}` : ''}]`,
    searchTerms: [s.name, s.arabicName, s.transliteration, String(s.number)],
  })), []);

  const learnerOptions = useMemo(() => learners.map(l => ({
    value: l.id,
    label: `${l.full_name}${l.class_name ? ` — ${l.class_name}` : ""}${l.admission_number ? ` (${l.admission_number})` : ""}`,
    searchTerms: [l.full_name, l.admission_number || "", l.class_name || ""],
  })), [learners]);

  const filtered = useMemo(() => {
    let result = [...records];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.learner?.full_name?.toLowerCase().includes(q) ||
        r.surah_name?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      result = result.filter(r => r.hifdh_type === filterType);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "learner") cmp = (a.learner?.full_name || "").localeCompare(b.learner?.full_name || "");
      else if (sortField === "surah") cmp = (a.surah_name || "").localeCompare(b.surah_name || "");
      else if (sortField === "tajweed") cmp = (a.tajweed_score || 0) - (b.tajweed_score || 0);
      else if (sortField === "last_ayah") cmp = (a.last_ayah || 0) - (b.last_ayah || 0);
      else cmp = new Date(a.recorded_at || 0).getTime() - new Date(b.recorded_at || 0).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [records, search, filterType, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLearnerId) {
      toast({ title: "Validation Error", description: "Please select a learner.", variant: "destructive" });
      return;
    }
    if (!selectedSurahNumber) {
      toast({ title: "Validation Error", description: "Please select a Surah.", variant: "destructive" });
      return;
    }
    if (!lastAyah || isNaN(parseInt(lastAyah))) {
      toast({ title: "Validation Error", description: "Please enter a valid Ayah number.", variant: "destructive" });
      return;
    }

    const surah = getSurahByNumber(parseInt(selectedSurahNumber));
    if (!surah) return;

    setLoading(true);
    addProgress.mutate({
      learner_id: selectedLearnerId,
      surah_name: surah.name,
      surah_number: surah.number,
      last_ayah: parseInt(lastAyah),
      ayat_covered: ayatCovered ? parseInt(ayatCovered) : undefined,
      juz_number: juzNumber ? parseInt(juzNumber) : surah.juz[0],
      juz_from: juzFrom ? parseInt(juzFrom) : undefined,
      juz_to: juzTo ? parseInt(juzTo) : undefined,
      hifdh_type: hifdhType,
      tajweed_score: parseInt(tajweedScore),
      makhraj_score: makhrajScore ? parseInt(makhrajScore) : undefined,
      hifdh_strength: hifdhStrength ? parseInt(hifdhStrength) : undefined,
      next_review_date: nextReviewDate || undefined,
      notes,
    }, {
      onSuccess: () => {
        supabase.from("learner_milestones").insert({
          learner_id: selectedLearnerId,
          milestone_type: "quran",
          title: `${surah.name} (${surah.arabicName}) — Ayah ${lastAyah}${ayatCovered ? ` (${ayatCovered} ayahs)` : ""}`,
          description: `${hifdhType === "memorization" ? "Memorized" : hifdhType === "recitation" ? "Recited" : hifdhType === "tajweed" ? "Practiced Tajweed of" : hifdhType === "revision" ? "Revised" : "Listened to"} up to Ayah ${lastAyah} of Surah ${surah.name} (Juz ${juzNumber || surah.juz[0]})${notes ? ` — ${notes}` : ""}`,
          achieved_date: format(new Date(), "yyyy-MM-dd"),
          notes,
        }).then(({ error }) => { if (error) console.error("Milestone error:", error); });

        toast({ title: "Quran Milestone Recorded", description: `${surah.name} — Ayah ${lastAyah} logged successfully.` });
        setSelectedLearnerId(""); setSelectedSurahNumber(""); setLastAyah(""); setAyatCovered("");
        setHifdhType("memorization"); setJuzNumber(""); setJuzFrom(""); setJuzTo("");
        setTajweedScore("10"); setMakhrajScore("10"); setHifdhStrength("10");
        setNextReviewDate(""); setNotes("");
        setIsRecordOpen(false);
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message || "Failed to save.", variant: "destructive" });
      },
      onSettled: () => setLoading(false),
    });
  };

  const SortHeader = ({ field, children, className }: { field: string; children: React.ReactNode; className?: string }) => (
    <TableHead className={cn("cursor-pointer select-none", className)} onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </div>
    </TableHead>
  );

  const hifdhTypeConfig = (type: string) => HIFDH_TYPES.find(t => t.value === type) || HIFDH_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Records", value: stats?.totalQuranRecords || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Learners", value: stats?.activeQuranLearners || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Akhlaaq", value: stats?.averageAkhlaaq || 0, icon: Star, color: "text-amber-600", bg: "bg-amber-50", suffix: "/5" },
          { label: "Salah Today", value: stats?.todaySalahEntries || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Milestones", value: stats?.totalMilestones || 0, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-black">{s.value}{s.suffix || ""}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search learner, surah, notes..." className="pl-10 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {HIFDH_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md" onClick={() => setIsRecordOpen(true)}>
            <Plus className="h-4 w-4" /> Record Milestone
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-700">
            <BookOpen className="h-5 w-5" /> Hifdh & Quran Progress
          </CardTitle>
          <CardDescription>Complete tracking of memorization, recitation, tajweed, and revision</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader field="learner">Learner</SortHeader>
                  <SortHeader field="surah">Surah</SortHeader>
                  <SortHeader field="last_ayah">Ayah</SortHeader>
                  <TableHead>Juz</TableHead>
                  <SortHeader field="tajweed">Tajweed</SortHeader>
                  <TableHead>Type</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Notes</TableHead>
                  <SortHeader field="recorded_at" className="text-right">Date</SortHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(9).fill(0).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium">No Quran progress records found</p>
                        <p className="text-xs">Click "Record Milestone" to begin tracking</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((record) => {
                    const typeCfg = hifdhTypeConfig(record.hifdh_type);
                    const TypeIcon = typeCfg.icon;
                    const surahInfo = getSurahByNumber(record.surah_number);
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                              {record.learner?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{record.learner?.full_name}</p>
                              <p className="text-[9px] text-muted-foreground">{record.learner?.admission_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{record.surah_name}</p>
                            {surahInfo && (
                              <p className="text-[9px] text-muted-foreground">{surahInfo.arabicName} · #{surahInfo.number}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold font-mono text-sm">{record.last_ayah}</span>
                          {record.ayat_covered && (
                            <span className="text-[9px] text-muted-foreground ml-1">({record.ayat_covered} ayahs)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            Juz {record.juz_number || (surahInfo?.juz[0] || "—")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`h-2.5 w-2.5 ${i <= Math.round((record.tajweed_score || 0) / 2) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                              ))}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-600">{record.tajweed_score}/10</span>
                          </div>
                          {record.makhraj_score && (
                            <p className="text-[8px] text-muted-foreground mt-0.5">Makhraj: {record.makhraj_score}/10</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[9px] py-0.5 capitalize flex items-center gap-1 w-fit">
                            <TypeIcon className="h-3 w-3" />
                            {typeCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{record.teacher?.full_name || "—"}</TableCell>
                        <TableCell className="max-w-[120px]">
                          <p className="text-[10px] text-muted-foreground truncate">{record.notes || "—"}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-xs font-medium">{record.recorded_at ? format(new Date(record.recorded_at), "MMM d") : "—"}</p>
                          <p className="text-[9px] text-muted-foreground">{record.recorded_at ? format(new Date(record.recorded_at), "HH:mm") : ""}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-3 border-t text-[10px] text-muted-foreground flex justify-between items-center">
            <span>{filtered.length} of {records.length} records</span>
            {records.length > 0 && (
              <span className="text-[9px]">
                Total Ayahs: {records.reduce((s, r) => s + (r.ayat_covered || 0), 0)} | Avg Tajweed: {(records.reduce((s, r) => s + (r.tajweed_score || 0), 0) / records.length).toFixed(1)}/10
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── DETAILED QURAN MILESTONE DIALOG ────────────────────── */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Record Qur'an Milestone
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Log academic and spiritual advancement of Madrasa pupils with detailed assessment
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProgress} className="space-y-5">

            {/* Section 1: Learner & Surah */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <GraduationCap className="h-4 w-4" /> Learner & Surah Selection
                <div className="flex-1 border-t border-dashed border-slate-200 mx-3" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Select Pupil <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  options={learnerOptions}
                  value={selectedLearnerId}
                  onValueChange={setSelectedLearnerId}
                  placeholder="Search and select learner..."
                  searchPlaceholder="Type name, admission #, or class..."
                  emptyText="No learners found"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Select Surah <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  options={surahOptions}
                  value={selectedSurahNumber}
                  onValueChange={(v) => {
                    setSelectedSurahNumber(v);
                    const surah = getSurahByNumber(parseInt(v));
                    if (surah) {
                      setJuzNumber(String(surah.juz[0]));
                    }
                  }}
                  placeholder="Search surah by name or number..."
                  searchPlaceholder="Type surah name or number..."
                  emptyText="No surah found"
                />
                {selectedSurah && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 mt-1">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {selectedSurah.number}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">{selectedSurah.name} <span className="text-indigo-600">{selectedSurah.arabicName}</span></p>
                      <p className="text-[10px] text-indigo-500">
                        {selectedSurah.totalAyat} ayahs · {selectedSurah.revelationType} · Juz {selectedSurah.juz.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Progress Details */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <BookMarked className="h-4 w-4" /> Progress Details
                <div className="flex-1 border-t border-dashed border-slate-200 mx-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Last Ayah Completed <span className="text-red-500">*</span></Label>
                  <Input
                    type="number" min="0"
                    placeholder={`Max: ${selectedSurah?.totalAyat || 286}`}
                    value={lastAyah}
                    onChange={(e) => setLastAyah(e.target.value)}
                  />
                  {selectedSurah && lastAyah && parseInt(lastAyah) > selectedSurah.totalAyat && (
                    <p className="text-[9px] text-red-500">Exceeds total ayahs ({selectedSurah.totalAyat})</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Ayat Covered This Session</Label>
                  <Input type="number" min="0" placeholder="e.g. 5" value={ayatCovered} onChange={(e) => setAyatCovered(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Learning Mode <span className="text-red-500">*</span></Label>
                  <Select value={hifdhType} onValueChange={setHifdhType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HIFDH_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Juz Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Juz Number</Label>
                  <Select value={juzNumber} onValueChange={setJuzNumber}>
                    <SelectTrigger><SelectValue placeholder="Select Juz" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Juz {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Juz From (if crossing)</Label>
                  <Select value={juzFrom} onValueChange={setJuzFrom}>
                    <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Juz {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Juz To (if crossing)</Label>
                  <Select value={juzTo} onValueChange={setJuzTo}>
                    <SelectTrigger><SelectValue placeholder="To" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Juz {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 3: Assessment Scores */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <Star className="h-4 w-4" /> Assessment Scores
                <div className="flex-1 border-t border-dashed border-slate-200 mx-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Tajweed Rules /10</Label>
                  <Select value={tajweedScore} onValueChange={setTajweedScore}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                        <SelectItem key={s} value={String(s)}>
                          {s} / 10 {s <= 3 ? "— Needs Improvement" : s <= 6 ? "— Developing" : s <= 8 ? "— Good" : "— Excellent"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Makhraj (Articulation) /10</Label>
                  <Select value={makhrajScore} onValueChange={setMakhrajScore}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                        <SelectItem key={s} value={String(s)}>{s} / 10</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Hifdh Strength /10</Label>
                  <Select value={hifdhStrength} onValueChange={setHifdhStrength}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                        <SelectItem key={s} value={String(s)}>{s} / 10 {s <= 3 ? "— Weak" : s <= 6 ? "— Fair" : s <= 8 ? "— Strong" : "— Solid"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Visual score summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Tajweed", value: parseInt(tajweedScore) },
                  { label: "Makhraj", value: parseInt(makhrajScore) },
                  { label: "Hifdh Strength", value: parseInt(hifdhStrength) },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-white border">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.label}</p>
                    <div className="flex justify-center gap-0.5 my-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={cn(
                          "h-2 w-5 rounded-sm",
                          i <= Math.round(s.value / 2) ? "bg-emerald-500" : "bg-slate-200"
                        )} />
                      ))}
                    </div>
                    <p className="text-xs font-bold">{s.value}/10</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Next Review Date</Label>
                <Input type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)} />
              </div>
            </div>

            {/* Section 4: Notes */}
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <BookOpen className="h-4 w-4" /> Teacher's Observations
                <div className="flex-1 border-t border-dashed border-slate-200 mx-3" />
              </div>
              <Textarea
                placeholder="Detailed feedback: pronunciation, fluency, memory strength, areas for improvement..."
                className="min-h-[80px] text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 border-t pt-4 sticky bottom-0 bg-white pb-1">
              <Button type="button" variant="outline" onClick={() => { setIsRecordOpen(false); setLoading(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || addProgress.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[200px]">
                {(loading || addProgress.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading || addProgress.isPending ? "Saving..." : "Record Quran Milestone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
