
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  GraduationCap, 
  Camera, 
  ClipboardCheck, 
  TrendingUp, 
  Users, 
  FileText,
  Search,
  Filter,
  AlertCircle,
  Download,
  Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { getPLEPoint, getDivision, PLE_BANDS } from "@/lib/grading";

const P7Mgt = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMock, setSelectedMock] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["p7-candidates"],
    queryFn: async () => {
      const { data: classData } = await supabase
        .from("classes")
        .select("id")
        .eq("name", "Primary Seven")
        .single();
      
      if (!classData) return [];

      const { data, error } = await supabase
        .from("learners")
        .select(`
          *,
          classes (name)
        `)
        .eq("class_id", classData.id);

      if (error) throw error;
      return data;
    }
  });

  const { data: mockTests = [] } = useQuery({
    queryKey: ["ple-mock-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ple_mock_tests")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: allResults = [] } = useQuery({
    queryKey: ["ple-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ple_results")
        .select("*");
      if (error) throw error;
      return data;
    }
  });

  const updateIndexNumber = useMutation({
    mutationFn: async ({ id, uneb_index_number }: { id: string; uneb_index_number: string }) => {
      const { error } = await supabase
        .from("learners")
        .update({ uneb_index_number })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p7-candidates"] });
      toast({ title: "Success", description: "Index number updated" });
    }
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `learner-photos/${id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('learners')
        .update({ photo_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p7-candidates"] });
      toast({ title: "Success", description: "Passport photo uploaded" });
    }
  });

  const filteredCandidates = candidates.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateMockResult = useMutation({
    mutationFn: async ({ learnerId, mockId, score }: { learnerId: string; mockId: string; score: number }) => {
      // Get current mock info to get subject
      const mock = mockTests.find(m => m.id === mockId);
      if (!mock) throw new Error("Mock test not found");

      const point = getPLEPoint(score);
      const grade = PLE_BANDS.find(b => score >= b.min)?.band.grade || "F9";

      // Upsert result
      const existing = allResults.find(r => r.learner_id === learnerId && r.mock_test_id === mockId);
      
      if (existing) {
        const { error } = await supabase
          .from("ple_results")
          .update({ score, grade })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ple_results")
          .insert({
            learner_id: learnerId,
            mock_test_id: mockId,
            score,
            grade
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ple-results"] });
    }
  });

  const stats = {
    total: candidates.length,
    missingPhotos: candidates.filter(c => !c.photo_url).length,
    missingNIN: candidates.filter(c => !c.nin).length,
    registered: candidates.filter(c => c.uneb_index_number).length
  };

  // Mock results processing
  const getCandidateMockResult = (candidateId: string, mockId: string | null) => {
    if (!mockId) return null;
    return allResults.find(r => r.learner_id === candidateId && r.mock_test_id === mockId);
  };

  return (
    <DashboardLayout title="P7 Candidate Management" subtitle="PLE Preparation & UNEB Registration Portal">
      <div className="space-y-6">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase">Total Candidates</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Missing Photos</p>
                <p className="text-2xl font-bold">{stats.missingPhotos}</p>
              </div>
              <Camera className="h-8 w-8 text-orange-200" />
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Registered UNEB</p>
                <p className="text-2xl font-bold">{stats.registered}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-200" />
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase">Perf. Average</p>
                <p className="text-2xl font-bold">Aggregate 14</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="uneb">UNEB Registration</TabsTrigger>
            <TabsTrigger value="mocks">Mock Results</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search candidates..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" /> Bulk Photos
                </Button>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export Register
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Photo</TableHead>
                      <TableHead>Candidate Name</TableHead>
                      <TableHead>ADM No.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index No.</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          Loading candidates...
                        </TableCell>
                      </TableRow>
                    ) : filteredCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No candidates found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCandidates.map((candidate) => (
                         <TableRow key={candidate.id}>
                           <TableCell>
                             <label className="relative cursor-pointer group">
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (file) uploadPhoto.mutate({ id: candidate.id, file });
                                 }}
                               />
                               <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border group-hover:ring-2 ring-primary transition-all">
                                 {candidate.photo_url ? (
                                   <img src={candidate.photo_url} alt="" className="h-full w-full object-cover" />
                                 ) : (
                                   <div className="h-full w-full flex items-center justify-center bg-muted">
                                     <Camera className="h-4 w-4 text-muted-foreground/50" />
                                   </div>
                                 )}
                                 <div className="absolute inset-0 bg-black/40 items-center justify-center hidden group-hover:flex">
                                    <Upload className="h-3 w-3 text-white" />
                                 </div>
                               </div>
                             </label>
                           </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p className="text-sm font-bold">{candidate.full_name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{candidate.gender}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{candidate.admission_number}</TableCell>
                          <TableCell>
                            <Badge variant={candidate.uneb_index_number ? "default" : "outline"} className="text-[10px]">
                              {candidate.uneb_index_number ? "Registered" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{candidate.uneb_index_number || "---"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uneb" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">UNEB Registration Details</CardTitle>
                <CardDescription>Management of LIN, NIN and Index numbers for candidates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                   <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>LIN Number</TableHead>
                          <TableHead>NIN Number</TableHead>
                          <TableHead>Birth Cert.</TableHead>
                          <TableHead>Index No.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredCandidates.map((candidate) => (
                           <TableRow key={candidate.id}>
                             <TableCell className="font-medium text-sm">{candidate.full_name}</TableCell>
                             <TableCell className="text-xs font-mono">{candidate.lin || "Missing"}</TableCell>
                             <TableCell className="text-xs font-mono">{candidate.nin || "Missing"}</TableCell>
                             <TableCell>
                               {candidate.nira_certificate_status === "available" ? (
                                 <Badge variant="success" className="bg-emerald-100 text-emerald-700">Verified</Badge>
                               ) : (
                                 <Badge variant="outline" className="text-orange-600 border-orange-200">Missing</Badge>
                               )}
                             </TableCell>
                             <TableCell>
                               <Input 
                                 className="h-8 w-[140px] font-mono text-xs" 
                                 defaultValue={candidate.uneb_index_number || ""}
                                 onBlur={(e) => {
                                   if (e.target.value !== candidate.uneb_index_number) {
                                     updateIndexNumber.mutate({ id: candidate.id, uneb_index_number: e.target.value });
                                   }
                                 }}
                                 placeholder="U0000/000"
                               />
                             </TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mocks" className="mt-6 space-y-6">
             <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-[200px] space-y-2">
                   <label className="text-xs font-bold uppercase text-muted-foreground">Select Mock Series</label>
                   <Select value={selectedMock || ""} onValueChange={setSelectedMock}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Mock" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTests.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.title} ({t.year})</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                   <Upload className="h-4 w-4" /> Import Excel
                </Button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                       <GraduationCap className="h-5 w-5 text-primary" />
                       Mock Marks Entry
                    </CardTitle>
                    <CardDescription>
                      {selectedMock ? "Entering results for selected mock" : "Please select a mock series first"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Candidate</TableHead>
                           <TableHead>Score</TableHead>
                           <TableHead>Points</TableHead>
                           <TableHead>Grade</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                          {!selectedMock ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                No mock selected
                              </TableCell>
                            </TableRow>
                          ) : filteredCandidates.map(c => {
                             const result = getCandidateMockResult(c.id, selectedMock);
                             return (
                               <TableRow key={c.id}>
                                  <TableCell className="font-medium text-sm">{c.full_name}</TableCell>
                                  <TableCell>
                                     <Input 
                                       className="h-8 w-16 text-center" 
                                       defaultValue={result?.score || ""}
                                       placeholder="--"
                                       type="number"
                                       onBlur={(e) => {
                                         const score = parseFloat(e.target.value);
                                         if (!isNaN(score) && score !== result?.score) {
                                           updateMockResult.mutate({ 
                                             learnerId: c.id, 
                                             mockId: selectedMock, 
                                             score 
                                           });
                                         }
                                       }}
                                     />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                     {result ? getPLEPoint(result.score) : "--"}
                                  </TableCell>
                                  <TableCell>
                                     {result ? (
                                       <Badge variant="outline" className="font-bold">
                                         {result.grade || "F9"}
                                       </Badge>
                                     ) : "--"}
                                  </TableCell>
                               </TableRow>
                             );
                          })}
                       </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                         <AlertCircle className="h-5 w-5 text-orange-500" />
                         Performance Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                         {["Division I", "Division II", "Division III", "Division IV", "Division U"].map((div, i) => (
                           <div key={div} className="flex items-center justify-between p-2 rounded border bg-card">
                              <span className="text-sm font-medium">{div}</span>
                              <Badge variant="secondary">0</Badge>
                           </div>
                         ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="predictions" className="mt-6">
             <Card>
                <CardHeader>
                   <CardTitle className="text-lg">Aggregate Prediction Model</CardTitle>
                   <CardDescription>Likely performance outcomes based on current academic trajectory</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                         <Table>
                            <TableHeader>
                               <TableRow>
                                  <TableHead>Candidate</TableHead>
                                  <TableHead>Mock Avg</TableHead>
                                  <TableHead>Predicted Agg</TableHead>
                                  <TableHead>Target Div</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {filteredCandidates.map(c => {
                                 const candidateResults = allResults.filter(r => r.learner_id === c.id);
                                 const avgScore = candidateResults.length > 0 
                                   ? candidateResults.reduce((acc, curr) => acc + curr.score, 0) / candidateResults.length 
                                   : null;
                                 
                                 // Simple logic: assume current average applies to all 4 subjects
                                 const predictedPoint = avgScore ? getPLEPoint(avgScore) : null;
                                 const predictedAgg = predictedPoint ? predictedPoint * 4 : null;
                                 const predictedDiv = predictedAgg ? getDivision(predictedAgg) : "Pending";

                                 return (
                                   <TableRow key={c.id}>
                                      <TableCell className="font-medium text-sm">{c.full_name}</TableCell>
                                      <TableCell className="text-xs">{avgScore ? avgScore.toFixed(1) + "%" : "--"}</TableCell>
                                      <TableCell className="font-bold text-primary">{predictedAgg || "--"}</TableCell>
                                      <TableCell>
                                         <Badge className={
                                           predictedDiv === "I" ? "bg-emerald-600" : 
                                           predictedDiv === "II" ? "bg-blue-600" : 
                                           "bg-slate-400"
                                         }>
                                           Division {predictedDiv}
                                         </Badge>
                                      </TableCell>
                                   </TableRow>
                                 );
                               })}
                            </TableBody>
                         </Table>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <h4 className="font-bold text-sm mb-2 text-primary">Projection Summary</h4>
                            <div className="space-y-2">
                               <div className="flex justify-between text-xs">
                                  <span>Division I:</span>
                                  <span className="font-bold">
                                    {filteredCandidates.filter(c => {
                                      const res = allResults.filter(r => r.learner_id === c.id);
                                      if (res.length === 0) return false;
                                      const avg = res.reduce((a, b) => a + b.score, 0) / res.length;
                                      return getDivision(getPLEPoint(avg) * 4) === "I";
                                    }).length} Candidates
                                  </span>
                               </div>
                               <div className="flex justify-between text-xs">
                                  <span>Division II:</span>
                                  <span className="font-bold">
                                    {filteredCandidates.filter(c => {
                                      const res = allResults.filter(r => r.learner_id === c.id);
                                      if (res.length === 0) return false;
                                      const avg = res.reduce((a, b) => a + b.score, 0) / res.length;
                                      return getDivision(getPLEPoint(avg) * 4) === "II";
                                    }).length} Candidates
                                  </span>
                               </div>
                            </div>
                         </div>
                         
                         <Button className="w-full gap-2">
                            <TrendingUp className="h-4 w-4" /> Export Report
                         </Button>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default P7Mgt;
