// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, ExternalLink, PlayCircle, FileText, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useHomeworkResources } from "@/hooks/useHomework";
import { useSubjects } from "@/hooks/useSubjects";
import { SearchableSelect } from "@/components/ui/searchable-select";

export const HomeworkResourcesTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data: subjects = [] } = useSubjects();
  const { data: resources = [], isLoading } = useHomeworkResources(selectedSubject);

  const subjectOptions = [
    { value: "all", label: "All Subjects" },
    ...subjects.map(s => ({ value: s.id, label: s.name }))
  ];

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search resources..." 
            className="pl-9 border-none shadow-none focus-visible:ring-0" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <SearchableSelect
            value={selectedSubject}
            onValueChange={setSelectedSubject}
            options={subjectOptions}
            placeholder="Filter Subject"
            className="bg-slate-50 border-none h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <CardDescription>No educational resources found.</CardDescription>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredResources.map((res) => (
            <Card key={res.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
                <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  {res.type === "video" ? <PlayCircle className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-blue-500" />}
                </div>
                <Badge variant="secondary" className="text-[9px] uppercase">{res.subject?.name}</Badge>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-sm font-black leading-tight line-clamp-2 mb-1">{res.title}</CardTitle>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-slate-500 font-medium">{res.size} • {res.source}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" asChild>
                    <a href={res.url || "#"} target="_blank" rel="noopener noreferrer">
                      {res.type === "video" ? <ExternalLink className="h-3.5 w-3.5" /> : <FileDown className="h-3.5 w-3.5" />}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-slate-900 text-white overflow-hidden border-none text-center md:text-left">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-black">Missing a resource?</h3>
            <p className="text-slate-400 text-sm">Teachers can upload supplementary materials, past papers, and video links to help learners study from home.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">
            Upload New Material
          </Button>
        </div>
      </Card>
    </div>
  );
};
