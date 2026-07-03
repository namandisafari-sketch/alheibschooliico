import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardFormProps {
  steps: WizardStep[];
  currentStep: number;
  onNext?: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  disableNext?: boolean;
  disableSubmit?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function WizardForm({
  steps,
  currentStep,
  onNext,
  onBack,
  isFirstStep,
  isLastStep,
  isLoading,
  nextLabel = "Next",
  submitLabel = "Submit",
  disableNext,
  disableSubmit,
  children,
  className,
}: WizardFormProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-1 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 text-[10px] font-bold uppercase tracking-wider text-center leading-tight max-w-20",
                      isCompleted && "text-primary",
                      isCurrent && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground/50"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1 mx-3 mt-[-1.25rem]",
                      idx < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {children}
      </div>

      <div className="flex items-center justify-between gap-3 pt-6 border-t mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isFirstStep || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {!isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={disableNext || isLoading}
            className="gap-1 min-w-[120px]"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={disableSubmit || isLoading}
            className="gap-2 min-w-[140px] shadow-lg shadow-primary/10"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
