// @ts-nocheck
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface LogDocumentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, file: File | null) => Promise<void>;
  isLoading?: boolean;
}

const STEPS = [
  {
    id: "direction",
    title: "Document Direction",
    description: "Is this document coming in or going out?",
  },
  {
    id: "details",
    title: "Document Details",
    description: "Add the document information",
  },
  {
    id: "location",
    title: "Physical Location",
    description: "Where will this be stored?",
  },
  {
    id: "scan",
    title: "Upload Scan",
    description: "Optionally attach a digital copy",
  },
  {
    id: "review",
    title: "Review & Confirm",
    description: "Review your entries before saving",
  },
];

const CATEGORIES = [
  { value: "Circular", label: "Circular" },
  { value: "Invoice", label: "Invoice" },
  { value: "Letter", label: "Letter" },
  { value: "Policy", label: "Policy" },
  { value: "Report", label: "Report" },
  { value: "General", label: "General" },
];

export const LogDocumentWizard = ({ open, onOpenChange, onSubmit, isLoading }: LogDocumentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    direction: "inbound",
    category: "General",
    title: "",
    ref_number: "",
    sender_receiver_name: "",
    physical_location: "",
    notes: "",
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFile(null);
    setFormData({
      direction: "inbound",
      category: "General",
      title: "",
      ref_number: "",
      sender_receiver_name: "",
      physical_location: "",
      notes: "",
    });
    onOpenChange(false);
  };

  const handleSubmitWizard = async () => {
    if (!formData.title.trim()) {
      alert("Document title is required");
      return;
    }
    await onSubmit(formData, file);
    handleClose();
  };

  const stepKey = STEPS[currentStep].id;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{STEPS[currentStep].title}</DialogTitle>
          <DialogDescription>{STEPS[currentStep].description}</DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-6">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => {
                if (idx <= currentStep) setCurrentStep(idx);
              }}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                idx < currentStep
                  ? "bg-primary"
                  : idx === currentStep
                  ? "bg-primary"
                  : "bg-slate-200"
              }`}
              disabled={idx > currentStep}
              title={step.title}
            />
          ))}
        </div>

        {/* Step: Direction */}
        {stepKey === "direction" && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {["inbound", "outbound"].map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFormData({ ...formData, direction: dir })}
                  className={`p-6 rounded-xl border-2 transition-all text-center font-bold uppercase text-sm tracking-wider ${
                    formData.direction === dir
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/50"
                  }`}
                >
                  {dir === "inbound" ? "📥 Incoming" : "📤 Outgoing"}
                </button>
              ))}
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">
                {formData.direction === "inbound"
                  ? "Select this for documents received from external sources or Ministry"
                  : "Select this for documents being sent out from the school"}
              </p>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {stepKey === "details" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Ministry of Education Guidelines"
                className="border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  value={formData.ref_number}
                  onChange={(e) => setFormData({ ...formData, ref_number: e.target.value })}
                  placeholder="e.g. MOE/2024/001"
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                {formData.direction === "inbound" ? "Sender / Organization" : "Recipient / Organization"}
              </Label>
              <Input
                value={formData.sender_receiver_name}
                onChange={(e) => setFormData({ ...formData, sender_receiver_name: e.target.value })}
                placeholder="Entity name..."
                className="border-slate-300"
              />
            </div>
          </div>
        )}

        {/* Step: Location */}
        {stepKey === "location" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Physical Storage Location</Label>
              <Input
                value={formData.physical_location}
                onChange={(e) => setFormData({ ...formData, physical_location: e.target.value })}
                placeholder="e.g. Cabinet B, Tray 1 or Shelf A-3"
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special handling or storage notes..."
                rows={4}
                className="border-slate-300"
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">💡 Tip:</p>
              <p className="text-sm text-blue-600 mt-1">Use a consistent naming convention for easy retrieval, e.g. "Cabinet A1", "Filing Box 3"</p>
            </div>
          </div>
        )}

        {/* Step: Scan */}
        {stepKey === "scan" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload Scanned Copy (Optional)</Label>
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/50">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  className="hidden"
                  id="doc-file-upload"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="doc-file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileUp className="h-6 w-6 text-primary" />
                  </div>
                  {file ? (
                    <>
                      <p className="text-sm font-bold text-primary">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold">Click to upload scan</p>
                      <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG, TIFF (max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 font-medium">📎 File Upload:</p>
              <p className="text-sm text-amber-600 mt-1">You can add a scanned copy now or skip and add it later</p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {stepKey === "review" && (
          <div className="space-y-4 py-4">
            <Card className="bg-slate-50 border-slate-200 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Direction</p>
                  <p className="text-sm font-bold capitalize mt-1">{formData.direction}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Category</p>
                  <p className="text-sm font-bold mt-1">{formData.category}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Document Title</p>
                  <p className="text-sm font-bold mt-1">{formData.title || "—"}</p>
                </div>
                {formData.ref_number && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Reference #</p>
                    <p className="text-sm font-bold mt-1">{formData.ref_number}</p>
                  </div>
                )}
                {formData.sender_receiver_name && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Entity</p>
                    <p className="text-sm font-bold mt-1">{formData.sender_receiver_name}</p>
                  </div>
                )}
                {formData.physical_location && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Physical Location</p>
                    <p className="text-sm font-bold mt-1">{formData.physical_location}</p>
                  </div>
                )}
                {file && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Scan Attached</p>
                    <Badge variant="outline" className="mt-1">📎 {file.name}</Badge>
                  </div>
                )}
              </div>
            </Card>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-700">Ready to save</p>
                <p className="text-sm text-green-600 mt-1">Click "Confirm Entry" below to save this document to the registry</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {!isLastStep ? (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmitWizard} disabled={isLoading || !formData.title.trim()} className="gap-2">
              {isLoading ? "Saving..." : "Confirm Entry"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
