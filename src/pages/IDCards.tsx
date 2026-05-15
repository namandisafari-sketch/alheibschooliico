import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAllStaff } from "@/hooks/useStaff";
import { useLearners } from "@/hooks/useLearners";
import { useClasses } from "@/hooks/useClasses";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useIdCardSettings, IdCardSettings } from "@/hooks/useIdCardSettings";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Download, 
  CreditCard, 
  User, 
  Users,
  ChevronDown, 
  Loader2, 
  Package, 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2,
  Printer,
  Activity,
  Cpu,
  Layers,
  Settings2,
  LayoutDashboard
} from "lucide-react";
import { StaffIDCard } from "@/components/idcards/StaffIDCard";
import { StudentIDCard } from "@/components/idcards/StudentIDCard";
import { VisitorIDCard } from "@/components/idcards/VisitorIDCard";
import { EmergencyReentrySlip } from "@/components/idcards/EmergencyReentrySlip";
import { AssetSizeControls } from "@/components/settings/AssetSizeControls";
import { useVisitors, useVisitorVisits } from "@/hooks/useVisitors";
import { toPng } from "html-to-image";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";

// Fetch a single guardian's full record by id
const useGuardian = (guardianId?: string | null) =>
  useQuery({
    queryKey: ["guardian", guardianId],
    enabled: !!guardianId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardians")
        .select("*")
        .eq("id", guardianId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

const CardPreviewWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full flex items-center justify-center overflow-hidden p-1 sm:p-0 min-h-[220px] sm:min-h-[360px]">
    <div className="scale-[0.55] xs:scale-[0.65] sm:scale-[0.8] md:scale-100 origin-center transition-transform duration-500 ease-out flex-shrink-0">
      {children}
    </div>
  </div>
);

const IDCards = () => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [batchClass, setBatchClass] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const { data: staff = [] } = useAllStaff();
  const { data: learners = [] } = useLearners();
  const { data: classes = [] } = useClasses();
  const { data: siteSettings } = useSiteSettings();
  const { data: idSettings } = useIdCardSettings();

  const schoolName = "Alheib Mixed Day & Boarding School";

  const filteredStaff = staff.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStudents = learners.filter((l) =>
    l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStaffMember = staff.find((s) => s.id === selectedStaff);
  const selectedStudentMember = learners.find((l) => l.id === selectedStudent);

  const previewSettings: IdCardSettings = idSettings || {
    director_name: "",
    director_signature_url: "",
    head_teacher_name: "",
    head_teacher_signature_url: "",
    school_logo_url: "",
    school_stamp_url: "",
    back_policy: "",
    back_policy_ar: "",
    logo_size_report: 96,
    logo_size_id: 44,
    signature_height_report: 32,
    signature_height_id: 22,
    stamp_size_report: 80,
    barcode_height: 12,
  };

  const schoolLogoUrl = previewSettings.school_logo_url;

  const exportNode = async (node: HTMLElement | null, filename: string) => {
    if (!node) return;
    const dataUrl = await toPng(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleExport = async (which: "front" | "back" | "both") => {
    const subject = activeTab === "students" ? selectedStudentMember : selectedStaffMember;
    if (!subject) return;
    const baseName = subject.full_name.replace(/[^a-z0-9]/gi, "_");
    setExporting(true);
    try {
      if (which === "front" || which === "both") {
        await exportNode(frontRef.current, `${baseName}_ID_FRONT.png`);
      }
      if (which === "back" || which === "both") {
        await exportNode(backRef.current, `${baseName}_ID_BACK.png`);
      }
      toast({ title: t("exported"), description: t("cardDownloaded") });
    } catch (e) {
      console.error(e);
      toast({ title: t("exportFailed"), description: String(e), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const renderCardToPng = async (cardJsx: React.ReactElement): Promise<string> => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.background = "white";
    document.body.appendChild(host);
    const root = createRoot(host);

    return new Promise<string>((resolve, reject) => {
      root.render(cardJsx);
      setTimeout(async () => {
        try {
          const target = host.firstElementChild as HTMLElement | null;
          if (!target) throw new Error("Card render failed");
          const dataUrl = await toPng(target, {
            pixelRatio: 3,
            cacheBust: true,
            backgroundColor: "#ffffff",
          });
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        } finally {
          root.unmount();
          host.remove();
        }
      }, 250);
    });
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleBatchExport = async () => {
    const targets = batchClass === "all" ? learners : learners.filter((l) => l.class_id === batchClass);
    if (targets.length === 0) {
      toast({ title: t("noData"), variant: "destructive" });
      return;
    }

    setBatchExporting(true);
    setBatchProgress({ current: 0, total: targets.length });
    const zip = new JSZip();

    try {
      for (let i = 0; i < targets.length; i++) {
        const learner = targets[i];
        const safe = learner.full_name.replace(/[^a-z0-9]/gi, "_");
        const className = (learner.classes?.name || learner.class_name || "Unassigned").replace(/[^a-z0-9]/gi, "_");
        const folder = zip.folder(className)!;

        const frontUrl = await renderCardToPng(
          <StudentIDCard student={learner} schoolName={schoolName} isRTL={isRTL} side="front" settings={previewSettings} />
        );
        const backUrl = await renderCardToPng(
          <StudentIDCard student={learner} schoolName={schoolName} isRTL={isRTL} side="back" settings={previewSettings} />
        );

        folder.file(`${safe}_FRONT.png`, dataUrlToBlob(frontUrl));
        folder.file(`${safe}_BACK.png`, dataUrlToBlob(backUrl));

        setBatchProgress({ current: i + 1, total: targets.length });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const label = batchClass === "all" ? "all_classes" : (classes.find((c) => c.id === batchClass)?.name || "class").replace(/[^a-z0-9]/gi, "_");
      a.download = `ID_Cards_${label}_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: t("exported"), description: `${targets.length} \u00d7 ${t("idCards")}` });
    } catch (e) {
      console.error(e);
      toast({ title: t("exportFailed"), description: String(e), variant: "destructive" });
    } finally {
      setBatchExporting(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  return (
    <DashboardLayout title="ID Issuing Station" subtitle="Live credential management & production">
      <div className="min-h-[calc(100vh-180px)] flex flex-col gap-6" dir={isRTL ? "rtl" : "ltr"}>
        
        {/* Station Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-card border rounded-2xl shadow-sm gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Issuing Station Online</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 sm:h-4 w-4 text-primary/60" />
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">System Core v4.2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 sm:h-4 w-4 text-primary/60" />
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">DB Sync: 100%</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono text-muted-foreground">
            <span>{new Date().toLocaleDateString()}</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
          
          {/* CONTROL SIDEBAR */}
          <aside className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto lg:max-h-full">
            <Card className="flex-1 border-primary/10">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">Credential Control</CardTitle>
                  </div>
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 pt-2">
                <TabsList className="grid grid-cols-3 w-full h-10 bg-muted/50 p-1">
                  <TabsTrigger value="students" className="text-[10px] uppercase font-bold tracking-wider">Students</TabsTrigger>
                  <TabsTrigger value="staff" className="text-[10px] uppercase font-bold tracking-wider">Staff</TabsTrigger>
                  <TabsTrigger value="visitors" className="text-[10px] uppercase font-bold tracking-wider">Visitors</TabsTrigger>
                </TabsList>

                {/* SHARED SEARCH */}
                <div className="mt-4 relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search records..." 
                    className="pl-9 h-10 bg-muted/30 border-muted/50 focus:bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  {/* STUDENT SELECT */}
                  {activeTab === "students" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground px-1">Selected Learner</label>
                        <Select value={selectedStudent || ""} onValueChange={setSelectedStudent}>
                          <SelectTrigger className="h-11 bg-muted/20 border-muted/50">
                            <SelectValue placeholder="Target Student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredStudents.slice(0, 50).map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.full_name} ΓÇö {l.admission_number || "NO_ADM"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-tighter">Batch Issuing Deck</span>
                        </div>
                        <div className="space-y-3">
                          <Select value={batchClass} onValueChange={setBatchClass}>
                            <SelectTrigger className="h-9 text-xs bg-background/50">
                              <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Entire Student Body</SelectItem>
                              {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="secondary" 
                            className="w-full h-10 font-bold text-xs uppercase tracking-widest border-2 border-primary/10"
                            onClick={handleBatchExport}
                            disabled={batchExporting}
                          >
                            {batchExporting ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Generating ({batchProgress.current}/{batchProgress.total})</span>
                              </div>
                            ) : (
                              "Launch Batch Operation"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAFF SELECT */}
                  {activeTab === "staff" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground px-1">Selected Faculty</label>
                      <Select value={selectedStaff || ""} onValueChange={setSelectedStaff}>
                        <SelectTrigger className="h-11 bg-muted/20 border-muted/50">
                          <SelectValue placeholder="Target Staff Member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStaff.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.full_name} ΓÇö {s.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* CALIBRATION / CONFIG */}
                  <div className="pt-4 border-t border-dashed">
                    <label className="text-[10px] font-black uppercase text-muted-foreground px-1 mb-3 block tracking-[0.15em]">Live Calibration</label>
                    <AssetSizeControls surface="id" title="" />
                  </div>
                </div>
              </Tabs>
            </Card>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-card border flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Sync</span>
                <span className="text-xl font-black text-green-500">Live</span>
              </div>
              <div className="p-3 rounded-2xl bg-card border flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">DPI</span>
                <span className="text-xl font-black text-primary">300</span>
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCTION DECK */}
          <main className="flex-1 min-w-0">
            <div className="h-full bg-zinc-950 rounded-3xl border-2 border-primary/20 shadow-2xl relative overflow-hidden flex flex-col">
              
              {/* Deck Header */}
              <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 bg-white/5 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                    <Printer className="h-5 w-5 text-primary" />
                    Production Deck
                  </h2>
                  <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">Verified high-resolution credential issuance</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                  {activeTab !== "visitors" && (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20 h-10 px-4 sm:px-6 font-bold text-xs sm:text-sm flex-1 sm:flex-none">
                            <Download className="h-4 w-4 mr-2" /> Export <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 text-white">
                          <DropdownMenuItem className="focus:bg-white/10" onClick={() => handleExport("front")}>Front Side PNG</DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10" onClick={() => handleExport("back")}>Back Side PNG</DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10" onClick={() => handleExport("both")}>Combined (Front+Back)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        className="h-10 px-6 sm:px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 text-xs sm:text-sm flex-1 sm:flex-none"
                        onClick={() => {
                          const name = activeTab === "students" ? selectedStudentMember?.full_name : selectedStaffMember?.full_name;
                          if (name) handleExport("both");
                        }}
                        disabled={(!selectedStudentMember && !selectedStaffMember) || exporting}
                      >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
                        ISSUE
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Deck Content (Live Preview) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
                  
                  {activeTab === "students" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start justify-items-center">
                      <div className="space-y-4 w-full max-w-full lg:max-w-[400px]">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 block text-center">Front Facing Surface</span>
                        <div className="p-1 sm:p-1.5 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                          <div ref={frontRef} className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-white">
                            {selectedStudentMember ? (
                              <CardPreviewWrapper>
                                <StudentIDCard student={selectedStudentMember} schoolName={schoolName} isRTL={isRTL} side="front" settings={previewSettings} />
                              </CardPreviewWrapper>
                            ) : (
                              <DeckPlaceholder label="Select student to engage production deck" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4 w-full max-w-full lg:max-w-[400px]">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-4 py-1.5 bg-white/5 rounded-full border border-white/10 block text-center">Rear Security Surface</span>
                        <div className="p-1 sm:p-1.5 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                          <div ref={backRef} className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-white">
                            {selectedStudentMember ? (
                              <CardPreviewWrapper>
                                <StudentIDCard student={selectedStudentMember} schoolName={schoolName} isRTL={isRTL} side="back" settings={previewSettings} />
                              </CardPreviewWrapper>
                            ) : (
                              <DeckPlaceholder label="Rear preview inactive" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "staff" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start justify-items-center">
                      <div className="space-y-4 w-full max-w-full lg:max-w-[400px]">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 block text-center">Faculty Front Surface</span>
                        <div className="p-1 sm:p-1.5 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                          <div ref={frontRef} className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-white">
                            {selectedStaffMember ? (
                              <CardPreviewWrapper>
                                <StaffIDCard staff={selectedStaffMember} schoolName={schoolName} isRTL={isRTL} side="front" settings={previewSettings} />
                              </CardPreviewWrapper>
                            ) : (
                              <DeckPlaceholder label="Select faculty member for issuance" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4 w-full max-w-full lg:max-w-[400px]">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-4 py-1.5 bg-white/5 rounded-full border border-white/10 block text-center">Staff Security Matrix</span>
                        <div className="p-1 sm:p-1.5 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                          <div ref={backRef} className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-white">
                            {selectedStaffMember ? (
                              <CardPreviewWrapper>
                                <StaffIDCard staff={selectedStaffMember} schoolName={schoolName} isRTL={isRTL} side="back" settings={previewSettings} />
                              </CardPreviewWrapper>
                            ) : (
                              <DeckPlaceholder label="Security preview locked" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "visitors" && (
                    <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                       <VisitorStationSection 
                        schoolName={schoolName} 
                        schoolLogoUrl={schoolLogoUrl} 
                        isRTL={isRTL} 
                        learners={learners} 
                       />
                    </div>
                  )}
                </div>
              </div>

              {/* Station Decor */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

const DeckPlaceholder = ({ label }: { label: string }) => (
  <div className="w-[540px] max-w-full h-[340px] bg-zinc-900 flex items-center justify-center p-12 text-center">
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 mx-auto flex items-center justify-center">
        <CreditCard className="h-5 w-5 text-zinc-700" />
      </div>
      <p className="text-zinc-600 text-sm font-medium leading-relaxed">{label}</p>
    </div>
  </div>
);

// RESTORED VISITOR STATION SECTION
const VisitorStationSection = ({
  schoolName,
  schoolLogoUrl,
  isRTL,
  learners,
}: {
  schoolName: string;
  schoolLogoUrl?: string;
  isRTL: boolean;
  learners: any[];
}) => {
  const { data: visits = [] } = useVisitorVisits("active");
  const { data: allVisits = [] } = useVisitorVisits("all");
  const { data: visitors = [] } = useVisitors();
  
  const [visitId, setVisitId] = useState<string>("");
  const [visitorId, setVisitorId] = useState<string>("");
  const [pickupLearnerId, setPickupLearnerId] = useState<string>("");
  const [reentryVisitId, setReentryVisitId] = useState<string>("");
  const [reentryDuration, setReentryDuration] = useState<number>(60);
  const [reentryWidth, setReentryWidth] = useState<54 | 80>(80);

  const dayRef = useRef<HTMLDivElement>(null);
  const dayBackRef = useRef<HTMLDivElement>(null);
  const reusableRef = useRef<HTMLDivElement>(null);
  const reusableBackRef = useRef<HTMLDivElement>(null);
  const pickupRef = useRef<HTMLDivElement>(null);
  const pickupBackRef = useRef<HTMLDivElement>(null);
  const reentryRef = useRef<HTMLDivElement>(null);

  const checkedOutVisits = useMemo(() => allVisits.filter((v) => v.status === "checked_out").slice(0, 50), [allVisits]);
  const reentryVisit = checkedOutVisits.find((v) => v.id === reentryVisitId);
  const visit = visits.find((v) => v.id === visitId);
  const visitor = visitors.find((v) => v.id === visitorId);
  const pickupLearner = learners.find((l) => l.id === pickupLearnerId);

  const { data: guardianRecord } = useGuardian(pickupLearner?.guardian_id);

  const guardianVisitor = useMemo(() => {
    if (!pickupLearner) return undefined;
    const name = guardianRecord?.full_name || pickupLearner.guardian_name || "Guardian (not on file)";
    const phone = guardianRecord?.phone || pickupLearner.guardian_phone || null;
    const relationship = guardianRecord?.relationship || "guardian";
    return {
      id: pickupLearner.guardian_id || `gp-${pickupLearner.id}`,
      full_name: name,
      phone,
      email: guardianRecord?.email || null,
      company: relationship.charAt(0).toUpperCase() + relationship.slice(1),
      id_number: guardianRecord?.district || (pickupLearner.guardian_id ? `GRD-${pickupLearner.guardian_id.slice(0, 8).toUpperCase()}` : null),
      photo_url: null,
      notes: guardianRecord?.address || null,
      is_recurring: true,
      created_at: guardianRecord?.created_at || new Date().toISOString(),
    } as any;
  }, [pickupLearner, guardianRecord]);

  const exportCard = async (frontEl: React.RefObject<HTMLDivElement>, backEl: React.RefObject<HTMLDivElement>, name: string) => {
    if (!frontEl.current || !backEl.current) return;
    const safe = name.replace(/[^a-z0-9]/gi, "_");
    const zip = new JSZip();
    const front = await toPng(frontEl.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
    const back = await toPng(backEl.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
    zip.file(`${safe}_FRONT.png`, front.split(",")[1], { base64: true });
    zip.file(`${safe}_BACK.png`, back.split(",")[1], { base64: true });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safe}_VISITOR.zip`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Pick-Up Pass */}
      <Card className="bg-zinc-900/50 border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Authorised Pick-Up Pass
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Learner</label>
              <Select value={pickupLearnerId} onValueChange={setPickupLearnerId}>
                <SelectTrigger className="bg-zinc-800 border-white/10 text-white h-11">
                  <SelectValue placeholder="Target Learner..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {learners.slice(0, 50).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 font-bold"
              disabled={!pickupLearner}
              onClick={() => pickupLearner && exportCard(pickupRef, pickupBackRef, `${pickupLearner.full_name}_PICKUP`)}
            >
              <Download className="h-4 w-4 mr-2" /> Export Pass
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center bg-black/40 p-8 rounded-2xl border border-white/5">
            <div className="space-y-3 w-full max-w-full md:max-w-[340px]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block text-center">Pass Front</span>
              <div ref={pickupRef} className="rounded-xl overflow-hidden shadow-2xl bg-white">
                {pickupLearner ? (
                  <CardPreviewWrapper>
                    <VisitorIDCard visitor={guardianVisitor} learner={pickupLearner} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} isRTL={isRTL} variant="guardian-pickup" side="front" />
                  </CardPreviewWrapper>
                ) : (
                  <div className="w-[340px] h-[214px] bg-zinc-800/50 flex items-center justify-center text-zinc-600 text-[10px]">PREVIEW_FRONT</div>
                )}
              </div>
            </div>
            <div className="space-y-3 w-full max-w-full md:max-w-[340px]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block text-center">Pass Back</span>
              <div ref={pickupBackRef} className="rounded-xl overflow-hidden shadow-2xl bg-white">
                {pickupLearner ? (
                  <CardPreviewWrapper>
                    <VisitorIDCard visitor={guardianVisitor} learner={pickupLearner} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} isRTL={isRTL} variant="guardian-pickup" side="back" />
                  </CardPreviewWrapper>
                ) : (
                  <div className="w-[340px] h-[214px] bg-zinc-800/50 flex items-center justify-center text-zinc-600 text-[10px]">PREVIEW_BACK</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Pass */}
      <Card className="bg-zinc-900/50 border-white/5">
        <CardHeader className="border-b border-white/5 bg-white/5">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" /> Day Pass (Active Visits)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Visit</label>
              <Select value={visitId} onValueChange={setVisitId}>
                <SelectTrigger className="bg-zinc-800 border-white/10 text-white h-11">
                  <SelectValue placeholder="On-Site Visitor..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {visits.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.visitor_name} ΓÇö {v.badge_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 font-bold"
              disabled={!visit}
              onClick={() => visit && exportCard(dayRef, dayBackRef, visit.visitor_name)}
            >
              <Download className="h-4 w-4 mr-2" /> Export Pass
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center bg-black/40 p-8 rounded-2xl border border-white/5">
             <div className="space-y-3 w-full max-w-full md:max-w-[340px]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block text-center">Day Pass Front</span>
              <div ref={dayRef} className="rounded-xl overflow-hidden shadow-2xl bg-white">
                {visit ? (
                  <CardPreviewWrapper>
                    <VisitorIDCard visit={visit} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} isRTL={isRTL} variant="day-pass" side="front" />
                  </CardPreviewWrapper>
                ) : (
                  <div className="w-[340px] h-[214px] bg-zinc-800/50 flex items-center justify-center text-zinc-600 text-[10px]">PREVIEW_FRONT</div>
                )}
              </div>
            </div>
            <div className="space-y-3 w-full max-w-full md:max-w-[340px]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block text-center">Day Pass Back</span>
              <div ref={dayBackRef} className="rounded-xl overflow-hidden shadow-2xl bg-white">
                {visit ? (
                  <CardPreviewWrapper>
                    <VisitorIDCard visit={visit} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} isRTL={isRTL} variant="day-pass" side="back" />
                  </CardPreviewWrapper>
                ) : (
                  <div className="w-[340px] h-[214px] bg-zinc-800/50 flex items-center justify-center text-zinc-600 text-[10px]">PREVIEW_BACK</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Re-entry */}
      <Card className="bg-zinc-900/50 border-destructive/20 border-2">
        <CardHeader className="border-b border-destructive/10 bg-destructive/5">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Emergency Re-entry Slip
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Recent Visit</label>
              <Select value={reentryVisitId} onValueChange={setReentryVisitId}>
                <SelectTrigger className="bg-zinc-800 border-white/10 text-white h-11">
                  <SelectValue placeholder="Checked-out Visitor..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {checkedOutVisits.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.visitor_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Validity Duration</label>
              <Select value={String(reentryDuration)} onValueChange={(v) => setReentryDuration(Number(v))}>
                <SelectTrigger className="bg-zinc-800 border-white/10 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
               <Button 
                variant="destructive"
                className="flex-1 h-11 font-bold"
                disabled={!reentryVisit}
                onClick={async () => {
                  if (!reentryRef.current || !reentryVisit) return;
                  const safe = reentryVisit.visitor_name.replace(/[^a-z0-9]/gi, "_");
                  const url = await toPng(reentryRef.current, { pixelRatio: 4, cacheBust: true, backgroundColor: "#ffffff" });
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${safe}_REENTRY.png`;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" /> Export Slip
              </Button>
            </div>
          </div>

          <div className="flex justify-center bg-black/40 p-8 rounded-2xl border border-white/5">
             <div ref={reentryRef} className="bg-white p-4 shadow-2xl rounded-sm">
                {reentryVisit ? (
                  <EmergencyReentrySlip
                    schoolName={schoolName}
                    visitorName={reentryVisit.visitor_name}
                    visitorPhone={reentryVisit.visitor_phone}
                    purpose={reentryVisit.purpose}
                    host={reentryVisit.host_name}
                    durationMinutes={reentryDuration}
                    width={reentryWidth}
                    isRTL={isRTL}
                    originalVisitId={reentryVisit.id}
                  />
                ) : (
                  <div className="w-[200px] h-[300px] bg-zinc-800/50 flex items-center justify-center text-zinc-600 text-[10px] text-center px-4">SELECT CHECKED-OUT VISITOR</div>
                )}
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCards;
