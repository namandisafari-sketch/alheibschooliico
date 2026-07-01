// @ts-nocheck
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Star, MessageSquare, Plus, Search, Loader2, Users,
  TrendingUp, Award, AlertCircle, BarChart3, RefreshCw,
  Heart, ThumbsUp, Shield, BookHeart, HandMetal, Smile,
  CheckCircle2, Clock, ArrowUp, ArrowDown,
} from "lucide-react";
import { useAkhlaaqReports, useAddAkhlaaqReport, useMadrasaStats } from "@/hooks/useMadrasa";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TRAIT_CATEGORIES = [
  { value: "Honesty", label: "Honesty (Sidq)", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "Respect", label: "Respect (Ihtiram)", icon: ThumbsUp, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "Cleanliness", label: "Cleanliness (Tahara)", icon: Heart, color: "text-cyan-600", bg: "bg-cyan-50" },
  { value: "Punctuality", label: "Punctuality (Dabt)", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "Responsibility", label: "Responsibility (Mas'uliyyah)", icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
  { value: "Cooperation", label: "Cooperation (Ta'awun)", icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
  { value: "Kindness", label: "Kindness (Rifq)", icon: Smile, color: "text-rose-600", bg: "bg-rose-50" },
  { value: "Patience", label: "Patience (Sabr)", icon: Shield, color: "text-violet-600", bg: "bg-violet-50" },
  { value: "Gratitude", label: "Gratitude (Shukr)", icon: Heart, color: "text-orange-600", bg: "bg-orange-50" },
  { value: "Humility", label: "Humility (Tawadu)", icon: Award, color: "text-slate-600", bg: "bg-slate-50" },
  { value: "Dedication", label: "Dedication (Ikhlas)", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
  { value: "Other", label: "Other", icon: MessageSquare, color: "text-gray-600", bg: "bg-gray-50" },
];

const RATING_LABELS = [
  { value: 1, label: "1 — Poor", desc: "Needs significant improvement", emoji: "🔴" },
  { value: 2, label: "2 — Below Average", desc: "Requires attention and guidance", emoji: "🟠" },
  { value: 3, label: "3 — Average", desc: "Acceptable but can improve", emoji: "🟡" },
  { value: 4, label: "4 — Good", desc: "Consistently demonstrating the trait", emoji: "🟢" },
  { value: 5, label: "5 — Excellent", desc: "Exemplary role model", emoji: "⭐" },
];

const TERMS = [
  { value: "term_1", label: "Term 1" },
  { value: "term_2", label: "Term 2" },
  { value: "term_3", label: "Term 3" },
];

export const AkhlaaqReportingTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [filterTrait, setFilterTrait] = useState("all");

  const { data: reports = [], isLoading, refetch } = useAkhlaaqReports();
  const { data: learners = [] } = useLearners();
  const { data: stats } = useMadrasaStats();

  const addReport = useAddAkhlaaqReport();

  // Form state
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [rating, setRating] = useState("3");
  const [comments, setComments] = useState("");
  const [term, setTerm] = useState("term_1");

  const learnerOptions = useMemo(() => learners.map(l => ({
    value: l.id,
    label: `${l.full_name}${l.class_name ? ` — ${l.class_name}` : ""}${l.admission_number ? ` (${l.admission_number})` : ""}`,
    searchTerms: [l.full_name, l.admission_number || "", l.class_name || ""],
  })), [learners]);

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.learner?.full_name?.toLowerCase().includes(q) ||
        r.trait_category?.toLowerCase().includes(q) ||
        r.comments?.toLowerCase().includes(q)
      );
    }
    if (filterTrait !== "all") {
      result = result.filter(r => r.trait_category === filterTrait);
    }
    return result;
  }, [reports, search, filterTrait]);

  const aggregateByTrait = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    reports.forEach(r => {
      if (!map[r.trait_category]) map[r.trait_category] = { total: 0, count: 0 };
      map[r.trait_category].total += r.rating || 0;
      map[r.trait_category].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        avg: parseFloat((data.total / data.count).toFixed(1)),
        count: data.count,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [reports]);

  const handleSave = () => {
    if (!selectedLearnerId) {
      toast({ title: "Validation", description: "Please select a learner.", variant: "destructive" });
      return;
    }
    if (!selectedTrait) {
      toast({ title: "Validation", description: "Please select a character trait.", variant: "destructive" });
      return;
    }

    addReport.mutate({
      learner_id: selectedLearnerId,
      trait_category: selectedTrait,
      rating: parseInt(rating),
      comments,
      term,
      academic_year: new Date().getFullYear(),
    }, {
      onSuccess: () => {
        toast({ title: "Akhlaaq Report Saved", description: "Character assessment recorded successfully." });
        setSelectedLearnerId(""); setSelectedTrait(""); setRating("3"); setComments(""); setTerm("term_1");
        setIsRecordOpen(false);
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const getTraitIcon = (trait: string) => {
    const found = TRAIT_CATEGORIES.find(t => t.value === trait);
    return found || TRAIT_CATEGORIES[TRAIT_CATEGORIES.length - 1];
  };

  const overallAvg = reports.length > 0
    ? (reports.reduce((s, r) => s + (r.rating || 0), 0) / reports.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", value: reports.length, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Overall Avg", value: overallAvg, icon: Star, color: "text-amber-600", bg: "bg-amber-50", suffix: "/5" },
          { label: "Traits Tracked", value: aggregateByTrait.length, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Learners Assessed", value: new Set(reports.map(r => r.learner_id)).size, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search learner or trait..." className="pl-10 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={filterTrait} onValueChange={setFilterTrait}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="All Traits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Traits</SelectItem>
              {TRAIT_CATEGORIES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsRecordOpen(true)}>
            <Plus className="h-4 w-4" /> New Report
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trait Performance */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Trait Performance Analytics
            </CardTitle>
            <CardDescription>Average rating by character trait across all reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-12" /></div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : aggregateByTrait.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No reports yet.</p>
            ) : (
              aggregateByTrait.map((trait) => {
                const t = getTraitIcon(trait.name);
                const TraitIcon = t.icon;
                return (
                  <div key={trait.name} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", t.bg)}>
                          <TraitIcon className={cn("h-3 w-3", t.color)} />
                        </div>
                        <span className="text-xs font-medium">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold",
                          trait.avg >= 4 ? "text-emerald-600" : trait.avg >= 3 ? "text-amber-600" : "text-red-600"
                        )}>
                          {trait.avg} / 5
                        </span>
                        <span className="text-[9px] text-muted-foreground">({trait.count})</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          trait.avg >= 4 ? "bg-emerald-500" : trait.avg >= 3 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${(trait.avg / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Recent Reports
            </CardTitle>
            <CardDescription>Latest character assessments recorded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))
            ) : filteredReports.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No matching reports found.</p>
            ) : (
              filteredReports.slice(0, 8).map(r => {
                const t = getTraitIcon(r.trait_category);
                const TraitIcon = t.icon;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", t.bg)}>
                        <TraitIcon className={cn("h-4 w-4", t.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{r.learner?.full_name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{t.label}</span>
                          <span>·</span>
                          <span>{r.term?.replace("_", " ") || "—"}</span>
                          {r.comments && <><span>·</span><span className="truncate max-w-[80px]">{r.comments}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={cn(
                            "h-3 w-3",
                            i <= (r.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          )} />
                        ))}
                      </div>
                      <span className="text-xs font-bold ml-1">{r.rating}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── DETAILED AKHLAAQ REPORT DIALOG ──────────────────────── */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-2xl bg-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              New Akhlaaq (Character) Report
            </DialogTitle>
            <DialogDescription>
              Assess and record a learner's character trait with detailed scoring
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Learner */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Select Learner <span className="text-red-500">*</span></Label>
              <SearchableSelect
                options={learnerOptions}
                value={selectedLearnerId}
                onValueChange={setSelectedLearnerId}
                placeholder="Search and select learner..."
                searchPlaceholder="Type name, admission #, or class..."
                emptyText="No learners found"
              />
            </div>

            {/* Trait */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Character Trait <span className="text-red-500">*</span></Label>
              <Select value={selectedTrait} onValueChange={setSelectedTrait}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a character trait" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {TRAIT_CATEGORIES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className={cn("h-3.5 w-3.5", t.color)} />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const traitIcon = getTraitIcon(selectedTrait);
                const TraitIcon = traitIcon.icon;
                return (
                  <div className={cn("flex items-center gap-2 p-2 rounded-lg text-xs font-medium", traitIcon.bg, traitIcon.color)}>
                    <TraitIcon className="h-3.5 w-3.5" />
                    Assessing: {traitIcon.label}
                  </div>
                );
              })()}
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Rating <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {RATING_LABELS.map(r => (
                  <Button
                    key={r.value}
                    type="button"
                    variant={parseInt(rating) === r.value ? "default" : "outline"}
                    className={cn(
                      "flex-col h-auto py-3 gap-1 text-xs",
                      parseInt(rating) === r.value && (
                        r.value <= 2 ? "bg-red-500 hover:bg-red-600" :
                        r.value === 3 ? "bg-amber-500 hover:bg-amber-600" :
                        "bg-emerald-500 hover:bg-emerald-600"
                      )
                    )}
                    onClick={() => setRating(String(r.value))}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span className="font-bold">{r.value}</span>
                  </Button>
                ))}
              </div>
              {rating && (
                <p className="text-xs text-muted-foreground italic">
                  {RATING_LABELS.find(r => r.value === parseInt(rating))?.desc}
                </p>
              )}
            </div>

            {/* Term */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Teacher's Comments</Label>
              <Textarea
                placeholder="Provide specific observations, examples, and recommendations for improvement..."
                className="min-h-[80px]"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setIsRecordOpen(false)}>Cancel</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[160px]"
                onClick={handleSave}
                disabled={addReport.isPending}
              >
                {addReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Akhlaaq Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
