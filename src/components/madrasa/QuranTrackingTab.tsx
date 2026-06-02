// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, BookOpen, Star, Sparkles, Check } from "lucide-react";
import { useQuranProgress, useAddQuranProgress } from "@/hooks/useMadrasa";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const QuranTrackingTab = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data: records = [], isLoading, refetch } = useQuranProgress();
  const { data: learners = [], isLoading: learnersLoading } = useLearners();

  // Dialog & Form States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [surahName, setSurahName] = useState("");
  const [lastAyah, setLastAyah] = useState("");
  const [hifdhType, setHifdhType] = useState("memorization");
  const [tajweedScore, setTajweedScore] = useState("10");
  const [notes, setNotes] = useState("");

  const addProgress = useAddQuranProgress();

  const filtered = records.filter(r => 
    r.learner?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.surah_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLearnerId) {
      toast({
        title: "Validation Error",
        description: "Please select a learner.",
        variant: "destructive"
      });
      return;
    }

    if (!surahName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Surah name.",
        variant: "destructive"
      });
      return;
    }

    if (!lastAyah || isNaN(parseInt(lastAyah))) {
      toast({
        title: "Validation Error",
        description: "Please enter an Ayah number.",
        variant: "destructive"
      });
      return;
    }

    addProgress.mutate({
      learner_id: selectedLearnerId,
      surah_name: surahName.trim(),
      last_ayah: parseInt(lastAyah),
      hifdh_type: hifdhType,
      tajweed_score: parseInt(tajweedScore),
      notes: notes.trim()
    }, {
      onSuccess: () => {
        toast({
          title: "Quran progress recorded",
          description: "New learning milestone added successfully."
        });
        // Reset states
        setSelectedLearnerId("");
        setSurahName("");
        setLastAyah("");
        setHifdhType("memorization");
        setTajweedScore("10");
        setNotes("");
        setIsRecordOpen(false);
        refetch();
      },
      onError: (err) => {
        toast({
          title: "Error recording progress",
          description: err.message || "Failed to save Quran tracking record.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search learner or surah..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsRecordOpen(true)}>
          <Plus className="h-4 w-4" /> Record Progress
        </Button>
      </div>

      <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" /> Hifdh & Quran Progress
          </CardTitle>
          <CardDescription>Live logs showing memorization, recitation, and phonetic reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner Name</TableHead>
                  <TableHead>Current Surah</TableHead>
                  <TableHead>Last Ayah</TableHead>
                  <TableHead>Phonetic Score</TableHead>
                  <TableHead>Activity Mode</TableHead>
                  <TableHead>Learning Feedback</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No matching records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-semibold text-slate-900">{record.learner?.full_name}</TableCell>
                      <TableCell className="font-mono text-xs">{record.surah_name}</TableCell>
                      <TableCell className="font-bold">Ayah {record.last_ayah}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-bold font-mono text-xs text-amber-600">{record.tajweed_score}/10</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`h-3 w-3 ${i <= Math.round((record.tajweed_score || 0) / 2) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[10px] py-0.5">
                          {record.hifdh_type === "memorization" ? "Hifdh / Memorization" : record.hifdh_type === "recitation" ? "Tilawah / Recitation" : "Tajweed Practice"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">{record.notes || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.recorded_at ? format(new Date(record.recorded_at), "MMM d, HH:mm") : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Progress Dialog */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="max-w-md bg-white shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
              Record Qur'an Milestone
            </DialogTitle>
            <DialogDescription>
              Log academic and spiritual advancement of Madrasa pupils.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProgress} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Select Pupil</Label>
              <Select value={selectedLearnerId} onValueChange={setSelectedLearnerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chose learner..." />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[250px] overflow-y-auto">
                  {learnersLoading ? (
                    <SelectItem disabled>Loading pupils...</SelectItem>
                  ) : learners.length === 0 ? (
                    <SelectItem disabled>No registered pupils found</SelectItem>
                  ) : (
                    learners.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.full_name} {l.class_name ? `(${l.class_name})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Surah Name</Label>
                <Input 
                  placeholder="e.g. Al-Baqarah" 
                  value={surahName}
                  onChange={(e) => setSurahName(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Last Ayah Completed</Label>
                <Input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 25" 
                  value={lastAyah}
                  onChange={(e) => setLastAyah(e.target.value)}
                  className="h-10 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Learning Mode</Label>
                <Select value={hifdhType} onValueChange={setHifdhType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="memorization">Hifdh / Memorization</SelectItem>
                    <SelectItem value="recitation">Tilawah / Recitation</SelectItem>
                    <SelectItem value="tajweed">Tajweed Phonetics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Pronunciation / Tajweed Score</Label>
                <Select value={tajweedScore} onValueChange={setTajweedScore}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <SelectItem key={s} value={String(s)}>{s} / 10</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Teacher's Observations / Notes</Label>
              <textarea 
                className="w-full min-h-[70px] rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Write specific feedback on pronunciation style, flow or memory..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions footer */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={addProgress.isPending}
              >
                {addProgress.isPending ? "Recording Progress..." : "Record Milestone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
