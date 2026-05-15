import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Loader2, Eye, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadedDocument {
  id?: string;
  file: File;
  type: string;
  status: "pending" | "uploading" | "uploaded" | "ocr_processing" | "completed" | "error";
  filePath?: string;
  ocrData?: any;
  errorMessage?: string;
}

interface DocumentUploadProps {
  learnerId?: string;
  onDocumentsChange?: (docs: UploadedDocument[]) => void;
  documents?: UploadedDocument[];
}

const DOCUMENT_TYPES = [
  { value: "guardian_id", label: "Guardian/Parent ID" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "academic_report", label: "Previous Academic Report" },
  { value: "medical_record", label: "Medical Records" },
  { value: "other", label: "Other Document" },
];

export function DocumentUpload({ learnerId, onDocumentsChange, documents = [] }: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!selectedType) {
      toast({
        title: "Select Document Type",
        description: "Please select the document type before uploading",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];
    
    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF or image files (JPEG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    const newDoc: UploadedDocument = {
      file,
      type: selectedType,
      status: "pending",
    };

    const updatedDocs = [...documents, newDoc];
    onDocumentsChange?.(updatedDocs);

    // Reset the input and selection
    e.target.value = "";
    setSelectedType("");
  };

  const removeDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    onDocumentsChange?.(updatedDocs);
  };

  const uploadDocuments = async (learnerId: string) => {
    setIsUploading(true);
    const results: UploadedDocument[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (doc.status === "completed" || doc.status === "uploaded") {
        results.push(doc);
        continue;
      }

      try {
        // Update status to uploading
        const updatingDocs = [...documents];
        updatingDocs[i] = { ...doc, status: "uploading" };
        onDocumentsChange?.(updatingDocs);

        // Generate unique file path
        const fileExt = doc.file.name.split(".").pop();
        const filePath = `${learnerId}/${doc.type}/${Date.now()}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("learner-documents")
          .upload(filePath, doc.file);

        if (uploadError) throw uploadError;

        // Create document record
        const { data: docRecord, error: dbError } = await supabase
          .from("learner_documents")
          .insert({
            learner_id: learnerId,
            document_type: doc.type,
            file_name: doc.file.name,
            file_path: filePath,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            ocr_status: "pending",
          })
          .select("id")
          .single();

        if (dbError) throw dbError;

        // Update status to uploaded
        const uploadedDoc: UploadedDocument = {
          ...doc,
          id: docRecord.id,
          status: "uploaded",
          filePath,
        };
        results.push(uploadedDoc);

        // Trigger OCR in background
        triggerOCR(docRecord.id, filePath, doc.type);

      } catch (error) {
        console.error("Upload error:", error);
        results.push({
          ...doc,
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    onDocumentsChange?.(results);
    setIsUploading(false);
    return results;
  };

  const triggerOCR = async (documentId: string, filePath: string, documentType: string) => {
    try {
      const { error } = await supabase.functions.invoke("ocr-extract", {
        body: { documentId, filePath, documentType },
      });

      if (error) {
        console.error("OCR trigger error:", error);
      }
    } catch (error) {
      console.error("OCR trigger error:", error);
    }
  };

  const getStatusBadge = (status: UploadedDocument["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending Upload</Badge>;
      case "uploading":
        return <Badge variant="outline" className="animate-pulse">Uploading...</Badge>;
      case "uploaded":
        return <Badge variant="default">Uploaded</Badge>;
      case "ocr_processing":
        return <Badge variant="outline" className="animate-pulse">Processing OCR...</Badge>;
      case "completed":
        return <Badge className="bg-green-600">OCR Complete</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  // Expose uploadDocuments function through ref or callback
  // For now, we'll make it available through a prop pattern
  (DocumentUpload as any).uploadDocuments = uploadDocuments;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Confidential Documents
        </CardTitle>
        <CardDescription>
          Upload scanned copies of important documents. Use high-quality scanners for best OCR results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            For best OCR accuracy, scan documents at 300 DPI or higher using a flatbed scanner. 
            Avoid phone camera captures as they may produce poor results.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <div className="flex-1">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                disabled={!selectedType || isUploading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Add File
                </span>
              </Button>
            </Label>
            <Input
              id="doc-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={!selectedType || isUploading}
            />
          </div>
        </div>

        {documents.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Queued Documents</Label>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file.name}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(doc.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    {doc.status === "pending" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper hook for parent components to trigger upload
export function useDocumentUpload() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadAll = async (learnerId: string) => {
    setIsUploading(true);
    const results: UploadedDocument[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (doc.status === "completed" || doc.status === "uploaded") {
        results.push(doc);
        continue;
      }

      try {
        setDocuments((prev) =>
          prev.map((d, idx) => (idx === i ? { ...d, status: "uploading" } : d))
        );

        const fileExt = doc.file.name.split(".").pop();
        const filePath = `${learnerId}/${doc.type}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("learner-documents")
          .upload(filePath, doc.file);

        if (uploadError) throw uploadError;

        const { data: docRecord, error: dbError } = await supabase
          .from("learner_documents")
          .insert({
            learner_id: learnerId,
            document_type: doc.type,
            file_name: doc.file.name,
            file_path: filePath,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            ocr_status: "pending",
          })
          .select("id")
          .single();

        if (dbError) throw dbError;

        results.push({ ...doc, id: docRecord.id, status: "uploaded", filePath });

        // Trigger OCR in background
        supabase.functions.invoke("ocr-extract", {
          body: { documentId: docRecord.id, filePath, documentType: doc.type },
        });

      } catch (error) {
        console.error("Upload error:", error);
        results.push({
          ...doc,
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    setDocuments(results);
    setIsUploading(false);
    return results;
  };

  return { documents, setDocuments, uploadAll, isUploading };
}
