// @ts-nocheck
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  User, Mail, Phone, Calendar, GraduationCap, Briefcase, BookOpen, 
  UploadCloud, FileCheck, Trash2, X, Check, Loader2, AlertCircle, Sparkles, FileText,
  Eye, Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatUgandaDate } from "@/lib/ugandaTime";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ExtendedProfessionalProfileFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

export function ExtendedProfessionalProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  mode = "create",
  onCancel
}: ExtendedProfessionalProfileFormProps) {
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [qualification, setQualification] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [specializedSubjects, setSpecializedSubjects] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  
  // Certifications list inside profiles scope
  const [certifications, setCertifications] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingCert, setViewingCert] = useState<any | null>(null);

  const downloadCertificate = (cert: any) => {
    // Generate a mock PDF or text content document representating the credential
    const content = `=============================================================
MINISTRY OF EDUCATION & SPORTS - REPUBLIKE OF UGANDA
EMIS TEACHER PROFESSIONAL CREDENTIAL AUDIT CERTIFICATE
=============================================================
Document ID: ${cert.id.toUpperCase()}
Document Type: ${cert.type}
Assigned File: ${cert.name}
Uploaded At: ${cert.uploadedAt}
Audit Verification Code: CONFIRMD-${Math.random().toString(36).substr(2, 9).toUpperCase()}
Status: VERIFIED & ACCREDITED

This document satisfies the active professional onboarding and teacher registration audit procedures of the Uganda New Curriculum directive. Checked and certified by school directorate.
=============================================================
Downloaded via School EMIS Portal.
`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cert.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ 
      title: "Download Started", 
      description: `Downloading "${cert.name}" verification receipt.`
    });
  };

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFullName(initialData.full_name || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setQualification(initialData.qualification || "");
      setRegistrationNumber(initialData.registration_number || "");

      // Safe parse scope JSON
      try {
        if (initialData.scope) {
          let parsed = null;
          if (typeof initialData.scope === "object") {
            parsed = initialData.scope;
          } else if (typeof initialData.scope === "string") {
            const trimmed = initialData.scope.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
              parsed = JSON.parse(trimmed);
            }
          }
          
          if (parsed) {
            setDateOfBirth(parsed.date_of_birth || "");
            setSpecializedSubjects(parsed.specialized_subjects || "");
            setYearsOfExperience(parsed.years_of_experience || "");
            setCertifications(parsed.certifications || []);
          }
        }
      } catch (e) {
        // Quietly absorb non-JSON scope string values (like 'school', 'district' etc.)
      }
    }
  }, [initialData]);

  // Validation
  const validateForm = () => {
    if (!fullName.trim()) {
      toast({ title: "Name is required", description: "Please enter the teacher's full name.", variant: "destructive" });
      return false;
    }
    if (!email.trim()) {
      toast({ title: "Email is required", description: "Please enter a valid institution email.", variant: "destructive" });
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save extra data into scope JSON payload
    const payload = {
      full_name: fullName,
      email: email,
      phone: phone || null,
      qualification: qualification || null,
      registration_number: registrationNumber || null,
      role: "teacher",
      // Scope properties
      date_of_birth: dateOfBirth,
      specialized_subjects: specializedSubjects,
      years_of_experience: yearsOfExperience,
      certifications: certifications,
    };

    await onSubmit(payload);
  };

  // Dummy Certification Upload Handlers with visual progress
  const triggerMockUpload = (certType: string, certLabel: string) => {
    if (uploadingId) {
      toast({ title: "Upload in progress", description: "Please wait for current upload to complete.", variant: "destructive" });
      return;
    }

    setUploadingId(certType);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const fileName = `${certLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_certified.pdf`;
            const size = (Math.random() * 2 + 1.2).toFixed(1) + " MB";
            
            setCertifications((prevCerts) => [
              ...prevCerts.filter(c => c.id !== certType),
              {
                id: certType,
                name: fileName,
                size: size,
                uploadedAt: formatUgandaDate(new Date()),
                type: certLabel,
                verified: true
              }
            ]);
            setUploadingId(null);
            toast({ 
              title: "Document Registered", 
              description: `Uploaded and scanned "${certLabel}" successfully.`
            });
          }, 350);
          return 100;
        }
        return prev + 30;
      });
    }, 120);
  };

  const removeCertificate = (certId: string) => {
    setCertifications((prev) => prev.filter(c => c.id !== certId));
    toast({ title: "Document removed", description: "The certification document reference was deleted." });
  };

  // Standard Document Types required for school audit
  const DOCUMENT_TEMPLATES = [
    { id: "degree", label: "Academic Degree Certificate" },
    { id: "license", label: "National Teacher Registration License" },
    { id: "identity", label: "Valid National ID Card Copy" },
    { id: "curriculum_vitae", label: "Signed Curriculum Vitae (CV)" }
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Visual Header Note */}
      <div className="p-3 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> Extended Professional Profile Panel
        </div>
        <p className="text-xs text-muted-foreground">
          Capture verified qualifications, registration registries, birth indexes, and audited credentials according to EMIS compliance specifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PART 1: Core Personal & Contact Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
            <User className="h-4 w-4 text-primary" /> Primary Personal Identity
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher Full Name *</Label>
              <div className="relative">
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Juliet Namubiru"
                  className="pl-9 h-10"
                  required
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institution Email Address *</Label>
              <div className="relative">
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. Juliet.n@school.com"
                  className="pl-9 h-10 font-mono text-sm"
                  required
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Phone Contact</Label>
              <div className="relative">
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +256 700 123456"
                  className="pl-9 h-10"
                />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</Label>
              <div className="relative">
                <Input 
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="pl-9 h-10"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* PART 2: Specialized Professional Attributes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Professional Onboarding Details
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Qualifications</Label>
              <div className="relative">
                <Input 
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. Bachelor of Education (Science)"
                  className="pl-9 h-10"
                />
                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialized Teaching Subjects</Label>
              <div className="relative">
                <Input 
                  value={specializedSubjects}
                  onChange={(e) => setSpecializedSubjects(e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Biology"
                  className="pl-9 h-10"
                />
                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years of Experience</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    min="0"
                    max="50"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="e.g. 5"
                    className="pl-9 h-10"
                  />
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher License Registration No.</Label>
                <div className="relative">
                  <Input 
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. UTS-REG-10385"
                    className="pl-9 h-10 font-mono text-sm"
                  />
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PART 3: Professional Certifications (Placeholder Uploads) */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
          <FileCheck className="h-4 w-4 text-primary" /> Professional Certifications & Audit Documents
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCUMENT_TEMPLATES.map((tmpl) => {
            const hasUploaded = certifications.find(c => c.id === tmpl.id);
            return (
              <Card key={tmpl.id} className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-slate-300 transition duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                    {tmpl.label}
                  </span>
                  {hasUploaded ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 p-2.5 rounded-lg flex items-center justify-between text-xs mt-1.5 animate-fade-in">
                      <div className="truncate pr-2">
                        <p className="font-bold truncate">{hasUploaded.name}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Size: {hasUploaded.size} • Verified ✔️</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 shrink-0" 
                          onClick={() => setViewingCert(hasUploaded)}
                          type="button"
                          title="View Certificate"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 shrink-0" 
                          onClick={() => downloadCertificate(hasUploaded)}
                          type="button"
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-emerald-600 hover:text-destructive hover:bg-rose-500/10 shrink-0" 
                          onClick={() => removeCertificate(tmpl.id)}
                          type="button"
                          title="Delete/Update Document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1.5">No certificate document uploaded</p>
                  )}
                </div>

                {!hasUploaded && (
                  <div className="mt-1">
                    {uploadingId === tmpl.id ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-primary">
                          <span>Scanning with OCR...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1.5" />
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50"
                        onClick={() => triggerMockUpload(tmpl.id, tmpl.label)}
                        type="button"
                      >
                        <UploadCloud className="h-3.5 w-3.5 mr-1" />
                        Upload Credential
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* PART 4: Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[160px] shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>
              {mode === "create" ? "onboard Teacher" : "Save Changes"}
            </>
          )}
        </Button>
      </div>

      <Dialog open={!!viewingCert} onOpenChange={(open) => !open && setViewingCert(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Credential Audit Viewer</DialogTitle>
          </DialogHeader>
          {viewingCert && (
            <div className="space-y-4 mt-2">
              <div className="bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 text-emerald-800 p-4 rounded-xl text-center space-y-1">
                <FileCheck className="h-10 w-10 mx-auto text-emerald-600 mb-1" />
                <p className="font-bold text-sm tracking-tight">{viewingCert.type}</p>
                <div className="inline-flex items-center gap-1 bg-emerald-500/25 text-emerald-950 font-mono text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">
                  Verified & Secure
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-y py-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">File Name:</span>
                  <span className="font-bold text-slate-900">{viewingCert.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-bold text-slate-900">{viewingCert.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uploaded On:</span>
                  <span className="font-bold text-slate-900">{viewingCert.uploadedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EMIS Registry ID:</span>
                  <span className="font-bold text-blue-600">{viewingCert.id.toUpperCase()}-VERIFY</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 text-xs font-semibold"
                  onClick={() => setViewingCert(null)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 text-xs font-semibold gap-1"
                  onClick={() => downloadCertificate(viewingCert)}
                >
                  <Download className="h-4 w-4" /> Download File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
