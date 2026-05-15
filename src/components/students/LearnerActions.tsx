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
import { MoreHorizontal, Pencil, Trash2, User, ArrowUpCircle, FileText } from "lucide-react";
import { useDeleteLearner, Learner } from "@/hooks/useLearners";
import { EditLearnerDialog } from "./EditLearnerDialog";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCircularDialog, setShowCircularDialog] = useState(false);
  const deleteLearner = useDeleteLearner();

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
          <DropdownMenuItem onClick={() => toast({ title: "Profile coming soon", description: "Learner profile page is under development." })}>
            <User className="mr-2 h-4 w-4" /> View Profile
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
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Learner
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
};
