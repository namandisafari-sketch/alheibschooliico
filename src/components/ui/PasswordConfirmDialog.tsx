// @ts-nocheck
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELETE_PASSWORD } from "@/config/deletePassword";

interface PasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  actionLabel?: string;
  onSuccess: () => Promise<void> | void;
  loading?: boolean;
}

export function PasswordConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Confirm",
  onSuccess,
  loading: externalLoading,
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  const handleConfirm = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    if (password !== DELETE_PASSWORD) {
      setError("Incorrect password. Only the admin can perform this action.");
      return;
    }

    setError("");
    setInternalLoading(true);
    try {
      await onSuccess();
      setPassword("");
    } catch (e: any) {
      setError(e.message || "Action failed");
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => { if (!loading) onOpenChange(val); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>{description}</div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-xs font-medium text-foreground">
                Admin Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                autoFocus
                className={cn(error && "border-destructive")}
              />
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading || !password}
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


