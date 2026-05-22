// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Plus, Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useHomework } from "@/hooks/useHomework";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { format } from "date-fns";

export const ActiveHomeworkTab = () => {
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: assignments = [], isLoading } = useHomework({ 
    classId: selectedClass, 
    subjectId: selectedSubject 
  });

  const classOptions = [
    { value: "all", label: "All Classes" },
    ...classes.map(c => ({ value: c.id, label: c.name }))
  ];

  const subjectOptions = [
    { value: "all", label: "All Subjects" },
    ...subjects.map(s => ({ value: s.id, label: s.name }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Filter Class</label>
          <SearchableSelect 
            value={selectedClass} 
            onValueChange={setSelectedClass}
            options={classOptions}
            placeholder="Select Class"
            className="bg-white"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Filter Subject</label>
          <SearchableSelect 
            value={selectedSubject} 
            onValueChange={setSelectedSubject}
            options={subjectOptions}
            placeholder="Select Subject"
            className="bg-white"
          />
        </div>
        <div className="flex items-end">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" /> New Assignment
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <CardDescription>No homework assignments found for the selection.</CardDescription>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((hw) => (
            <Card key={hw.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="h-1.5 w-full bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 uppercase">{hw.id.slice(0, 8)}</Badge>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold">
                    {hw.subject?.name || "Subject"}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-black mt-2 tracking-tight">{hw.title}</CardTitle>
                <p className="text-xs text-slate-500 line-clamp-1">{hw.class?.name}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Clock className="h-4 w-4" />
                    Due: <span className="text-slate-900">
                      {hw.deadline ? format(new Date(hw.deadline), "PPP") : "No deadline"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-success font-black text-xs uppercase italic">
                    <CheckCircle2 className="h-4 w-4" />
                    {hw.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

