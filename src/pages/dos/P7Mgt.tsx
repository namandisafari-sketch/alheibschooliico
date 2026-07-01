// @ts-nocheck

import { useState, useRef, type ChangeEvent } from "react";
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

  const { data: p7Classes = [], isLoading: isLoadingP7Classes } = useQuery({
    queryKey: ["p7-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("level", 7);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["p7-candidates", p7Classes.map((c) => c.id)],
    enabled: p7Classes.length > 0,
    queryFn: async () => {
      const classIds = p7Classes.map((c) => c.id);
      const { data, error } = await supabase
        .from("learners")
        .select(`
          *,
          classes (name)
        `)
        .in("class_id", classIds)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = isLoadingP7Classes || isLoadingCandidates;

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

  const currentYear = new Date().getFullYear();
  const { data: historicalResults = [] } = useQuery({
    queryKey: ["p7-historical-results", candidates.map((c) => c.id)],
    enabled: candidates.length > 0,
    queryFn: async () => {
      const learnerIds = candidates.map((c) => c.id);
      const { data, error } = await supabase
        .from("term_results")
        .select("*")
        .in("learner_id", learnerIds)
        .gte("academic_year", currentYear - 2);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: p7CurriculumPlans = [] } = useQuery({
    queryKey: ["p7-curriculum-plans", p7Classes.map((c) => c.id)],
    enabled: p7Classes.length > 0,
    queryFn: async () => {
      const classIds = p7Classes.map((c) => c.id);
      const { data, error } = await supabase
        .from("curriculum_plans")
        .select("id, topic_title, subject_id, syllabus_coverage(*)")
        .in("class_id", classIds);
      if (error) throw error;
      return data || [];
    },
  });

  const getCandidateHistory = (candidateId: string) =>
    historicalResults.filter(
      (result) => result.learner_id === candidateId && typeof result.score === "number"
    );

  const getCandidateAverage = (candidateId: string) => {
    const scores = getCandidateHistory(candidateId).map((result) => result.score as number);
    if (!scores.length) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const getCandidateTrend = (candidateId: string) => {
    const byYear = getCandidateHistory(candidateId).reduce<Record<number, number[]>>((acc, result) => {
      const year = result.academic_year || currentYear;
      if (!acc[year]) acc[year] = [];
      acc[year].push(result.score as number);
      return acc;
    }, {});
    const years = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);
    if (years.length < 2) return "Stable";
    const latest = byYear[years[years.length - 1]].reduce((a, b) => a + b, 0) / byYear[years[years.length - 1]].length;
    const previous = byYear[years[years.length - 2]].reduce((a, b) => a + b, 0) / byYear[years[years.length - 2]].length;
    if (latest >= previous + 5) return "Improving";
    if (latest <= previous - 5) return "Declining";
    return "Stable";
  };

  const getCandidatePrediction = (candidateId: string) => {
    const avg = getCandidateAverage(candidateId);
    if (avg === null) return { grade: "Pending", division: "U", score: null };
    const point = getPLEPoint(avg);
    return {
      grade: PLE_BANDS.find((band) => avg >= band.min)?.band.grade || "F9",
      division: getDivision(point * 4),
      score: avg,
    };
  };

  const completedCoverage = p7CurriculumPlans.filter(
    (plan) => plan.syllabus_coverage?.[0]?.status === "completed"
  ).length;
  const syllabusCoveragePercent = p7CurriculumPlans.length
    ? Math.round((completedCoverage / p7CurriculumPlans.length) * 100)
    : 0;

  const overallHistoricalScores = historicalResults
    .filter((result) => typeof result.score === "number")
    .map((result) => result.score as number);
  const overallHistoricalAverage = overallHistoricalScores.length
    ? Math.round(overallHistoricalScores.reduce((sum, score) => sum + score, 0) / overallHistoricalScores.length)
    : null;

  const atRiskCount = candidates.filter((candidate) => {
    const avg = getCandidateAverage(candidate.id);
    return avg === null || avg < 55;
  }).length;

  const stats = {
    total: candidates.length,
    missingPhotos: candidates.filter((c) => !c.photo_url).length,
    missingNIN: candidates.filter((c) => !c.nin).length,
    registered: candidates.filter((c) => c.uneb_index_number).length,
    syllabusCoveragePercent,
    overallHistoricalAverage,
    atRiskCount,
  };

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
    },
  });

  // Mock results processing
  const getCandidateMockResult = (candidateId: string, mockId: string | null) => {
    if (!mockId) return null;
    return allResults.find((r) => r.learner_id === candidateId && r.mock_test_id === mockId);
  };

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

  const bulkPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const handleBulkPhotosClick = () => {
    bulkPhotoInputRef.current?.click();
  };

  const handleBulkPhotosUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const normalizeKey = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const lookup = new Map<string, any>();
    candidates.forEach((candidate) => {
      if (candidate.admission_number) {
        lookup.set(normalizeKey(candidate.admission_number), candidate);
      }
      if (candidate.full_name) {
        lookup.set(normalizeKey(candidate.full_name), candidate);
      }
      lookup.set(normalizeKey(candidate.id), candidate);
    });

    const results = await Promise.all(files.map(async (file) => {
      const nameKey = normalizeKey(file.name.replace(/\.[^/.]+$/, ""));
      const candidate = lookup.get(nameKey);
      if (!candidate) {
        return { file: file.name, success: false, error: "No matching learner found by file name" };
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `learner-photos/${candidate.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      if (uploadError) {
        return { file: file.name, success: false, error: uploadError.message || "Upload failed" };
      }

      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      if (publicUrlError) {
        return { file: file.name, success: false, error: publicUrlError.message || "Public URL creation failed" };
      }

      const publicUrl = publicUrlData.publicUrl;
      const { error: updateError } = await supabase
        .from('learners')
        .update({ photo_url: publicUrl })
        .eq('id', candidate.id);
      if (updateError) {
        return { file: file.name, success: false, error: updateError.message || "Learner update failed" };
      }

      return { file: file.name, success: true };
    }));

    const successful = results.filter((result) => result.success).length;
    const failed = results.length - successful;
    if (successful > 0) {
      queryClient.invalidateQueries({ queryKey: ["p7-candidates"] });
    }

    toast({
      title: successful > 0 ? "Bulk photo upload complete" : "Bulk photo upload failed",
      description: successful > 0
        ? `${successful} photo${successful === 1 ? "" : "s"} uploaded successfully${failed ? `, ${failed} failed` : ""}.`
        : results.map((result) => `${result.file}: ${result.error}`).join("; "),
      variant: failed === results.length ? "destructive" : undefined,
    });
    event.target.value = "";
  };

  const handleExportRegister = () => {
    const rows = filteredCandidates.map((candidate) => {
      const avg = getCandidateAverage(candidate.id);
      const prediction = getCandidatePrediction(candidate.id);
      return {
        name: candidate.full_name || "",
        admission_number: candidate.admission_number || "",
        class_name: candidate.classes?.name || "",
        status: candidate.status || "",
        lin: candidate.lin || "",
        nin: candidate.nin || "",
        index_number: candidate.uneb_index_number || "",
        historical_average: avg !== null ? avg.toFixed(1) : "",
        trend: getCandidateTrend(candidate.id),
        predicted_division: prediction.division,
        predicted_grade: prediction.grade,
        photo_url: candidate.photo_url || "",
      };
    });

    const headers = [
      "Name",
      "Admission Number",
      "Class",
      "Status",
      "LIN",
      "NIN",
      "Index Number",
      "Historical Average",
      "Trend",
      "Predicted Division",
      "Predicted Grade",
      "Photo URL",
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.name,
          row.admission_number,
          row.class_name,
          row.status,
          row.lin,
          row.nin,
          row.index_number,
          row.historical_average,
          row.trend,
          row.predicted_division,
          row.predicted_grade,
          row.photo_url,
        ]
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `p7-register-${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Export started", description: "The P7 register CSV is downloading." });
  };

  const predictionYears = Array.from(
    new Set(
      historicalResults
        .filter((result) => typeof result.academic_year === "number")
        .map((result) => result.academic_year as number)
    )
  )
    .sort((a, b) => b - a)
    .slice(0, 4);

  const getCandidateYearlyPerformance = (candidateId: string) =>
    predictionYears.map((year) => {
      const scores = historicalResults
        .filter(
          (result) =>
            result.learner_id === candidateId &&
            result.academic_year === year &&
            typeof result.score === "number"
        )
        .map((result) => result.score as number);

      return {
        year,
        average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      };
    });

  const termOrder: Record<string, number> = {
    term_1: 1,
    term_2: 2,
    term_3: 3,
  };

  const getCandidateTermPerformance = (candidateId: string) => {
    const grouped = new Map<string, { year: number; term: string; scores: number[] }>();

    historicalResults.forEach((result) => {
      if (
        result.learner_id !== candidateId ||
        typeof result.score !== "number" ||
        !result.term ||
        typeof result.academic_year !== "number"
      ) {
        return;
      }

      const key = `${result.academic_year}_${result.term}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.scores.push(result.score as number);
      } else {
        grouped.set(key, { year: result.academic_year, term: result.term, scores: [result.score as number] });
      }
    });

    return Array.from(grouped.values())
      .map((entry) => ({
        year: entry.year,
        term: entry.term,
        average:
          entry.scores.length > 0
            ? Math.round(entry.scores.reduce((sum, score) => sum + score, 0) / entry.scores.length)
            : null,
      }))
      .sort((a, b) =>
        a.year === b.year ? (termOrder[a.term] || 0) - (termOrder[b.term] || 0) : a.year - b.year
      );
  };

  const divisionBadgeClass = (division: string) => {
    switch (division) {
      case "I":
        return "bg-emerald-600 text-white";
      case "II":
        return "bg-sky-600 text-white";
      case "III":
        return "bg-amber-500 text-slate-900";
      case "IV":
        return "bg-orange-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const handleExportPredictions = async () => {
    if (!filteredCandidates.length) {
      toast({ title: "No candidates", description: "There are no candidates to export.", variant: "destructive" });
      return;
    }

    try {
      const jsPDFModule = await import("jspdf");
      const jsPDFConstructor =
        jsPDFModule.default?.jsPDF || jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;

      const doc = new jsPDFConstructor("p", "mm", "a4");
      const margin = 15;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      const formatTermLabel = (term: string) => {
        if (term === "term_1") return "Term I";
        if (term === "term_2") return "Term II";
        if (term === "term_3") return "Term III";
        return term.replace(/_/g, " ");
      };

      const getScoreBadgeColor = (score: number | null) => {
        if (score === null) return [200, 200, 200];
        if (score >= 80) return [22, 163, 74];
        if (score >= 65) return [37, 99, 235];
        if (score >= 50) return [234, 179, 8];
        return [239, 68, 68];
      };

      filteredCandidates.forEach((candidate, index) => {
        if (index > 0) {
          doc.addPage();
          y = 18;
        }

        const average = getCandidateAverage(candidate.id);
        const prediction = getCandidatePrediction(candidate.id);
        const termPerformance = getCandidateTermPerformance(candidate.id);

        doc.setFillColor(10, 25, 74);
        doc.roundedRect(margin, y - 8, contentWidth, 18, 4, 4, "F");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("P7 Prediction Report", margin + 4, y + 4);
        doc.setFontSize(10);
        doc.setTextColor(241, 245, 249);
        doc.text(`Generated: ${format(new Date(), "do MMM yyyy")}`, margin + 4, y + 11);
        doc.setTextColor(255, 255, 255);
        doc.text(`Learner: ${candidate.full_name ?? "Unknown"}`, margin + 4, y + 18);

        y += 20;
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Admission: ${candidate.admission_number || "N/A"}`, margin, y);
        doc.text(`Class: ${candidate.classes?.name || "P7"}`, margin + 80, y);
        doc.text(`Overall Average: ${average !== null ? `${average.toFixed(1)}%` : "No data"}`, margin, y + 7);
        doc.setFillColor(...getScoreBadgeColor(prediction.score ?? null));
        doc.roundedRect(margin + 80, y + 1, 50, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Predicted ${prediction.division}`, margin + 83, y + 7);
        doc.setTextColor(15, 23, 42);
        doc.text(`Grade: ${prediction.grade}`, margin + 140, y + 7);

        y += 18;
        doc.setFontSize(11);
        doc.setTextColor(10, 25, 74);
        doc.text("Term Performance Fixtures", margin, y);
        y += 6;

        if (!termPerformance.length) {
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text("No term performance data is available for this learner.", margin, y + 5);
          return;
        }

        const boxWidth = (contentWidth - 10) / 4;
        const boxHeight = 14;
        let rowIndex = 0;
        termPerformance.forEach((termData, termIndex) => {
          const col = termIndex % 4;
          const row = Math.floor(termIndex / 4);
          const x = margin + col * (boxWidth + 3);
          const rowY = y + row * (boxHeight + 8);

          const [r, g, b] = getScoreBadgeColor(termData.average);
          doc.setFillColor(r, g, b);
          doc.roundedRect(x, rowY, boxWidth, boxHeight, 2, 2, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text(formatTermLabel(termData.term), x + 2, rowY + 5);
          doc.setFontSize(10);
          doc.text(
            termData.average !== null ? `${termData.average}%` : "N/A",
            x + 2,
            rowY + 11
          );

          rowIndex = row;
        });

        y += (rowIndex + 1) * (boxHeight + 8) + 8;
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        doc.text(
          `Prediction logic: based on every recorded term result since admission at this school, scored and grouped by year and term.`,
          margin,
          y
        );
      });

      doc.save(`p7-predictions-${format(new Date(), "yyyyMMdd")}.pdf`);
      toast({ title: "PDF ready", description: "The P7 prediction report is downloading." });
    } catch (error: any) {
      console.error("Prediction PDF export failed", error);
      toast({ title: "Export failed", description: error?.message || "Could not generate PDF." , variant: "destructive" });
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const name = String(c.full_name || "").toLowerCase();
    const admission = String(c.admission_number || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || admission.includes(search);
  });

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

  return (
    <DashboardLayout title="P7 Candidate Management" subtitle="PLE Preparation & UNEB Registration Portal">
      <div className="space-y-6">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-xs font-bold text-emerald-600 uppercase">P5-P7 Average</p>
                <p className="text-2xl font-bold">{stats.overallHistoricalAverage ?? "--"}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-200" />
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase">Syllabus Coverage</p>
                <p className="text-2xl font-bold">{stats.syllabusCoveragePercent}%</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-slate-300" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-blue-100 bg-blue-50/30">
            <CardContent>
              <p className="text-sm font-bold uppercase text-blue-600 tracking-wider">Academic Risk</p>
              <p className="mt-2 text-sm text-slate-700">
                {stats.atRiskCount} candidate{stats.atRiskCount === 1 ? "" : "s"} are currently flagged as at-risk based on trailing P5-P7 performance and syllabus coverage gaps.
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardContent>
              <p className="text-sm font-bold uppercase text-emerald-700 tracking-wider">Predictive Readiness</p>
              <p className="mt-2 text-sm text-slate-700">
                Use the P7 prediction tab to track every candidate's mock trajectory, identify likely Division I and II outcomes, and prepare additional support for learners below 55% historic average.
              </p>
            </CardContent>
          </Card>
          <Card className="border-orange-100 bg-orange-50/30">
            <CardContent>
              <p className="text-sm font-bold uppercase text-orange-700 tracking-wider">Coverage Signals</p>
              <p className="mt-2 text-sm text-slate-700">
                Course coverage is incorporated into risk assessment. Less than 70% completion can indicate PLE readiness is at risk even when mock scores look stable.
              </p>
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
                <Button variant="outline" size="sm" className="gap-2" onClick={handleBulkPhotosClick}>
                  <Upload className="h-4 w-4" /> Bulk Photos
                </Button>
                <Button size="sm" className="gap-2" onClick={handleExportRegister}>
                  <Download className="h-4 w-4" /> Export Register
                </Button>
                <input
                  ref={bulkPhotoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleBulkPhotosUpload}
                />
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
                      <TableHead>Historic Avg</TableHead>
                      <TableHead>PLE Trend</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index No.</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          Loading candidates...
                        </TableCell>
                      </TableRow>
                    ) : filteredCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
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
                          <TableCell className="text-xs font-mono">
                            {getCandidateAverage(candidate.id) !== null
                              ? `${getCandidateAverage(candidate.id)?.toFixed(1)}%`
                              : "--"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getCandidateTrend(candidate.id) === "Improving" ? "success" : getCandidateTrend(candidate.id) === "Declining" ? "destructive" : "secondary"} className="text-[10px]">
                              {getCandidateTrend(candidate.id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={candidate.uneb_index_number ? "default" : "outline"} className="text-[10px]">
                              {candidate.uneb_index_number ? "Registered" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{candidate.uneb_index_number || "---"}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={getCandidatePrediction(candidate.id).division === "I" ? "success" : getCandidatePrediction(candidate.id).division === "II" ? "secondary" : "outline"} className="text-[10px] uppercase">
                              {`Div ${getCandidatePrediction(candidate.id).division}`}
                            </Badge>
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
                   <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full">
                      <div>
                         <CardTitle className="text-lg">Aggregate Prediction Model</CardTitle>
                         <CardDescription>Likely performance outcomes based on current academic trajectory and yearly fixtures-style performance history.</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPredictions}>
                           <Download className="h-4 w-4" /> Export Predictions PDF
                         </Button>
                         <Button size="sm" className="gap-2" onClick={handleExportRegister}>
                           <Download className="h-4 w-4" /> Export Register
                         </Button>
                      </div>
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                         <Table>
                            <TableHeader>
                               <TableRow>
                                  <TableHead>Candidate</TableHead>
                                  <TableHead>Historical Avg</TableHead>
                                  {predictionYears.map((year) => (
                                    <TableHead key={year}>{year}</TableHead>
                                  ))}
                                  <TableHead>Predicted Div</TableHead>
                                  <TableHead>Predicted Grade</TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {filteredCandidates.map((c) => {
                                 const prediction = getCandidatePrediction(c.id);
                                 const yearlyData = getCandidateYearlyPerformance(c.id);

                                 return (
                                   <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
                                      <TableCell className="font-medium text-sm">{c.full_name}</TableCell>
                                      <TableCell className="text-xs font-mono">
                                        {getCandidateAverage(c.id) !== null ? `${getCandidateAverage(c.id)?.toFixed(1)}%` : "--"}
                                      </TableCell>
                                      {yearlyData.map((item) => (
                                        <TableCell key={item.year} className="text-xs text-center">
                                          {item.average !== null ? (
                                            <Badge className={`px-2 py-1 ${item.average >= 75 ? "bg-emerald-600 text-white" : item.average >= 60 ? "bg-sky-600 text-white" : item.average >= 45 ? "bg-amber-500 text-slate-900" : "bg-orange-500 text-white"}`}>
                                              {item.average}%
                                            </Badge>
                                          ) : (
                                            "--"
                                          )}
                                        </TableCell>
                                      ))}
                                      <TableCell>
                                         <Badge className={`${divisionBadgeClass(prediction.division)} rounded-full px-2 py-1 text-xs`}>
                                           Div {prediction.division}
                                         </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs font-bold uppercase">
                                         {prediction.grade}
                                      </TableCell>
                                   </TableRow>
                                 );
                               })}
                            </TableBody>
                         </Table>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 text-white shadow-lg">
                            <h4 className="font-bold text-sm mb-2 uppercase tracking-[0.18em] text-slate-200">Prediction Fixture Summary</h4>
                            <div className="space-y-3">
                               <div className="flex items-center justify-between text-sm">
                                  <span>Division I candidates</span>
                                  <span className="font-semibold">{filteredCandidates.filter((c) => getCandidatePrediction(c.id).division === "I").length}</span>
                               </div>
                               <div className="flex items-center justify-between text-sm">
                                  <span>Division II candidates</span>
                                  <span className="font-semibold">{filteredCandidates.filter((c) => getCandidatePrediction(c.id).division === "II").length}</span>
                               </div>
                               <div className="flex items-center justify-between text-sm">
                                  <span>Pending / Early warning</span>
                                  <span className="font-semibold">{filteredCandidates.filter((c) => getCandidatePrediction(c.id).division === "U").length}</span>
                               </div>
                            </div>
                         </div>
                         <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h4 className="font-bold text-sm mb-3">Fixture-style trend</h4>
                            <div className="space-y-2">
                               {filteredCandidates.slice(0, 4).map((c) => {
                                 const prediction = getCandidatePrediction(c.id);
                                 return (
                                   <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                     <div>
                                       <p className="font-semibold text-sm">{c.full_name}</p>
                                       <p className="text-xs text-slate-500">{c.admission_number || c.id}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] uppercase text-emerald-800">{prediction.division}</span>
                                       <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] text-white">{prediction.grade}</span>
                                     </div>
                                   </div>
                                 );
                               })}
                            </div>
                         </div>
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
