// EMIS Compliance Settings - Refined Structure
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useIdCardSettings,
  useUpdateIdCardSettings,
  uploadSignature,
  IdCardSettings,
} from "@/hooks/useIdCardSettings";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Save, 
  Upload, 
  GraduationCap, 
  Calendar as CalendarIcon, 
  RefreshCw,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { useSchools, useUpdateSchool, useCreateSchool, School } from "@/hooks/useSchools";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAcademicSettings, useUpdateAcademicSettings, AcademicSettings } from "@/hooks/useAcademicSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tabs as UiTabs, TabsContent as UiTabsContent, TabsList as UiTabsList, TabsTrigger as UiTabsTrigger } from "@/components/ui/tabs";
import { 
  useInfrastructure, 
  useSanitation, 
  useUpdateInfrastructure, 
  useUpdateSanitation,
  useDeleteInfrastructure,
  useDeleteSanitation,
  Infrastructure,
  Sanitation
} from "@/hooks/useEmisCompliance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Droplets, Warehouse, PlusCircle, Trash2 } from "lucide-react";

const DEFAULT_ID_CARD: IdCardSettings = {
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

const SiteSettings = () => {
  const { t, isRTL } = useLanguage();
  const { data: idCardSettings, isLoading: isIdLoading } = useIdCardSettings();
  const { data: academicSettings, isLoading: isAcademicLoading } = useAcademicSettings();
  const updateIdCardSettings = useUpdateIdCardSettings();
  const updateAcademicSettings = useUpdateAcademicSettings();
  const [idCard, setIdCard] = useState<IdCardSettings>(DEFAULT_ID_CARD);
  const [academic, setAcademic] = useState<AcademicSettings | null>(null);
  const [uploadingDir, setUploadingDir] = useState(false);
  const [uploadingHead, setUploadingHead] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const { data: schools, isLoading: isSchoolsLoading, isError: isSchoolsError } = useSchools();
  const updateSchool = useUpdateSchool();
  const createSchool = useCreateSchool();
  const [activeSchool, setActiveSchool] = useState<School | null>(null);

  const { data: infrastructure = [] } = useInfrastructure(activeSchool?.id);
  const { data: sanitation = [] } = useSanitation(activeSchool?.id);
  const updateInfra = useUpdateInfrastructure();
  const updateWash = useUpdateSanitation();
  const deleteInfra = useDeleteInfrastructure();
  const deleteWash = useDeleteSanitation();

  useEffect(() => {
    if (schools && schools.length > 0) {
      setActiveSchool(schools[0]);
    }
  }, [schools]);

  useEffect(() => {
    if (idCardSettings) setIdCard(idCardSettings);
  }, [idCardSettings]);

  useEffect(() => {
    if (academicSettings) setAcademic(academicSettings);
  }, [academicSettings]);

  const handleSignatureUpload = async (file: File, type: "director" | "head_teacher") => {
    const setLoad = type === "director" ? setUploadingDir : setUploadingHead;
    setLoad(true);
    try {
      const url = await uploadSignature(file, type);
      const next = {
        ...idCard,
        [type === "director" ? "director_signature_url" : "head_teacher_signature_url"]: url,
      };
      setIdCard(next);
      await updateIdCardSettings.mutateAsync(next);
      toast({ title: t("saved"), description: t("settingsUpdated") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setLoad(false);
    }
  };

  const handleAssetUpload = async (file: File, kind: "logo" | "stamp") => {
    const setLoad = kind === "logo" ? setUploadingLogo : setUploadingStamp;
    setLoad(true);
    try {
      const url = await uploadSignature(file, kind === "logo" ? "director" : "head_teacher");
      const next = {
        ...idCard,
        [kind === "logo" ? "school_logo_url" : "school_stamp_url"]: url,
      };
      setIdCard(next);
      await updateIdCardSettings.mutateAsync(next);
      toast({ title: t("saved"), description: t("settingsUpdated") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setLoad(false);
    }
  };

  if (isIdLoading || isAcademicLoading || isSchoolsLoading) {
    return (
      <DashboardLayout title={t("systemSettings")} subtitle={t("idCards")}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t("systemSettings")}
      subtitle={t("idCardSignaturesBranding")}
    >
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Academic Settings</CardTitle>
            </div>
            <CardDescription>Configure the active academic year and school terms.</CardDescription>
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <RefreshCw className={cn("h-4 w-4 text-primary", academic?.is_automatic && "animate-spin")} />
                </div>
                <div>
                  <p className="text-sm font-bold">Automatic Sync</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Auto-detect year & term</p>
                </div>
              </div>
              <Switch 
                checked={academic?.is_automatic} 
                onCheckedChange={(v) => setAcademic(academic ? {...academic, is_automatic: v} : null)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {academic && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Active Academic Year</Label>
                    <Input 
                      type="number"
                      disabled={academic.is_automatic}
                      value={academic.current_year}
                      onChange={(e) => setAcademic({...academic, current_year: parseInt(e.target.value)})}
                    />
                    {academic.is_automatic && <p className="text-[10px] text-primary font-bold italic">Automatically detected as {new Date().getFullYear()}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Terms</Label>
                    <Select 
                      value={academic.number_of_terms.toString()}
                      onValueChange={(v) => {
                        const count = parseInt(v);
                        let newTerms = [...academic.terms];
                        if (count > newTerms.length) {
                          for (let i = newTerms.length; i < count; i++) {
                            const roman = i === 0 ? "I" : i === 1 ? "II" : i === 2 ? "III" : i === 3 ? "IV" : (i+1).toString();
                            newTerms.push({ id: `term_${i+1}`, name: `Term ${roman}`, start_month: "", end_month: "" });
                          }
                        } else {
                          newTerms = newTerms.slice(0, count);
                        }
                        setAcademic({...academic, number_of_terms: count, terms: newTerms});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Terms</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Active Term</Label>
                    <Select 
                      disabled={academic.is_automatic}
                      value={academic.current_term_id}
                      onValueChange={(v) => setAcademic({...academic, current_term_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select active term" />
                      </SelectTrigger>
                      <SelectContent>
                        {academic.terms.map(term => (
                          <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {academic.is_automatic && <p className="text-[10px] text-primary font-bold italic">Term auto-switched based on today's date</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-bold">Term Schedule</Label>
                  <div className="grid gap-4">
                    {academic.terms.map((term, idx) => (
                      <div key={term.id} className="p-4 border rounded-xl bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm uppercase tracking-wider text-primary">{term.name}</span>
                          <span className="text-[10px] font-medium text-slate-400">Term {idx + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Start Month</Label>
                            <Input 
                              value={term.start_month}
                              onChange={(e) => {
                                const newTerms = [...academic.terms];
                                newTerms[idx].start_month = e.target.value;
                                setAcademic({...academic, terms: newTerms});
                              }}
                              placeholder="e.g. February"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">End Month</Label>
                            <Input 
                              value={term.end_month}
                              onChange={(e) => {
                                const newTerms = [...academic.terms];
                                newTerms[idx].end_month = e.target.value;
                                setAcademic({...academic, terms: newTerms});
                              }}
                              placeholder="e.g. May"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    await updateAcademicSettings.mutateAsync(academic);
                    toast({ title: t("saved"), description: "Academic settings updated successfully." });
                  }}
                  disabled={updateAcademicSettings.isPending}
                  className="gap-2"
                >
                  {updateAcademicSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarIcon className="h-4 w-4" />
                  )}
                  Save Academic Settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* EMIS Compliance Card */}
        <Card className="border-primary/20 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>EMIS Compliance & Metadata</CardTitle>
              </div>
              {activeSchool?.registration_status === 'registered' ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Fully Compliant
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
                  <AlertCircle className="h-3 w-3" /> Registration Required
                </Badge>
              )}
            </div>
            <CardDescription>Official Ministry of Education standards and school classification.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {activeSchool ? (
              <UiTabs defaultValue="profile" className="w-full">
                <UiTabsList className="grid w-full grid-cols-2 mb-8">
                  <UiTabsTrigger value="profile" className="gap-2">
                    <Building2 className="h-4 w-4" /> Institutional Profile
                  </UiTabsTrigger>
                  <UiTabsTrigger value="wash" className="gap-2">
                    <Droplets className="h-4 w-4" /> Infrastructure & WASH
                  </UiTabsTrigger>
                </UiTabsList>

                <UiTabsContent value="profile" className="space-y-8">
                  <div className="grid gap-8">
                    {/* School Identifiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Center Number</Label>
                        <div className="relative">
                          <Input 
                            placeholder="e.g. P030104" 
                            className="pl-9"
                            value={activeSchool.center_number || ""}
                            onChange={(e) => setActiveSchool({...activeSchool, center_number: e.target.value})}
                          />
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Number</Label>
                        <div className="relative">
                          <Input 
                            placeholder="e.g. MOES/L/..." 
                            className="pl-9"
                            value={activeSchool.license_number || ""}
                            onChange={(e) => setActiveSchool({...activeSchool, license_number: e.target.value})}
                          />
                          <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registration Status</Label>
                        <Select 
                          value={activeSchool.registration_status || ""}
                          onValueChange={(v: any) => setActiveSchool({...activeSchool, registration_status: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="registered">Fully Registered</SelectItem>
                            <SelectItem value="license valid">License Valid</SelectItem>
                            <SelectItem value="license expired">License Expired</SelectItem>
                            <SelectItem value="not registered">Not Registered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Classification */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ownership</Label>
                        <Select 
                          value={activeSchool.ownership_type || ""}
                          onValueChange={(v: any) => setActiveSchool({...activeSchool, ownership_type: v})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Ownership type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="religious">Religious</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Level</Label>
                        <Select 
                          value={activeSchool.academic_level || ""}
                          onValueChange={(v: any) => setActiveSchool({...activeSchool, academic_level: v})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Academic level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre-primary">Pre-primary</SelectItem>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="post-primary">Post-primary</SelectItem>
                            <SelectItem value="vocational">Vocational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Boarding Status</Label>
                        <Select 
                          value={activeSchool.boarding_status || ""}
                          onValueChange={(v: any) => setActiveSchool({...activeSchool, boarding_status: v})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Day Only</SelectItem>
                            <SelectItem value="boarding">Boarding Only</SelectItem>
                            <SelectItem value="mixed">Mixed (Day & Boarding)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Year Founded</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 1995" 
                          className="bg-white"
                          value={activeSchool.year_founded || ""}
                          onChange={(e) => setActiveSchool({...activeSchool, year_founded: parseInt(e.target.value) || null})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Urban/Rural</Label>
                        <Select 
                          value={activeSchool.urban_rural || ""}
                          onValueChange={(v: any) => setActiveSchool({...activeSchool, urban_rural: v})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urban">Urban</SelectItem>
                            <SelectItem value="rural">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Geographical Location */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2">
                        <MapPin className="h-4 w-4" />
                        <span>OFFICIAL GEOGRAPHICAL LOCATION</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500">REGION</Label>
                          <Input 
                            value={activeSchool.region || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, region: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500">COUNTY</Label>
                          <Input 
                            value={activeSchool.county || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, county: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500">SUB-COUNTY</Label>
                          <Input 
                            value={activeSchool.sub_county || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, sub_county: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500">PARISH</Label>
                          <Input 
                            value={activeSchool.parish || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, parish: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500">VILLAGE</Label>
                          <Input 
                            value={activeSchool.village || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, village: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Distances */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2">
                        <Clock className="h-4 w-4" />
                        <span>DISTANCES TO ESSENTIAL SERVICES (KM)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">District HQ</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={activeSchool.distance_to_district_hq || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, distance_to_district_hq: parseFloat(e.target.value) || null})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health Facility</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={activeSchool.distance_to_health_facility || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, distance_to_health_facility: parseFloat(e.target.value) || null})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nearest Bank</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={activeSchool.distance_to_bank || ""} 
                            onChange={(e) => setActiveSchool({...activeSchool, distance_to_bank: parseFloat(e.target.value) || null})}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={async () => {
                          if (activeSchool) {
                            await updateSchool.mutateAsync(activeSchool);
                            toast({ title: "Updated", description: "School EMIS compliance data saved." });
                          }
                        }}
                        disabled={updateSchool.isPending}
                        className="gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        {updateSchool.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save EMIS Metadata
                      </Button>
                    </div>
                  </div>
                </UiTabsContent>

                <UiTabsContent value="wash" className="space-y-12">
                  {/* Infrastructure Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Warehouse className="h-5 w-5" />
                        <h3>BUILDINGS & CLASSROOMS</h3>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          if (activeSchool) {
                            updateInfra.mutate({
                              school_id: activeSchool.id,
                              asset_type: 'classroom',
                              name: 'New Classroom',
                              sitting_capacity: 40,
                              status: 'usable'
                            });
                          }
                        }}
                      >
                        <PlusCircle className="h-4 w-4" /> Add Asset
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Type</TableHead>
                          <TableHead>Name/Number</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {infrastructure.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">No infrastructure records found.</TableCell></TableRow>
                        ) : (
                          infrastructure.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="capitalize font-medium">{item.asset_type.replace('_', ' ')}</TableCell>
                              <TableCell>
                                <Input 
                                  value={item.name || ""} 
                                  onChange={(e) => updateInfra.mutate({...item, name: e.target.value})}
                                  className="h-8 text-xs border-transparent hover:border-slate-200 focus:bg-white"
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number"
                                  value={item.sitting_capacity} 
                                  onChange={(e) => updateInfra.mutate({...item, sitting_capacity: parseInt(e.target.value) || 0})}
                                  className="h-8 w-20 text-xs border-transparent hover:border-slate-200"
                                />
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={item.status}
                                  onValueChange={(v: any) => updateInfra.mutate({...item, status: v})}
                                >
                                  <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="usable">Usable</SelectItem>
                                    <SelectItem value="under_construction">Construction</SelectItem>
                                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                                    <SelectItem value="unusable">Unusable</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive opacity-50 hover:opacity-100"
                                  onClick={() => deleteInfra.mutate(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Sanitation Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Droplets className="h-5 w-5" />
                        <h3>SANITATION & WASH INDICATORS</h3>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          if (activeSchool) {
                            updateWash.mutate({
                              school_id: activeSchool.id,
                              facility_type: 'latrine',
                              target_user: 'mixed',
                              units_count: 1,
                              status: 'usable'
                            });
                          }
                        }}
                      >
                        <PlusCircle className="h-4 w-4" /> Add Facility
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Facility</TableHead>
                          <TableHead>Target User</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>PWD Accessible</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sanitation.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">No sanitation records found.</TableCell></TableRow>
                        ) : (
                          sanitation.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="capitalize font-medium">{item.facility_type.replace('_', ' ')}</TableCell>
                              <TableCell className="capitalize">{item.target_user}</TableCell>
                              <TableCell>
                                <Input 
                                  type="number"
                                  value={item.units_count} 
                                  onChange={(e) => updateWash.mutate({...item, units_count: parseInt(e.target.value) || 0})}
                                  className="h-8 w-16 text-xs border-transparent hover:border-slate-200"
                                />
                              </TableCell>
                              <TableCell>
                                <Switch 
                                  checked={item.is_accessible_to_pwd} 
                                  onCheckedChange={(v) => updateWash.mutate({...item, is_accessible_to_pwd: v})}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Select 
                                    value={item.status}
                                    onValueChange={(v: any) => updateWash.mutate({...item, status: v})}
                                  >
                                    <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="usable">Usable</SelectItem>
                                      <SelectItem value="unusable">Unusable</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive opacity-50 hover:opacity-100"
                                    onClick={() => deleteWash.mutate(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </UiTabsContent>
              </UiTabs>
            ) : isSchoolsError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 bg-red-50 rounded-full">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Database Connection Error</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We couldn't connect to the school database. This might be due to missing tables or pending migrations.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry Connection
                </Button>
              </div>
            ) : schools && schools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="p-4 bg-amber-50 rounded-full">
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">No School Record Found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Your EMIS profile needs to be initialized. Please create your school's official record to begin compliance tracking.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    const newSchool: Partial<School> = {
                      name: "My School",
                      registration_status: "not registered",
                      ownership_type: "private",
                      academic_level: "primary",
                      boarding_status: "day",
                      gender_status: "mixed"
                    };
                    createSchool.mutate(newSchool);
                    toast({ title: "Initializing", description: "Creating school record..." });
                  }}
                  className="gap-2 shadow-lg"
                >
                  <PlusCircle className="h-4 w-4" /> Initialize School Profile
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground italic">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading school data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SiteSettings;
