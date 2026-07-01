import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  useIPLECenterRegistration,
  useUpsertIPLECenter,
  useIPLECandidates,
  useRegisterIPLECandidate,
  useRemoveIPLECandidate,
  useIPLESubjectScores,
  useUpsertIPLEScore,
  useIPLEOralExams,
  useUpsertIPLEOralExam,
  useIPLEAggregatedResults,
  useLearnersWithoutIPLE,
  IPLE_BOARDS,
  IPLE_SUBJECTS,
  CURRICULUM_TRACKS,
  LETTER_GRADES,
} from "@/hooks/useIPLE";
import { useClasses } from "@/hooks/useClasses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  BookOpen,
  GraduationCap,
  ScrollText,
  Mic,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const IPLEHome = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: centers, isLoading: centersLoading } = useIPLECenterRegistration();
  const { data: candidates, isLoading: candidatesLoading } = useIPLECandidates();
  const { data: results, isLoading: resultsLoading } = useIPLEAggregatedResults();
  const { data: classes } = useClasses();

  const currentYear = new Date().getFullYear();
  const activeCenter = centers?.find((c) => c.is_active && c.registered_year === currentYear);
  const totalCandidates = candidates?.length || 0;
  const candidatesWithScores = results?.length || 0;

  return (
    <DashboardLayout title="IPLE Management" subtitle="Islamic Primary Leaving Examination">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-emerald-100 rounded-2xl bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Exam Center</p>
                <p className="text-xl font-black text-slate-900">
                  {activeCenter ? activeCenter.center_code : "Not Set"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-100 rounded-2xl bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Candidates</p>
                <p className="text-xl font-black text-slate-900">{totalCandidates}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-100 rounded-2xl bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                <ScrollText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Scored</p>
                <p className="text-xl font-black text-slate-900">{candidatesWithScores}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-100 rounded-2xl bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Academic Year</p>
                <p className="text-xl font-black text-slate-900">{currentYear}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="rounded-2xl bg-slate-100 p-1 gap-0">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:shadow-sm gap-2">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="center" className="rounded-xl data-[state=active]:shadow-sm gap-2">
              <Building2 className="h-4 w-4" /> Exam Center
            </TabsTrigger>
            <TabsTrigger value="candidates" className="rounded-xl data-[state=active]:shadow-sm gap-2">
              <Users className="h-4 w-4" /> Candidates
            </TabsTrigger>
            <TabsTrigger value="oral" className="rounded-xl data-[state=active]:shadow-sm gap-2">
              <Mic className="h-4 w-4" /> Oral Exams
            </TabsTrigger>
            <TabsTrigger value="results" className="rounded-xl data-[state=active]:shadow-sm gap-2">
              <ScrollText className="h-4 w-4" /> Results
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <IPLEOverview
              activeCenter={activeCenter}
              totalCandidates={totalCandidates}
              candidatesWithScores={candidatesWithScores}
              results={results}
            />
          </TabsContent>

          {/* Exam Center Tab */}
          <TabsContent value="center">
            <IPLECenterSettings center={activeCenter} />
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates">
            <IPLECandidatesTab candidates={candidates} loading={candidatesLoading} classes={classes} />
          </TabsContent>

          {/* Oral Exams Tab */}
          <TabsContent value="oral">
            <IPLEOralExamsTab />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <IPLEResultsTab results={results} loading={resultsLoading} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function IPLEOverview({ activeCenter, totalCandidates, candidatesWithScores, results }) {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-2 border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            IPLE at a Glance
          </CardTitle>
          <CardDescription>
            Your school's Islamic Primary Leaving Examination (IPLE) management overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeCenter && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">No Exam Center Registered</p>
                <p className="text-xs text-amber-700 mt-1">
                  Go to the Exam Center tab to register your school as an IPLE examination center with UMSC or UQSA.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-5 border border-indigo-100">
              <h4 className="text-sm font-black text-indigo-800 mb-2">The Four Core Subjects</h4>
              <div className="space-y-2">
                {IPLE_SUBJECTS.map((subj) => (
                  <div key={subj.value} className="flex items-center gap-2 text-sm text-indigo-700">
                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span className="font-semibold">{subj.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 border border-emerald-100">
              <h4 className="text-sm font-black text-emerald-800 mb-2">Curriculum Tracks</h4>
              <div className="space-y-2">
                {CURRICULUM_TRACKS.map((track) => (
                  <div key={track.value} className="flex items-center gap-2 text-sm text-emerald-700">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold">{track.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && results.length > 0 && (
        <Card className="rounded-2xl border-2 border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-black">Top Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead className="text-right">Aggregate</TableHead>
                  <TableHead className="text-right">Passed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.slice(0, 10).map((r, i) => (
                  <TableRow key={r.candidate_id}>
                    <TableCell className="font-black">{i + 1}</TableCell>
                    <TableCell className="font-bold">{r.learner_name}</TableCell>
                    <TableCell className="text-slate-500">{r.class_name}</TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">{r.registration_number}</TableCell>
                    <TableCell className="text-right font-black">{r.aggregate_score}</TableCell>
                    <TableCell className="text-right">{r.passed_subjects} / 4</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IPLECenterSettings({ center }) {
  const upsertCenter = useUpsertIPLECenter();
  const [board, setBoard] = useState(center?.board || "umsc");
  const [centerCode, setCenterCode] = useState(center?.center_code || "");
  const [centerName, setCenterName] = useState(center?.center_name || "");
  const [policeStation, setPoliceStation] = useState(center?.police_station || "");
  const [affiliationBody, setAffiliationBody] = useState(center?.affiliation_body || "");

  const handleSave = async () => {
    if (!centerCode || !centerName) {
      toast.error("Center code and name are required");
      return;
    }
    await upsertCenter.mutateAsync({
      board,
      center_code: centerCode,
      center_name: centerName,
      police_station: policeStation || null,
      affiliation_body: affiliationBody || null,
      registered_year: new Date().getFullYear(),
      is_active: true,
    });
    toast.success("Exam center registered successfully");
  };

  return (
    <Card className="rounded-2xl border-2 border-slate-100">
      <CardHeader>
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Exam Center Registration
        </CardTitle>
        <CardDescription>
          Register your school as an IPLE examination center with UMSC or UQSA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Examining Board</Label>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger className="rounded-xl border-2 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IPLE_BOARDS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Center Code</Label>
            <Input
              value={centerCode}
              onChange={(e) => setCenterCode(e.target.value.toUpperCase())}
              placeholder="e.g., UMSC-001"
              className="rounded-xl border-2 border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Center Name (School Name)</Label>
            <Input
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              placeholder="Your school name"
              className="rounded-xl border-2 border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Affiliation Body / Link</Label>
            <Input
              value={affiliationBody}
              onChange={(e) => setAffiliationBody(e.target.value)}
              placeholder="e.g., Link of Islamic Schools"
              className="rounded-xl border-2 border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Local Police Station (Exam Security)</Label>
            <Input
              value={policeStation}
              onChange={(e) => setPoliceStation(e.target.value)}
              placeholder="e.g., Central Police Station"
              className="rounded-xl border-2 border-slate-200"
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={upsertCenter.isPending}
          className="gap-2 rounded-xl"
        >
          {upsertCenter.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {center ? "Update Registration" : "Register Center"}
        </Button>
      </CardContent>
    </Card>
  );
}

function IPLECandidatesTab({ candidates, loading, classes }) {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedLearner, setSelectedLearner] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const registerCandidate = useRegisterIPLECandidate();
  const removeCandidate = useRemoveIPLECandidate();
  const { data: learnersWithoutIPLE } = useLearnersWithoutIPLE(selectedClass || undefined);

  const handleRegister = async () => {
    if (!selectedLearner || !regNumber) {
      toast.error("Select a learner and provide a registration number");
      return;
    }
    await registerCandidate.mutateAsync({
      learner_id: selectedLearner,
      registration_number: regNumber.toUpperCase(),
      academic_year: new Date().getFullYear(),
      board: "umsc",
    });
    toast.success("Candidate registered for IPLE");
    setOpen(false);
    setSelectedLearner("");
    setRegNumber("");
  };

  return (
    <Card className="rounded-2xl border-2 border-slate-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Users className="h-5 w-5" />
            IPLE Candidates
          </CardTitle>
          <CardDescription>Students registered for the IPLE track</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Register Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Register IPLE Candidate
              </DialogTitle>
              <DialogDescription>
                Register a learner for the Islamic Primary Leaving Examination track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedLearner(""); }}>
                  <SelectTrigger className="rounded-xl border-2 border-slate-200">
                    <SelectValue placeholder="Filter by class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Learner</Label>
                <Select value={selectedLearner} onValueChange={setSelectedLearner}>
                  <SelectTrigger className="rounded-xl border-2 border-slate-200">
                    <SelectValue placeholder="Select learner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {learnersWithoutIPLE?.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.full_name} {l.admission_number ? `(${l.admission_number})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>IPLE Registration Number</Label>
                <Input
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., IPLE-2026-001"
                  className="rounded-xl border-2 border-slate-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleRegister} disabled={registerCandidate.isPending} className="gap-2 rounded-xl">
                {registerCandidate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Register
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !candidates || candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No candidates registered yet</p>
            <p className="text-xs text-slate-400 mt-1">Register learners who are on the IPLE track</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration #</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-bold">{c.registration_number}</TableCell>
                  <TableCell className="font-bold">{c.learner?.full_name}</TableCell>
                  <TableCell className="text-slate-500">{c.learner?.classes?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-xs">{c.board}</Badge>
                  </TableCell>
                  <TableCell>{c.academic_year}</TableCell>
                  <TableCell>
                    <Badge className={c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (confirm("Remove this candidate?")) {
                          await removeCandidate.mutateAsync(c.id);
                          toast.success("Candidate removed");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function IPLEOralExamsTab() {
  const { data: oralExams, isLoading } = useIPLEOralExams();
  const upsertExam = useUpsertIPLEOralExam();
  const { data: candidates } = useIPLECandidates();
  const [open, setOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [fluency, setFluency] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [comprehension, setComprehension] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!selectedCandidate || !selectedSubject || !examDate) {
      toast.error("Fill all required fields");
      return;
    }
    await upsertExam.mutateAsync({
      candidate_id: selectedCandidate,
      subject: selectedSubject,
      exam_date: examDate,
      fluency_score: fluency ? parseFloat(fluency) : undefined,
      accuracy_score: accuracy ? parseFloat(accuracy) : undefined,
      comprehension_score: comprehension ? parseFloat(comprehension) : undefined,
      examiner_notes: notes || undefined,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    toast.success("Oral exam recorded");
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCandidate("");
    setSelectedSubject("");
    setFluency("");
    setAccuracy("");
    setComprehension("");
    setNotes("");
  };

  const findCandidateName = (id: string) =>
    candidates?.find((c) => c.id === id)?.learner?.full_name || id;

  return (
    <Card className="rounded-2xl border-2 border-slate-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Oral Examinations
          </CardTitle>
          <CardDescription>Track Quran recitation, Arabic fluency, and oral assessments</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Record Oral Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Oral Examination</DialogTitle>
              <DialogDescription>Assess recitation fluency, accuracy, and comprehension</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Candidate</Label>
                <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                  <SelectTrigger className="rounded-xl border-2 border-slate-200">
                    <SelectValue placeholder="Select candidate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.learner?.full_name} ({c.registration_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="rounded-xl border-2 border-slate-200">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {IPLE_SUBJECTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Date</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
                  className="rounded-xl border-2 border-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Fluency (0-100)</Label>
                  <Input type="number" min="0" max="100" value={fluency} onChange={(e) => setFluency(e.target.value)}
                    className="rounded-xl border-2 border-slate-200" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Accuracy (0-100)</Label>
                  <Input type="number" min="0" max="100" value={accuracy} onChange={(e) => setAccuracy(e.target.value)}
                    className="rounded-xl border-2 border-slate-200" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Comprehension (0-100)</Label>
                  <Input type="number" min="0" max="100" value={comprehension} onChange={(e) => setComprehension(e.target.value)}
                    className="rounded-xl border-2 border-slate-200" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Examiner Notes</Label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm min-h-[80px]"
                  placeholder="Observations, recitation quality, areas for improvement..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={upsertExam.isPending} className="gap-2 rounded-xl">
                {upsertExam.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !oralExams || oralExams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Mic className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No oral exams recorded</p>
            <p className="text-xs text-slate-400 mt-1">Start assessing candidates' recitation and fluency</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Fluency</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Comprehension</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oralExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.exam_date}</TableCell>
                  <TableCell className="font-bold">{findCandidateName(exam.candidate_id)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{exam.subject}</Badge></TableCell>
                  <TableCell>{exam.fluency_score ?? "-"}</TableCell>
                  <TableCell>{exam.accuracy_score ?? "-"}</TableCell>
                  <TableCell>{exam.comprehension_score ?? "-"}</TableCell>
                  <TableCell className="font-black">{exam.total_score ?? "-"}</TableCell>
                  <TableCell>
                    <Badge className={
                      exam.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      exam.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }>
                      {exam.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function IPLEResultsTab({ results, loading, userId }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const { data: scores, isLoading: scoresLoading } = useIPLESubjectScores(selectedCandidateId || undefined);
  const upsertScore = useUpsertIPLEScore();
  const { data: candidates } = useIPLECandidates();

  const selectedCandidate = candidates?.find((c) => c.id === selectedCandidateId);

  return (
    <div className="space-y-6">
      {/* Aggregated Results */}
      <Card className="rounded-2xl border-2 border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Aggregated Results
          </CardTitle>
          <CardDescription>Overall IPLE performance summary</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !results || results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">No results yet</p>
              <p className="text-xs text-slate-400 mt-1">Enter subject scores for candidates to see aggregated results</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Reg Number</TableHead>
                  <TableHead className="text-right">Quran</TableHead>
                  <TableHead className="text-right">Fiqh</TableHead>
                  <TableHead className="text-right">Arabic</TableHead>
                  <TableHead className="text-right">Tarbia</TableHead>
                  <TableHead className="text-right">Aggregate</TableHead>
                  <TableHead className="text-right">Passed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => {
                  const scores = r.subject_scores || {};
                  return (
                    <TableRow
                      key={r.candidate_id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedCandidateId(r.candidate_id)}
                    >
                      <TableCell className="font-black">{i + 1}</TableCell>
                      <TableCell className="font-bold">{r.learner_name}</TableCell>
                      <TableCell className="text-slate-500">{r.class_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">{r.registration_number}</TableCell>
                      <TableCell className="text-right font-medium">{scores.quran?.letter_grade || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{scores.fiqh?.letter_grade || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{scores.arabic?.letter_grade || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{scores.tarbia?.letter_grade || "-"}</TableCell>
                      <TableCell className="text-right font-black">{r.aggregate_score || "-"}</TableCell>
                      <TableCell className="text-right">{r.passed_subjects} / 4</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Per-Candidate Score Entry */}
      {selectedCandidateId && selectedCandidate && (
        <Card className="rounded-2xl border-2 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">
                {selectedCandidate.learner?.full_name}
              </CardTitle>
              <CardDescription>
                {selectedCandidate.registration_number} — Enter subject scores
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setSelectedCandidateId(null)} className="rounded-xl">
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {IPLE_SUBJECTS.map((subj) => {
                const existing = Array.isArray(scores) ? scores.find((s) => s.subject === subj.value) : null;
                return (
                  <div key={subj.value} className="rounded-2xl border-2 border-slate-100 p-4 space-y-3">
                    <h4 className="text-sm font-black capitalize flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      {subj.label}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Written Score (0-100)</Label>
                        <Input
                          type="number" min="0" max="100" defaultValue={existing?.written_score ?? ""}
                          className="rounded-xl border-2 border-slate-200 mt-1"
                          id={`written-${subj.value}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Oral Score (0-100)</Label>
                        <Input
                          type="number" min="0" max="100" defaultValue={existing?.oral_score ?? ""}
                          className="rounded-xl border-2 border-slate-200 mt-1"
                          id={`oral-${subj.value}`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Letter Grade</Label>
                      <Select defaultValue={existing?.letter_grade || ""}>
                        <SelectTrigger className="rounded-xl border-2 border-slate-200 mt-1" id={`grade-${subj.value}`}>
                          <SelectValue placeholder="Grade..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LETTER_GRADES.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2 rounded-xl mt-2"
                      onClick={async () => {
                        const written = parseFloat((document.getElementById(`written-${subj.value}`) as HTMLInputElement)?.value) || undefined;
                        const oral = parseFloat((document.getElementById(`oral-${subj.value}`) as HTMLInputElement)?.value) || undefined;
                        const letterGrade = (document.querySelector(`#grade-${subj.value} [role=combobox]`) as HTMLElement)?.textContent || undefined;
                        await upsertScore.mutateAsync({
                          candidate_id: selectedCandidateId,
                          subject: subj.value,
                          written_score: isNaN(written) ? undefined : written,
                          oral_score: isNaN(oral) ? undefined : oral,
                          letter_grade: letterGrade || undefined,
                          assessed_by: userId,
                        });
                        toast.success(`${subj.label} score saved`);
                      }}
                    >
                      {upsertScore.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save Score
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IPLEHome;
