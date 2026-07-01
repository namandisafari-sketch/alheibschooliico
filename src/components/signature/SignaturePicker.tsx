import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PenLine, Loader2 } from "lucide-react";
import { useUserSignatures, useActiveSignature } from "@/hooks/useUserSignatures";
import { cn } from "@/lib/utils";

interface SignaturePickerProps {
  onSign: (imageUrl: string) => void;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const SignaturePicker = ({
  onSign,
  label = "Sign",
  variant = "outline",
  size = "sm",
  className,
}: SignaturePickerProps) => {
  const [open, setOpen] = useState(false);
  const { data: signatures = [], isLoading } = useUserSignatures();
  const { data: activeSig } = useActiveSignature();

  const handleSign = (imageUrl: string) => {
    onSign(imageUrl);
    setOpen(false);
  };

  const handleQuickSign = () => {
    if (activeSig) {
      onSign(activeSig.image_url);
    } else {
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {activeSig ? (
        <Button
          variant={variant}
          size={size}
          className={cn("gap-1.5", className)}
          onClick={handleQuickSign}
          title={`Sign with "${activeSig.label}"`}
        >
          <PenLine className="h-3.5 w-3.5" />
          {label}
        </Button>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("gap-1.5", className)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PenLine className="h-3.5 w-3.5" />
            )}
            {label}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            Choose Signature
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : signatures.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No signatures saved</p>
            <p className="text-xs mt-1">Go to Account Settings to upload one</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Select a signature to apply:</p>
            {signatures.map((sig) => (
              <button
                key={sig.id}
                type="button"
                onClick={() => handleSign(sig.image_url)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                  sig.is_active ? "border-primary/30 bg-primary/5" : "border-border"
                )}
              >
                <div className="h-10 w-20 shrink-0 rounded border border-border bg-white flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={sig.image_url}
                    alt={sig.label}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{sig.label}</p>
                  {sig.is_active && (
                    <span className="text-[10px] text-primary font-medium">Active</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
