import { useState } from "react";
import { useClasses } from "@/hooks/useClasses";
import { useAcademicSettings, useUpdateAcademicSettings } from "@/hooks/useAcademicSettings";
import { usePromoteAll } from "@/hooks/useLearners";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUpCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PromotionDialog = ({ children, open, onOpenChange }: PromotionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const { data: classes = [], isLoading } = useClasses();
  const { data: academicSettings } = useAcademicSettings();
  const updateAcademicSettings = useUpdateAcademicSettings();
  const promoteAll = usePromoteAll();

  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const sorted = [...classes].sort((a, b) => a.level - b.level);

  const handlePromote = async (sourceClass: (typeof sorted)[0]) => {
    const nextClass = sorted.find((c) => c.level === sourceClass.level + 1);
    const isGraduating = sourceClass.level === 7;

    try {
      await promoteAll.mutateAsync({
        sourceClassId: sourceClass.id,
        targetClassId: isGraduating ? null : (nextClass?.id ?? null),
        academicYear: currentYear,
      });

      await updateAcademicSettings.mutateAsync({
        ...academicSettings!,
        current_year: currentYear,
      });

      toast({
        title: isGraduating ? "Graduation Complete" : "Promotion Complete",
        description: `${promoteAll.data?.promoted ?? sourceClass.student_count} learners ${isGraduating ? "graduated" : "promoted"} from ${sourceClass.name}`,
      });
    } catch (e: any) {
      toast({
        title: "Promotion Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Academic Year Progression</DialogTitle>
          <DialogDescription>
            Promote learners to the next class or graduate P7 leavers for the {currentYear} academic year.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            sorted.map((cls) => {
              const isGraduating = cls.level === 7;
              const nextClass = sorted.find((c) => c.level === cls.level + 1);
              const canPromote = cls.student_count > 0;

              return (
                <div
                  key={cls.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    !canPromote && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {isGraduating ? (
                        <GraduationCap className="h-5 w-5 text-primary" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cls.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                          {cls.student_count} learners
                        </Badge>
                        {!isGraduating && nextClass && (
                          <span className="text-[10px] text-muted-foreground">
                            → {nextClass.name}
                          </span>
                        )}
                        {isGraduating && (
                          <span className="text-[10px] text-amber-600 font-medium">
                            Graduating
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isGraduating ? "default" : "outline"}
                    disabled={!canPromote || promoteAll.isPending}
                    onClick={() => handlePromote(cls)}
                  >
                    {promoteAll.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : null}
                    {isGraduating ? "Graduate All" : "Promote All"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
