// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useClasses } from "@/hooks/useClasses";
import { useUpdateLearner, Learner } from "@/hooks/useLearners";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  Camera, Loader2, User, Users, Heart, School, ShieldCheck, Stethoscope, MapPin, FileText, X, Upload
} from "lucide-react";
import { SearchableSelectField } from "@/components/ui/searchable-select";
import { useUgandaLocations } from "@/hooks/useUgandaLocations";
import { WizardForm, WizardStep } from "@/components/ui/wizard-form";
import { useDocumentUpload } from "./DocumentUpload";
import { DocumentUpload } from "./DocumentUpload";
import { useMarkOrphan } from "@/hooks/useOrphanage";

const formSchema = z.object({
  full_name: z.string().min(2, "Name required").max(100),
  gender: z.enum(["male", "female"]),
  date_of_birth: z.string().optional(),
  age_years: z.string().optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  class_id: z.string().optional(),
  pupil_status: z.string().optional(),
  house: z.string().optional(),
  arabic_name: z.string().optional(),

  home_region: z.string().optional(),
  home_district: z.string().optional(),
  home_sub_county: z.string().optional(),
  home_parish: z.string().optional(),
  home_village: z.string().optional(),
  current_residence_town: z.string().optional(),
  current_residence_street: z.string().optional(),
  residence_phone: z.string().optional(),
  residence_email: z.string().optional(),
  dormitory: z.string().optional(),
  area: z.string().optional(),

  father_name: z.string().optional(),
  father_phone: z.string().optional(),
  father_email: z.string().optional(),
  father_occupation: z.string().optional(),
  father_nin: z.string().optional(),
  mother_name: z.string().optional(),
  mother_phone: z.string().optional(),
  mother_email: z.string().optional(),
  mother_occupation: z.string().optional(),
  mother_nin: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_relationship: z.string().optional(),
  parent_phone: z.string().optional(),
  next_of_kin_name: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
  next_of_kin_address: z.string().optional(),
  next_of_kin_work: z.string().optional(),
  authorized_person_name: z.string().optional(),
  authorized_person_phone: z.string().optional(),

  former_school_name: z.string().optional(),
  former_school_class: z.string().optional(),
  former_school_year: z.string().optional(),
  siblings_info: z.string().optional(),

  blood_group: z.string().optional(),
  allergies: z.string().optional(),
  chronic_diseases_text: z.string().optional(),
  medication_details: z.string().optional(),
  has_asthma: z.boolean().default(false),
  has_hearing_impairment: z.boolean().default(false),
  has_diabetes: z.boolean().default(false),
  has_epilepsy: z.boolean().default(false),
  has_visual_impairment: z.boolean().default(false),
  has_sickle_cell: z.boolean().default(false),
  has_heart_problems: z.boolean().default(false),
  immunization_complete: z.boolean().default(false),

  nin: z.string().optional(),
  lin: z.string().optional(),

  sponsorship_number: z.string().optional(),
  sponsorship_type: z.string().optional(),
  sponsorship_agency: z.string().optional(),
  nira_document_type: z.string().optional(),

  is_orphan: z.boolean().default(false),
  orphan_status: z.string().optional(),
  orphan_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditLearnerDialogProps {
  learner: Learner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS: WizardStep[] = [
  { id: "personal", title: "Personal", description: "Name, gender, class" },
  { id: "address", title: "Address", description: "Home & residence" },
  { id: "family", title: "Family", description: "Parents & guardians" },
  { id: "academic", title: "Academic", description: "School history" },
  { id: "medical", title: "Medical", description: "Health & EMIS" },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["full_name", "gender", "class_id", "date_of_birth", "age_years", "nationality", "religion", "pupil_status", "house", "arabic_name"],
  ["home_region", "home_district", "home_sub_county", "home_parish", "home_village", "current_residence_town", "current_residence_street", "residence_phone", "residence_email", "dormitory", "area"],
  ["father_name", "father_phone", "father_occupation", "father_nin", "mother_name", "mother_phone", "mother_occupation", "mother_nin", "guardian_name", "guardian_relationship", "parent_phone", "next_of_kin_name", "next_of_kin_phone", "next_of_kin_address", "next_of_kin_work", "authorized_person_name", "authorized_person_phone"],
  ["former_school_name", "former_school_class", "former_school_year", "siblings_info"],
  ["blood_group", "allergies", "chronic_diseases_text", "medication_details", "has_asthma", "has_hearing_impairment", "has_diabetes", "has_epilepsy", "has_visual_impairment", "has_sickle_cell", "has_heart_problems", "immunization_complete", "nin", "lin"],
];

export function EditLearnerDialog({ learner, open, onOpenChange }: EditLearnerDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: classes = [] } = useClasses();
  const updateLearner = useUpdateLearner();
  const markOrphan = useMarkOrphan();
  const { documents, setDocuments, uploadAll, isUploading: isUploadingDocs } = useDocumentUpload();
  const {
    loading: locationsLoading,
    districts,
    getSubcounties,
    getParishes,
    getVillages,
    getRegion
  } = useUgandaLocations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: learner.full_name,
      gender: learner.gender,
      date_of_birth: learner.date_of_birth || "",
      age_years: "",
      nationality: "Ugandan",
      religion: learner.religion || "Islam",
      class_id: learner.class_id || "",
      pupil_status: learner.pupil_status || "",
      house: learner.house || "",
      arabic_name: learner.arabic_name || "",

      father_name: learner.father_name || "",
      father_phone: learner.father_phone || "",
      father_email: learner.father_email || "",
      father_occupation: learner.father_occupation || "",
      father_nin: learner.father_nin || "",
      mother_name: learner.mother_name || "",
      mother_phone: learner.mother_phone || "",
      mother_email: learner.mother_email || "",
      mother_occupation: learner.mother_occupation || "",
      mother_nin: learner.mother_nin || "",
      guardian_name: learner.guardian_name || "",
      guardian_relationship: learner.guardian_relationship || "",
      parent_phone: learner.parent_phone || "",

      dormitory: learner.dormitory || "",
      area: learner.area || "",
      sponsorship_number: learner.sponsorship_number || "",
      sponsorship_type: learner.sponsorship_type || "",
      sponsorship_agency: learner.sponsorship_agency || "",
      nira_document_type: learner.nira_document_type || "",

      // These may not exist on Learner interface but default gracefully
      home_region: learner.home_region || "",
      home_district: learner.home_district || "",
      home_sub_county: learner.home_sub_county || "",
      home_parish: learner.home_parish || "",
      home_village: learner.home_village || "",
      current_residence_town: learner.current_residence_town || "",
      current_residence_street: learner.current_residence_street || "",
      residence_phone: learner.residence_phone || "",
      residence_email: learner.residence_email || "",

      next_of_kin_name: learner.next_of_kin?.name || "",
      next_of_kin_phone: learner.next_of_kin?.phone || "",
      next_of_kin_address: learner.next_of_kin?.address || "",
      next_of_kin_work: learner.next_of_kin?.place_of_work || "",
      authorized_person_name: learner.authorized_pick_up?.name || "",
      authorized_person_phone: learner.authorized_pick_up?.phone || "",

      former_school_name: learner.former_school_name || "",
      former_school_class: learner.former_school_class || "",
      former_school_year: learner.former_school_year || "",
      siblings_info: learner.siblings_in_school || "",

      blood_group: learner.blood_group || "",
      allergies: learner.allergies || "",
      chronic_diseases_text: learner.chronic_diseases || "",
      medication_details: learner.medication_details || "",
      has_asthma: learner.has_asthma || false,
      has_hearing_impairment: learner.has_hearing_impairment || false,
      has_diabetes: learner.has_diabetes || false,
      has_epilepsy: learner.has_epilepsy || false,
      has_visual_impairment: learner.has_eye_defects || false,
      has_sickle_cell: learner.has_sickle_cell || false,
      has_heart_problems: learner.has_heart_problems || false,
      immunization_complete: learner.immunization_complete || false,

      nin: learner.nin || "",
      lin: learner.lin || "",

      is_orphan: learner.is_orphan || false,
      orphan_status: learner.orphan_status || "",
      orphan_notes: learner.orphan_notes || "",
    },
  });

  const uploadPhoto = async (learnerId: string) => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `learner-photos/${learnerId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, photoFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      await updateLearner.mutateAsync({ id: learnerId, photo_url: publicUrl });
    } catch (e: any) {
      toast({ title: "Photo upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadGalleryPhotos = async (learnerId: string) => {
    const uploaded: string[] = [];
    for (const file of galleryFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `learner-gallery/${learnerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        uploaded.push(publicUrl);

        await supabase.from("learner_documents").insert({
          learner_id: learnerId,
          document_type: "gallery_photo",
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        });
      } catch (e: any) {
        console.error("Gallery upload error:", e);
      }
    }
    return uploaded;
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (valid) setCurrentStep((c) => c + 1);
  };

  const handleBack = () => setCurrentStep((c) => Math.max(0, c - 1));

  const onSubmit = async (values: FormValues) => {
    setUploading(true);
    try {
      const nextOfKin = {
        name: values.next_of_kin_name || null,
        phone: values.next_of_kin_phone || null,
        address: values.next_of_kin_address || null,
        place_of_work: values.next_of_kin_work || null,
      };
      const authorizedPickUp = {
        name: values.authorized_person_name || null,
        phone: values.authorized_person_phone || null,
      };

      await updateLearner.mutateAsync({
        id: learner.id,
        full_name: values.full_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth || null,
        age_years: values.age_years ? parseInt(values.age_years) : null,
        class_id: values.class_id || null,
        religion: values.religion,
        nationality: values.nationality,
        pupil_status: values.pupil_status,
        house: values.house,
        arabic_name: values.arabic_name || null,
        home_region: values.home_region || null,
        home_district: values.home_district || null,
        home_sub_county: values.home_sub_county || null,
        home_parish: values.home_parish || null,
        home_village: values.home_village || null,
        current_residence_town: values.current_residence_town || null,
        current_residence_street: values.current_residence_street || null,
        residence_phone: values.residence_phone || null,
        residence_email: values.residence_email || null,
        dormitory: values.dormitory || null,
        area: values.area || null,
        father_name: values.father_name || null,
        father_phone: values.father_phone || null,
        father_email: values.father_email || null,
        father_occupation: values.father_occupation || null,
        father_nin: values.father_nin || null,
        mother_name: values.mother_name || null,
        mother_phone: values.mother_phone || null,
        mother_email: values.mother_email || null,
        mother_occupation: values.mother_occupation || null,
        mother_nin: values.mother_nin || null,
        guardian_name: values.guardian_name || null,
        guardian_relationship: values.guardian_relationship || null,
        parent_phone: values.parent_phone || null,
        next_of_kin: nextOfKin,
        authorized_pick_up: authorizedPickUp,
        former_school_name: values.former_school_name || null,
        former_school_class: values.former_school_class || null,
        former_school_year: values.former_school_year || null,
        siblings_in_school: values.siblings_info || null,
        blood_group: values.blood_group || null,
        allergies: values.allergies || null,
        chronic_diseases: values.chronic_diseases_text || null,
        medication_details: values.medication_details || null,
        has_asthma: values.has_asthma,
        has_hearing_impairment: values.has_hearing_impairment,
        has_diabetes: values.has_diabetes,
        has_epilepsy: values.has_epilepsy,
        has_eye_defects: values.has_visual_impairment,
        has_sickle_cell: values.has_sickle_cell,
        has_heart_problems: values.has_heart_problems,
        immunization_complete: values.immunization_complete,
        nin: values.nin || null,
        lin: values.lin || null,
        sponsorship_number: values.sponsorship_number || null,
        sponsorship_type: values.sponsorship_type || null,
        sponsorship_agency: values.sponsorship_agency || null,
        nira_document_type: values.nira_document_type || null,
      });

      if (photoFile) await uploadPhoto(learner.id);
      if (galleryFiles.length > 0) await uploadGalleryPhotos(learner.id);
      if (documents.length > 0) await uploadAll(learner.id);
      if (values.is_orphan !== (learner.is_orphan || false)) {
        await markOrphan.mutateAsync({
          learnerId: learner.id,
          isOrphan: values.is_orphan,
          orphanStatus: values.orphan_status || undefined,
          notes: values.orphan_notes || undefined,
        });
      }

      toast({ title: "Success", description: "Learner details updated." });
      onOpenChange(false);
      setCurrentStep(0);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addGalleryFiles = (files: FileList) => {
    const newFiles = Array.from(files);
    setGalleryFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setGalleryPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const stepKey = STEPS[currentStep].id;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setCurrentStep(0); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Edit Learner Details
          </DialogTitle>
          <DialogDescription>
            Update information for <span className="font-semibold">{learner.full_name}</span> — {learner.admission_number || ""}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <WizardForm
              steps={STEPS}
              currentStep={currentStep}
              onNext={handleNext}
              onBack={handleBack}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
              isLoading={updateLearner.isPending || uploadingPhoto || uploading || isUploadingDocs}
              submitLabel="Save Changes"
            >
              {stepKey === "personal" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="shrink-0">
                      <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full border-2 border-dashed border-slate-300 overflow-hidden bg-white flex items-center justify-center">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Passport preview" className="h-full w-full object-cover" />
                        ) : learner.photo_url ? (
                          <img src={learner.photo_url} alt={learner.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">Passport Photo</p>
                      <p className="text-[11px] text-slate-500">JPEG, PNG or WebP. Max 5MB.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" className="relative">
                          {uploadingPhoto ? "Uploading..." : "Choose Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploadingPhoto}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
                                  return;
                                }
                                setPhotoFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => setPhotoPreview(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </Button>
                        {photoPreview && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="arabic_name" render={({ field }) => (
                      <FormItem><FormLabel>Arabic Name</FormLabel><FormControl><Input placeholder="الاسم العربي" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <SearchableSelectField
                          value={field.value}
                          onValueChange={field.onChange}
                          options={[
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" }
                          ]}
                          placeholder="Select gender"
                        />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                      <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="age_years" render={({ field }) => (
                      <FormItem><FormLabel>Age (Years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="nationality" render={({ field }) => (
                      <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="religion" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religion</FormLabel>
                        <SearchableSelectField
                          value={field.value}
                          onValueChange={field.onChange}
                          options={[
                            { value: "Islam", label: "Islam" },
                            { value: "Christianity", label: "Christianity" },
                            { value: "Other", label: "Other" }
                          ]}
                          placeholder="Select religion"
                        />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="pupil_status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pupil Status</FormLabel>
                        <SearchableSelectField
                          value={field.value}
                          onValueChange={field.onChange}
                          options={[
                            { value: "Paying", label: "Paying Pupil" },
                            { value: "Bait Zakat", label: "Buytuzaka (Bait Zakat)" },
                            { value: "IICO", label: "IICO" },
                            { value: "Community", label: "Community" },
                            { value: "Teacher's Child", label: "Teacher's Child" },
                            { value: "Orphan", label: "Orphan Scholarship" },
                            { value: "Other", label: "Other" }
                          ]}
                          placeholder="Select status"
                        />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="house" render={({ field }) => (
                      <FormItem>
                        <FormLabel>House</FormLabel>
                        <SearchableSelectField
                          options={[
                            { value: "Lion", label: "Lion" },
                            { value: "Tiger", label: "Tiger" },
                            { value: "Elephant", label: "Elephant" },
                            { value: "Cheetah", label: "Cheetah" }
                          ]}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select House"
                        />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="class_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <SearchableSelectField
                          options={classes.map(c => ({ value: c.id, label: c.name }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Class"
                        />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              {stepKey === "address" && (
                <div className="space-y-6">
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Home / Permanent Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <FormField control={form.control} name="home_region" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px]">Region</FormLabel>
                          <SearchableSelectField
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue("home_district", "");
                              form.setValue("home_sub_county", "");
                              form.setValue("home_parish", "");
                              form.setValue("home_village", "");
                            }}
                            options={[
                              { value: "CENTRAL", label: "CENTRAL" },
                              { value: "EASTERN", label: "EASTERN" },
                              { value: "NORTHERN", label: "NORTHERN" },
                              { value: "WESTERN", label: "WESTERN" }
                            ]}
                            placeholder={locationsLoading ? "Loading..." : "Select Region"}
                            disabled={locationsLoading}
                          />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="home_district" render={({ field }) => {
                        const selectedRegion = form.watch("home_region");
                        const filteredDistricts = selectedRegion
                          ? districts.filter(d => getRegion(d) === selectedRegion.toUpperCase().trim())
                          : districts;
                        return (
                          <FormItem>
                            <FormLabel className="text-[10px]">District</FormLabel>
                            <SearchableSelectField
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("home_region", getRegion(val));
                                form.setValue("home_sub_county", "");
                                form.setValue("home_parish", "");
                                form.setValue("home_village", "");
                              }}
                              options={filteredDistricts.map((d) => ({ value: d, label: d }))}
                              placeholder={locationsLoading ? "Loading..." : "Select District"}
                              disabled={locationsLoading}
                            />
                          </FormItem>
                        );
                      }} />

                      <FormField control={form.control} name="home_sub_county" render={({ field }) => {
                        const selectedDistrict = form.watch("home_district");
                        const subcounties = selectedDistrict ? getSubcounties(selectedDistrict) : [];
                        return (
                          <FormItem>
                            <FormLabel className="text-[10px]">Sub-county</FormLabel>
                            <SearchableSelectField
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("home_parish", "");
                                form.setValue("home_village", "");
                              }}
                              options={subcounties.map((sc) => ({ value: sc, label: sc }))}
                              placeholder={!selectedDistrict ? "Select District first" : "Select Sub-county"}
                              disabled={!selectedDistrict}
                            />
                          </FormItem>
                        );
                      }} />

                      <FormField control={form.control} name="home_parish" render={({ field }) => {
                        const selectedDistrict = form.watch("home_district");
                        const selectedSubcounty = form.watch("home_sub_county");
                        const parishes = (selectedDistrict && selectedSubcounty) ? getParishes(selectedDistrict, selectedSubcounty) : [];
                        return (
                          <FormItem>
                            <FormLabel className="text-[10px]">Parish</FormLabel>
                            <SearchableSelectField
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("home_village", "");
                              }}
                              options={parishes.map((p) => ({ value: p, label: p }))}
                              placeholder={!selectedSubcounty ? "Select Sub-county first" : "Select Parish"}
                              disabled={!selectedSubcounty}
                            />
                          </FormItem>
                        );
                      }} />

                      <FormField control={form.control} name="home_village" render={({ field }) => {
                        const selectedDistrict = form.watch("home_district");
                        const selectedSubcounty = form.watch("home_sub_county");
                        const selectedParish = form.watch("home_parish");
                        const villages = (selectedDistrict && selectedSubcounty && selectedParish) ? getVillages(selectedDistrict, selectedSubcounty, selectedParish) : [];
                        return (
                          <FormItem>
                            <FormLabel className="text-[10px]">Village Name</FormLabel>
                            <SearchableSelectField
                              value={field.value}
                              onValueChange={field.onChange}
                              options={villages.map((v) => ({ value: v, label: v }))}
                              placeholder={!selectedParish ? "Select Parish first" : "Select Village"}
                              disabled={!selectedParish}
                            />
                          </FormItem>
                        );
                      }} />
                    </div>

                    <div className="pt-2 border-t mt-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Residence</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="current_residence_town" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px]">Town / City</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="current_residence_street" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px]">Street / Road</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="pt-2 border-t mt-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Residence Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="residence_phone" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px]">Phone</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="residence_email" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px]">Email</FormLabel><FormControl><Input type="email" {...field} className="h-8" /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/20 rounded-xl border border-purple-100">
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest flex items-center gap-2 col-span-full">
                      <MapPin className="h-3.5 w-3.5" /> School Residence
                    </h4>
                    <FormField control={form.control} name="dormitory" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Dormitory</FormLabel><FormControl><Input {...field} className="h-9" placeholder="e.g. Dorm A" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="area" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Area / Village</FormLabel><FormControl><Input {...field} className="h-9" /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              )}

              {stepKey === "family" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-xl bg-blue-50/20 border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-3 uppercase text-xs">Father's Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="father_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="father_phone" render={({ field }) => (<FormItem><FormLabel>Telephone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="father_occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField control={form.control} name="father_email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="father_nin" render={({ field }) => (<FormItem><FormLabel>NIN</FormLabel><FormControl><Input {...field} className="font-mono uppercase" /></FormControl></FormItem>)} />
                      </div>
                    </div>
                    <div className="p-4 border rounded-xl bg-pink-50/20 border-pink-100">
                      <h4 className="font-bold text-pink-800 mb-3 uppercase text-xs">Mother's Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="mother_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="mother_phone" render={({ field }) => (<FormItem><FormLabel>Telephone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="mother_occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField control={form.control} name="mother_email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="mother_nin" render={({ field }) => (<FormItem><FormLabel>NIN</FormLabel><FormControl><Input {...field} className="font-mono uppercase" /></FormControl></FormItem>)} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-800 uppercase text-xs mb-3">Guardian / Primary Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="guardian_name" render={({ field }) => (<FormItem><FormLabel>Guardian Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="guardian_relationship" render={({ field }) => (<FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="Mother, Father, Uncle..." {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="parent_phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="256..." {...field} /></FormControl></FormItem>)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-700 text-xs uppercase">Next of Kin</h4>
                      <FormField control={form.control} name="next_of_kin_name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="next_of_kin_phone" render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="next_of_kin_address" render={({ field }) => (<FormItem><FormLabel>Street/Road</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="next_of_kin_work" render={({ field }) => (<FormItem><FormLabel>Place of Work</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-700 text-xs uppercase">Authorized Pick-up Person</h4>
                      <FormField control={form.control} name="authorized_person_name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="authorized_person_phone" render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/20 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-800 uppercase text-xs mb-3">Sponsorship</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="sponsorship_number" render={({ field }) => (<FormItem><FormLabel>Sponsorship No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="sponsorship_type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="sponsorship_agency" render={({ field }) => (<FormItem><FormLabel>Agency</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/20 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 uppercase text-xs mb-3">Orphan Status</h4>
                    <div className="space-y-4">
                      <FormField control={form.control} name="is_orphan" render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          <FormLabel>Mark as Orphan</FormLabel>
                        </FormItem>
                      )} />
                      {form.watch("is_orphan") && (
                        <>
                          <FormField control={form.control} name="orphan_status" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Orphan Status</FormLabel>
                              <SearchableSelectField
                                value={field.value}
                                onValueChange={field.onChange}
                                options={[
                                  { value: "registered", label: "Registered" },
                                  { value: "supported", label: "Supported" },
                                  { value: "sponsored", label: "Sponsored" },
                                  { value: "guardian", label: "Under Guardian Care" },
                                ]}
                                placeholder="Select status"
                              />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="orphan_notes" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Notes</FormLabel>
                              <FormControl><Textarea {...field} className="h-16" placeholder="Additional orphan-related notes..." /></FormControl>
                            </FormItem>
                          )} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {stepKey === "academic" && (
                <div className="space-y-6">
                  <div className="p-4 border rounded-xl bg-amber-50/20 border-amber-100">
                    <h4 className="font-bold text-amber-800 mb-3 uppercase text-xs">Former School</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="former_school_name" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>School Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="former_school_class" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Class</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <div className="mt-4">
                      <FormField control={form.control} name="former_school_year" render={({ field }) => (
                        <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                  <FormField control={form.control} name="siblings_info" render={({ field }) => (
                    <FormItem><FormLabel>Siblings in this school (Name and Class)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                  )} />

                  {/* Gallery Photos */}
                  <div className="space-y-4 p-4 border rounded-xl bg-slate-50 border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase">
                      <Camera className="h-4 w-4" /> Photo Gallery
                    </h4>
                    <p className="text-[11px] text-slate-500">Add additional photos of the learner.</p>
                    <div className="flex flex-wrap gap-3">
                      {galleryPreviews.map((preview, idx) => (
                        <div key={idx} className="relative h-20 w-20 rounded-lg border border-slate-200 overflow-hidden group">
                          <img src={preview} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryFile(idx)}
                            className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" className="relative h-20 w-20 border-dashed">
                        <Upload className="h-5 w-5 text-slate-400" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files?.length) addGalleryFiles(e.target.files);
                          }}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {stepKey === "medical" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-xl bg-emerald-50/10 border-emerald-100">
                      <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-2"><Stethoscope className="h-4 w-4" /> Medical History</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="has_asthma" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Asthma</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="has_hearing_impairment" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Hearing Imp.</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="has_diabetes" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Diabetes</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="has_epilepsy" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Epilepsy</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="has_visual_impairment" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Visual Imp.</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="has_sickle_cell" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Sickle Cell</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="has_heart_problems" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Heart Prob.</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="immunization_complete" render={({ field }) => (<FormItem className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel className="text-xs">Immunized</FormLabel></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField control={form.control} name="blood_group" render={({ field }) => (<FormItem><FormLabel>Blood Group</FormLabel><Input {...field} /></FormItem>)} />
                        <FormField control={form.control} name="allergies" render={({ field }) => (<FormItem><FormLabel>Allergies</FormLabel><Input {...field} /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="medication_details" render={({ field }) => (<FormItem><FormLabel>Regular Medication</FormLabel><Textarea {...field} className="h-16" /></FormItem>)} />
                    </div>

                    <div className="space-y-4 p-4 border rounded-xl bg-slate-50 border-slate-200">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4" /> EMIS & Govt ID</h4>
                      <FormField control={form.control} name="nin" render={({ field }) => (
                        <FormItem><FormLabel>Student NIN (NIRA No.)</FormLabel><FormControl><Input placeholder="CM..." maxLength={14} {...field} className="font-mono uppercase" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="lin" render={({ field }) => (
                        <FormItem><FormLabel>LIN Number (EMIS)</FormLabel><FormControl><Input placeholder="EMIS/..." {...field} className="font-mono" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="nira_document_type" render={({ field }) => (
                        <FormItem><FormLabel>NIRA Document Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />

                      <div className="mt-4">
                        <DocumentUpload documents={documents} onDocumentsChange={setDocuments} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </WizardForm>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
