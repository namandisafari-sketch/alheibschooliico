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
import { MoreHorizontal, Pencil, Trash2, User, ArrowUpCircle, FileText, Printer, LogOut, Archive, RotateCcw } from "lucide-react";
import { useDeleteLearner, useUpdateLearner, Learner } from "@/hooks/useLearners";
import { useAuth } from "@/hooks/useAuth";
import { useMarkOrphan } from "@/hooks/useOrphanage";
import { Heart } from "lucide-react";
import { EditLearnerDialog } from "./EditLearnerDialog";
import { LearnerDetailsDialog } from "./LearnerDetailsDialog";
import { LeaverDialog } from "./LeaverDialog";
import { CircularDialog } from "@/components/reports/CircularDialog";
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

interface LearnerActionsProps {
  learner: Learner;
}

export const LearnerActions = ({ learner }: LearnerActionsProps) => {
  const { role } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCircularDialog, setShowCircularDialog] = useState(false);
  const [showDossierDialog, setShowDossierDialog] = useState(false);
  const [showLeaverDialog, setShowLeaverDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const deleteLearner = useDeleteLearner();
  const updateLearner = useUpdateLearner();
  const markOrphan = useMarkOrphan();

  if (!learner) return null;

  const handleDelete = async () => {
    try {
      await deleteLearner.mutateAsync(learner.id);
      toast({ title: "Learner deleted", description: `${learner.full_name} has been removed.` });
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDossierDialog(true)}>
            <User className="mr-2 h-4 w-4" /> View Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDossierDialog(true)}>
            <Printer className="mr-2 h-4 w-4" /> Print Dossier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCircularDialog(true)}>
            <FileText className="mr-2 h-4 w-4" /> Termly Circular
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: "Promote coming soon" })}>
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Promote Class
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowLeaverDialog(true)}>
            <LogOut className="mr-2 h-4 w-4" /> Mark as Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
            {learner.status === "active" ? (
              <><Archive className="mr-2 h-4 w-4" /> Close File</>
            ) : (
              <><RotateCcw className="mr-2 h-4 w-4" /> Reopen File</>
            )}
          </DropdownMenuItem>
          {role === "orphan_supervisor" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => markOrphan.mutateAsync({
                  learnerId: learner.id,
                  isOrphan: learner.pupil_status !== "Orphan",
                  orphanStatus: learner.pupil_status === "Orphan" ? undefined : "registered",
                })}
              >
                <Heart className={`mr-2 h-4 w-4 ${learner.pupil_status === "Orphan" ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                {learner.pupil_status === "Orphan" ? "Remove Orphan Status" : "Mark as Orphan"}
              </DropdownMenuItem>
            </>
          )}
          {role !== "orphan_supervisor" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Learner
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {role !== "orphan_supervisor" && (
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {learner.full_name}'s record and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}

      <EditLearnerDialog 
        learner={learner} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />

      <CircularDialog 
        learner={learner} 
        open={showCircularDialog} 
        onOpenChange={setShowCircularDialog} 
      />

      <LearnerDetailsDialog
        student={learner}
        open={showDossierDialog}
        onOpenChange={setShowDossierDialog}
      />

      <LeaverDialog
        learner={learner}
        open={showLeaverDialog}
        onOpenChange={setShowLeaverDialog}
      />

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {learner.status === "active" ? "Close this file?" : "Reopen this file?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {learner.status === "active"
                ? `${learner.full_name} will be marked as inactive and hidden from most views. You can reopen the file later.`
                : `${learner.full_name} will be restored to active status.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await updateLearner.mutateAsync({
                    id: learner.id,
                    status: learner.status === "active" ? "inactive" : "active",
                  });
                  toast({
                    title: learner.status === "active" ? "File closed" : "File reopened",
                    description: `${learner.full_name} is now ${learner.status === "active" ? "inactive" : "active"}.`,
                  });
                } catch (e: any) {
                  toast({ title: "Error", description: e.message, variant: "destructive" });
                }
                setShowStatusDialog(false);
              }}
            >
              {learner.status === "active" ? "Close File" : "Reopen File"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
