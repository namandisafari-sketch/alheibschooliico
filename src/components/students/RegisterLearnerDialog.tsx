// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClasses } from "@/hooks/useClasses";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Users, Heart, School, ShieldCheck, Stethoscope, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useDocumentUpload } from "./DocumentUpload";
import { DocumentUpload } from "./DocumentUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";

const formSchema = z.object({
  // Personal Information
  last_name: z.string().trim().min(2, "Surname is required").max(100),
  first_name: z.string().trim().min(2, "First name is required").max(100),
  gender: z.enum(["male", "female"], { required_error: "Select gender" }),
  date_of_birth: z.string().optional(),
  age_years: z.string().optional(),
  nationality: z.string().default("Ugandan"),
  religion: z.string().default("Islam"),
  class_id: z.string().optional(),
  boarding_status: z.enum(["day", "boarding"]).default("day"),
  pupil_status: z.string().default("Paying"),
  house: z.string().optional(),
  
  // Dates
  application_date: z.string().default(new Date().toISOString().split('T')[0]),
  admission_date: z.string().default(new Date().toISOString().split('T')[0]),

  // Residence
  home_region: z.string().optional(),
  home_district: z.string().optional(),
  home_sub_county: z.string().optional(),
  home_parish: z.string().optional(),
  current_residence_town: z.string().optional(),
  current_residence_street: z.string().optional(),
  residence_phone: z.string().optional(),
  residence_email: z.string().optional(),
  
  // Father's Information
  father_name: z.string().optional(),
  father_phone: z.string().optional(),
  father_email: z.string().optional(),
  father_occupation: z.string().optional(),
  father_nin: z.string().optional(),
  
  // Mother's Information
  mother_name: z.string().optional(),
  mother_phone: z.string().optional(),
  mother_email: z.string().optional(),
  mother_occupation: z.string().optional(),
  mother_nin: z.string().optional(),
  
  // Academic History
  former_school_name: z.string().optional(),
  former_school_class: z.string().optional(),
  former_school_year: z.string().optional(),
  siblings_info: z.string().optional(),
  
  // Medical Information
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
  chronic_diseases_text: z.string().optional(),
  medication_details: z.string().optional(),
  
  // Condition Checkboxes
  has_asthma: z.boolean().default(false),
  has_hearing_impairment: z.boolean().default(false),
  has_diabetes: z.boolean().default(false),
  has_epilepsy: z.boolean().default(false),
  has_visual_impairment: z.boolean().default(false),
  has_sickle_cell: z.boolean().default(false),
  has_heart_problems: z.boolean().default(false),
  immunization_complete: z.boolean().default(false),
  
  // EMIS & Admin
  nin: z.string().optional(),
  lin: z.string().optional(),
  
  // Next of Kin / Authorized Person
  next_of_kin_name: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
  next_of_kin_address: z.string().optional(),
  next_of_kin_work: z.string().optional(),
  authorized_person_name: z.string().optional(),
  authorized_person_phone: z.string().optional(),
  
  // Account
  guardian_name: z.string().min(2, "Contact name is required"),
  guardian_phone: z.string().min(10, "Contact phone is required"),
  guardian_email: z.string().email().optional().or(z.literal("")),
  create_parent_account: z.boolean().default(true),
  parent_password: z.string().min(6).optional(),
}).refine((data) => {
  if (data.create_parent_account && !data.parent_password) return false;
  return true;
}, {
  message: "Password is required for parent account",
  path: ["parent_password"],
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterLearnerDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const queryClient = useQueryClient();
  const { data: classes = [] } = useClasses();
  const { documents, setDocuments, uploadAll, isUploading: isUploadingDocs } = useDocumentUpload();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: undefined,
      nationality: "Ugandan",
      religion: "Islam",
      boarding_status: "day",
      pupil_status: "Paying",
      application_date: new Date().toISOString().split('T')[0],
      admission_date: new Date().toISOString().split('T')[0],
      create_parent_account: true,
      has_asthma: false,
      has_hearing_impairment: false,
      has_diabetes: false,
      has_epilepsy: false,
      has_visual_impairment: false,
      has_sickle_cell: false,
      has_heart_problems: false,
      immunization_complete: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let parentUserId: string | null = null;
      if (values.create_parent_account && values.guardian_email && values.parent_password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.guardian_email,
          password: values.parent_password,
          options: { data: { full_name: values.guardian_name, phone: values.guardian_phone } },
        });
        if (authError && !authError.message.includes("already registered")) throw authError;
        parentUserId = authData.user?.id || null;
      }

      const { data: guardian, error: gError } = await supabase
        .from("guardians")
        .insert({
          full_name: values.guardian_name,
          phone: values.guardian_phone,
          email: values.guardian_email || null,
          relationship: "parent",
        })
        .select("id").single();
      if (gError) throw gError;

      const { data: learner, error: lError } = await supabase.from("learners").insert({
        full_name: `${values.last_name} ${values.first_name}`,
        first_name: values.first_name,
        last_name: values.last_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth || null,
        age_years: values.age_years ? parseInt(values.age_years) : null,
        class_id: values.class_id || null,
        guardian_id: guardian.id,
        religion: values.religion,
        nin: values.nin || null,
        lin: values.lin || null,
        nationality: values.nationality,
        current_residence_town: values.current_residence_town,
        current_residence_street: values.current_residence_street,
        residence_phone: values.residence_phone,
        residence_email: values.residence_email,
        former_school_name: values.former_school_name,
        former_school_class: values.former_school_class,
        former_school_year: values.former_school_year,
        siblings_in_school: values.siblings_info,
        boarding_status: values.boarding_status,
        pupil_status: values.pupil_status,
        house: values.house,
        blood_group: values.blood_group,
        allergies: values.allergies,
        chronic_diseases: values.chronic_diseases_text,
        medication_details: values.medication_details,
        has_asthma: values.has_asthma,
        has_hearing_impairment: values.has_hearing_impairment,
        has_diabetes: values.has_diabetes,
        has_epilepsy: values.has_epilepsy,
        has_eye_defects: values.has_visual_impairment,
        has_sickle_cell: values.has_sickle_cell,
        has_heart_problems: values.has_heart_problems,
        immunization_complete: values.immunization_complete,
        father_name: values.father_name,
        father_phone: values.father_phone,
        father_email: values.father_email,
        father_occupation: values.father_occupation,
        father_nin: values.father_nin,
        mother_name: values.mother_name,
        mother_phone: values.mother_phone,
        mother_email: values.mother_email,
        mother_occupation: values.mother_occupation,
        mother_nin: values.mother_nin,
        home_region: values.home_region,
        home_district: values.home_district,
        home_sub_county: values.home_sub_county,
        home_parish: values.home_parish,
        next_of_kin: {
          name: values.next_of_kin_name,
          phone: values.next_of_kin_phone,
          address: values.next_of_kin_address,
          place_of_work: values.next_of_kin_work
        },
        authorized_pick_up: {
          name: values.authorized_person_name,
          phone: values.authorized_person_phone
        }
      }).select("id").single();
      if (lError) throw lError;

      if (parentUserId && learner) {
        await supabase.from("parent_learner_links").insert({
          parent_user_id: parentUserId,
          learner_id: learner.id,
          relationship: "parent",
        });
      }

      if (documents.length > 0 && learner) await uploadAll(learner.id);
      return learner;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Learner registered with full bio-data profile." });
      queryClient.invalidateQueries({ queryKey: ["learners"] });
      setOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            Official Pupil Registration
          </DialogTitle>
          <DialogDescription>
            Alheib Primary School Bio-Data Form (Uganda Dual Curriculum Compliant)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-6">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="parents">Family</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="medical">Medical/EMIS</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem><FormLabel>Surname / Family Name *</FormLabel><FormControl><Input placeholder="BLOCK LETTERS" {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <SearchableSelect
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
                      <SearchableSelect
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
                  <FormField control={form.control} name="boarding_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility Type (Boarding/Day)</FormLabel>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { value: "day", label: "Day" },
                          { value: "boarding", label: "Boarding" }
                        ]}
                        placeholder="Select type"
                      />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pupil_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pupil Status</FormLabel>
                      <SearchableSelect
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
                      <SearchableSelect
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
                      <FormLabel>Class Admitted To *</FormLabel>
                      <SearchableSelect
                        options={classes.map(c => ({ value: c.id, label: c.name }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select Class"
                      />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Home / Permanent Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField control={form.control} name="home_region" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px]">Region</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="home_district" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px]">District</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="home_sub_county" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px]">Sub-county</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="home_parish" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px]">Parish</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                    )} />
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
                </div>
              </TabsContent>

              <TabsContent value="parents" className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-xl bg-blue-50/20 border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-3 uppercase text-xs">Father's Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="father_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="father_phone" render={({ field }) => (<FormItem><FormLabel>Telephone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="father_occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl bg-pink-50/20 border-pink-100">
                    <h4 className="font-bold text-pink-800 mb-3 uppercase text-xs">Mother's Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="mother_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="mother_phone" render={({ field }) => (<FormItem><FormLabel>Telephone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="mother_occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
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

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h4 className="font-bold text-primary uppercase text-xs mb-3">Primary Account Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="guardian_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="guardian_phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="guardian_email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (For Account)</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="create_parent_account" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-8"><Checkbox checked={field.value} onCheckedChange={field.onChange} /><FormLabel>Create Portal Account</FormLabel></FormItem>)} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="space-y-6">
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
                </div>
                <FormField control={form.control} name="siblings_info" render={({ field }) => (
                  <FormItem><FormLabel>Siblings in this school (Name and Class)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                )} />
              </TabsContent>

              <TabsContent value="medical" className="space-y-6">
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
                    <DocumentUpload documents={documents} onDocumentsChange={setDocuments} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t bg-white">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending || isUploadingDocs} className="min-w-[200px]">
                {(mutation.isPending || isUploadingDocs) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}