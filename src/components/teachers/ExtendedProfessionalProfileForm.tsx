// @ts-nocheck
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  User, Mail, Phone, Calendar, GraduationCap, Briefcase, BookOpen,
  UploadCloud, FileCheck, Trash2, Loader2, Sparkles, FileText,
  Eye, Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUploadTeacherDocument, useTeacherDocuments, useDocumentSignedUrl, useDeleteTeacherDocument } from "@/hooks/useTeacherDocuments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ExtendedProfessionalProfileFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

const INPUT_CLASS = "pl-9 h-10";

export function ExtendedProfessionalProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  mode = "create",
  onCancel
}: ExtendedProfessionalProfileFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [qualification, setQualification] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [specializedSubjects, setSpecializedSubjects] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);

  const { data: documents = [], isLoading: docsLoading } = useTeacherDocuments(teacherId);
  const uploadDoc = useUploadTeacherDocument();
  const deleteDoc = useDeleteTeacherDocument();

  useEffect(() => {
    if (initialData) {
      setTeacherId(initialData.id);
      setEditingExisting(true);
      setFullName(initialData.full_name || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setQualification(initialData.qualification || "");
      setRegistrationNumber(initialData.registration_number || "");
      try {
        if (initialData.scope) {
          let parsed = null;
          if (typeof initialData.scope === "object") parsed = initialData.scope;
          else if (typeof initialData.scope === "string") {
            const t = initialData.scope.trim();
            if (t.startsWith("{") && t.endsWith("}")) parsed = JSON.parse(t);
          }
          if (parsed) {
            setDateOfBirth(parsed.date_of_birth || "");
            setSpecializedSubjects(parsed.specialized_subjects || "");
            setYearsOfExperience(parsed.years_of_experience || "");
          }
        }
      } catch (e) {}
    }
  }, [initialData]);

  const validateForm = () => {
    if (!fullName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return false;
    }
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      full_name: fullName,
      email,
      phone: phone || null,
      qualification: qualification || null,
      registration_number: registrationNumber || null,
      role: "teacher",
      date_of_birth: dateOfBirth,
      specialized_subjects: specializedSubjects,
      years_of_experience: yearsOfExperience,
      certifications: [],
    };
    await onSubmit(payload);
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!teacherId) {
      toast({ title: "Save the teacher profile first before uploading documents", variant: "destructive" });
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type. Only PDF, JPEG, PNG, WebP allowed", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large. Max 10MB", variant: "destructive" });
      return;
    }
    await uploadDoc.mutateAsync({ teacherId, file, documentType });
  };

  const handleFileInput = (documentType: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await handleFileUpload(documentType, file);
    };
    input.click();
  };

  const getMimeIcon = (mime: string | null) => {
    if (!mime) return <FileText className="h-10 w-10 text-slate-400" />;
    if (mime.startsWith("image/")) return <Eye className="h-10 w-10 text-blue-500" />;
    return <FileText className="h-10 w-10 text-red-500" />;
  };

  const DOCUMENT_TEMPLATES = [
    { id: "degree", label: "Academic Degree Certificate" },
    { id: "license", label: "National Teacher Registration License" },
    { id: "identity", label: "Valid National ID Card Copy" },
    { id: "curriculum_vitae", label: "Signed Curriculum Vitae (CV)" },
  ];

  const getDocForType = (typeId: string) => documents.find((d: any) => d.document_type === typeId);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="p-3 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> Extended Professional Profile Panel
        </div>
        <p className="text-xs text-muted-foreground">
          Capture verified qualifications, registration registries, birth indexes, and audited credentials according to EMIS compliance specifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
            <User className="h-4 w-4 text-primary" /> Primary Personal Identity
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher Full Name *</Label>
              <div className="relative">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Juliet Namubiru" className={INPUT_CLASS} required />
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institution Email Address *</Label>
              <div className="relative">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. Juliet.n@school.com" className={`${INPUT_CLASS} font-mono text-sm`} required />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Phone Contact</Label>
              <div className="relative">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +256 700 123456" className={INPUT_CLASS} />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</Label>
              <div className="relative">
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={INPUT_CLASS} />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Professional Onboarding Details
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Qualifications</Label>
              <div className="relative">
                <Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. Bachelor of Education (Science)" className={INPUT_CLASS} />
                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialized Teaching Subjects</Label>
              <div className="relative">
                <Input value={specializedSubjects} onChange={(e) => setSpecializedSubjects(e.target.value)} placeholder="e.g. Physics, Chemistry, Biology" className={INPUT_CLASS} />
                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years of Experience</Label>
                <div className="relative">
                  <Input type="number" min="0" max="50" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g. 5" className={INPUT_CLASS} />
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher License Registration No.</Label>
                <div className="relative">
                  <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="e.g. UTS-REG-10385" className={`${INPUT_CLASS} font-mono text-sm`} />
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
          <FileCheck className="h-4 w-4 text-primary" /> Professional Certifications & Audit Documents
        </h3>
        <p className="text-xs text-muted-foreground -mt-2">
          {editingExisting ? "Upload, view, and manage real credential documents." : "Save the teacher profile first, then upload documents from the edit view."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCUMENT_TEMPLATES.map((tmpl) => {
            const doc = getDocForType(tmpl.id);
            const isUploading = uploadDoc.isPending && uploadDoc.variables?.documentType === tmpl.id;
            return (
              <Card key={tmpl.id} className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-slate-300 transition duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                    {tmpl.label}
                  </span>
                  {doc ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 p-2.5 rounded-lg flex items-center justify-between text-xs mt-1.5 animate-fade-in">
                      <div className="truncate pr-2">
                        <p className="font-bold truncate">{doc.file_name}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : "—"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 shrink-0"
                          onClick={() => setViewingDoc(doc)} type="button" title="View Document">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-destructive hover:bg-rose-500/10 shrink-0"
                          onClick={() => { if (confirm("Delete this document?")) deleteDoc.mutate({ id: doc.id, filePath: doc.file_path }); }}
                          type="button" title="Delete Document">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1.5">No document uploaded</p>
                  )}
                </div>

                {!doc && (
                  <div className="mt-1">
                    {isUploading ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-primary">
                          <span>Uploading...</span>
                          <span>{uploadDoc.progress}%</span>
                        </div>
                        <Progress value={uploadDoc.progress} className="h-1.5" />
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50"
                        onClick={() => handleFileInput(tmpl.id)} type="button" disabled={!editingExisting}>
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

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px] shadow-lg shadow-primary/20">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Profile...</>
          ) : (
            <>{mode === "create" ? "Onboard Teacher" : "Save Changes"}</>
          )}
        </Button>
      </div>

      <DocumentViewerDialog doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </form>
  );
}

function DocumentViewerDialog({ doc, onClose }: { doc: any | null; onClose: () => void }) {
  const { data: signedUrl, isLoading } = useDocumentSignedUrl(doc?.file_path || null);

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
            Document Viewer — {doc?.document_type || ""}
          </DialogTitle>
        </DialogHeader>
        {doc && (
          <div className="space-y-4 mt-2">
            <div className="text-xs text-slate-500 space-y-1">
              <p><span className="font-bold text-slate-700">File:</span> {doc.file_name}</p>
              <p><span className="font-bold text-slate-700">Size:</span> {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center min-h-[200px]">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              ) : signedUrl ? (
                doc?.mime_type?.startsWith("image/") ? (
                  <img src={signedUrl} alt={doc.file_name} className="max-h-[400px] rounded-lg shadow-sm" />
                ) : (
                  <iframe src={signedUrl} className="w-full h-[400px] rounded-lg border" title={doc.file_name} />
                )
              ) : (
                <p className="text-sm text-muted-foreground">Could not load document</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs font-semibold" onClick={onClose}>Close</Button>
              {signedUrl && (
                <Button className="flex-1 text-xs font-semibold gap-1" onClick={() => window.open(signedUrl, "_blank")}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
