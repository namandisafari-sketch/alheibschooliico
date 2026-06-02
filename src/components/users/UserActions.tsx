// @ts-nocheck
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  ShieldAlert, 
  Trash2, 
  Key, 
  UserCheck,
  KeyRound,
  AlertTriangle,
  MessageSquare,
  ShieldOff,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UserActionsProps {
  user: any; // User type from UserManagement
  onManagePermissions?: () => void;
  onWarn?: () => void;
  onMessage?: () => void;
  onStatusToggle?: () => void;
  onChangeRole?: () => void;
}

export const UserActions = ({ 
  user,
  onManagePermissions,
  onWarn,
  onMessage,
  onStatusToggle,
  onChangeRole
}: UserActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleResetPassword = async () => {
    if (!user.email) {
      toast({ title: "No email on file", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?reset=1`,
      });
      if (error) throw error;
      toast({ 
        title: "Reset link sent", 
        description: `Password reset instructions have been sent to ${user.email}.` 
      });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);
      if (error) throw error;
      
      toast({ title: "User deleted", description: `${user.full_name}'s account has been removed.` });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Account Controls</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetPassword}>
            <Key className="mr-2 h-4 w-4 text-zinc-400" /> Reset Password
          </DropdownMenuItem>
          {onManagePermissions && (
            <DropdownMenuItem onClick={onManagePermissions}>
              <KeyRound className="mr-2 h-4 w-4 text-purple-500" /> Manage Permissions
            </DropdownMenuItem>
          )}
          {onWarn && (
            <DropdownMenuItem onClick={onWarn}>
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> Warn User
            </DropdownMenuItem>
          )}
          {onMessage && (
            <DropdownMenuItem onClick={onMessage}>
              <MessageSquare className="mr-2 h-4 w-4 text-blue-500" /> Send Message
            </DropdownMenuItem>
          )}
          {onChangeRole && (
            <DropdownMenuItem onClick={onChangeRole}>
              <ShieldAlert className="mr-2 h-4 w-4 text-pink-500" /> Change Role
            </DropdownMenuItem>
          )}
          {onStatusToggle && (user.account_status === "active" || !user.account_status ? (
            <DropdownMenuItem onClick={onStatusToggle} className="text-destructive focus:text-destructive">
              <ShieldOff className="mr-2 h-4 w-4" /> Disconnect Account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onStatusToggle} className="text-emerald-500 focus:text-emerald-500">
              <ShieldCheck className="mr-2 h-4 w-4" /> Reactivate Account
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for {user.full_name}. 
              They will no longer be able to log in to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
