
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, FileText, CheckCircle, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useState } from "react";
import { useLearners } from "@/hooks/useLearners";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";

export const UploadHomeworkTab = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLearner, setSelectedLearner] = useState("");

  const { data: learners = [], isLoading: loadingLearners } = useLearners();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  const learnerOptions = learners.map(l => ({ value: l.id, label: l.full_name }));
  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));
  const subjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card className="p-6">
          <CardTitle className="mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Assignment Details
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Learner *</label>
              <SearchableSelect 
                value={selectedLearner}
                onValueChange={setSelectedLearner}
                options={learnerOptions}
                placeholder={loadingLearners ? "Loading..." : "Find Learner..."}
                disabled={loadingLearners}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Class *</label>
              <SearchableSelect 
                value={selectedClass}
                onValueChange={setSelectedClass}
                options={classOptions}
                placeholder="Select Class"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-500">Subject *</label>
              <SearchableSelect 
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                options={subjectOptions}
                placeholder="Select Subject"
              />
            </div>
          </div>
        </Card>

        <Card className="border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-10 text-center group hover:border-primary transition-all">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-lg mb-1 font-black">Scan Assignment Page</CardTitle>
          <CardDescription className="max-w-[250px] mb-6 text-xs text-slate-600">
            Take a clear photo of the handwritten work for AI analysis and archiving.
          </CardDescription>
          <div className="flex gap-3">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
              Open Camera
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8">
              <Upload className="h-4 w-4 mr-2" /> Upload File
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="flex flex-col p-6 border-primary/10 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">AI Analysis</CardTitle>
              <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <CardDescription className="text-[10px]">Last scan results</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs italic text-amber-900">
              "The handwriting suggests the learner understood the concept of long division but made a carry-over error in question 3."
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span>Handwriting Clarity</span>
                <span>85%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-success w-[85%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-3">
            <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-[10px] text-slate-400">No recent scans</p>
            </div>
          </CardContent>
          <Button variant="ghost" size="sm" className="mt-2 text-xs">View All Scans</Button>
        </Card>
      </div>
    </div>
  );
};

