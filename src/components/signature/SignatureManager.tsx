import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Upload, Trash2, Star, Loader2, AlertCircle, Crop } from "lucide-react";
import { useUserSignatures, useUploadSignature, useSetActiveSignature, useDeleteSignature } from "@/hooks/useUserSignatures";
import { cn } from "@/lib/utils";
import { SignatureCropper } from "./SignatureCropper";

export const SignatureManager = () => {
  const { data: signatures = [], isLoading } = useUserSignatures();
  const uploadMutation = useUploadSignature();
  const setActiveMutation = useSetActiveSignature();
  const deleteMutation = useDeleteSignature();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG)");
      return;
    }
    setCropFile(file);
  };

  const handleCropped = async (blob: Blob) => {
    const sigLabel = label.trim() || `Signature ${signatures.length + 1}`;
    const croppedFile = new File([blob], "signature.png", { type: "image/png" });
    await uploadMutation.mutateAsync({ file: croppedFile, label: sigLabel });
    setLabel("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4 text-primary" />
          Signature Management
        </CardTitle>
        <CardDescription className="text-xs">
          Upload your signature to use on letters, documents, and approvals.
          For best results, use a PNG with transparent background (use the background remover tool first).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">Drop your signature image here</p>
          <p className="text-xs text-muted-foreground mb-3">PNG with transparency recommended</p>
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <Input
              placeholder="Label (e.g. My Signature)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 h-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Upload
            </Button>
          </div>
        </div>

        {/* Saved Signatures */}
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : signatures.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <PenLine className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No signatures saved yet</p>
            <p className="text-xs">Upload your signature above to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{signatures.length} signature{signatures.length > 1 ? "s" : ""} saved</p>
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  sig.is_active ? "border-primary/30 bg-primary/5" : "border-border"
                )}
              >
                <div className="h-12 w-24 shrink-0 rounded border border-border bg-white flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={sig.image_url}
                    alt={sig.label}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{sig.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sig.is_active ? "Active" : "Click star to set active"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setActiveMutation.mutate(sig.id)}
                    disabled={sig.is_active || setActiveMutation.isPending}
                    title="Set as active signature"
                  >
                    <Star className={cn("h-3.5 w-3.5", sig.is_active ? "fill-primary text-primary" : "text-muted-foreground")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Delete this signature?")) deleteMutation.mutate(sig); }}
                    disabled={deleteMutation.isPending}
                    title="Delete signature"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground">
            Use the <strong>background remover tool</strong> on your PC first to clean your signature,
            then upload the PNG. After selecting a file you can <strong>crop</strong> it to the perfect size.
            The active signature will be used automatically when you sign documents.
          </p>
        </div>
      </CardContent>

      <SignatureCropper
        file={cropFile!}
        open={!!cropFile}
        onClose={() => setCropFile(null)}
        onCropped={handleCropped}
      />
    </Card>
  );
};
