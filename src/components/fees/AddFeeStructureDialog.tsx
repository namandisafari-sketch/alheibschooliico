import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateFeeStructure, useUpdateFeeStructure, FeeStructure } from "@/hooks/useFees";
import { WizardForm, WizardStep } from "@/components/ui/wizard-form";

const CATEGORIES = ["tuition", "boarding", "transport", "meals", "books", "uniform", "activity", "other"];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().min(1, "Select a category"),
  amount: z.coerce.number().positive("Amount must be positive"),
  applies_to: z.enum(["all", "class"]).default("all"),
  class_level: z.coerce.number().int().min(1).max(7).optional(),
  term: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS: WizardStep[] = [
  { id: "details", title: "Fee Details", description: "Name, category, amount" },
  { id: "applicability", title: "Applicability", description: "Who does it apply to?" },
];

interface Props {
  trigger?: React.ReactNode;
  initial?: FeeStructure;
  onClose?: () => void;
}

export const AddFeeStructureDialog = ({ trigger, initial, onClose }: Props) => {
  const [open, setOpen] = useState(!!initial);
  const [currentStep, setCurrentStep] = useState(0);
  const create = useCreateFeeStructure();
  const update = useUpdateFeeStructure();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name || "",
      category: initial?.category || "tuition",
      amount: initial?.amount || 0,
      applies_to: initial?.applies_to === "class" ? "class" : "all",
      class_level: initial?.class_level || undefined,
      term: initial?.term || "",
      is_active: initial?.is_active ?? true,
    },
  });

  const submit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      category: values.category,
      amount: values.amount,
      class_level: values.applies_to === "class" ? values.class_level || null : null,
      applies_to: values.applies_to,
      term: values.term || null,
      is_active: values.is_active,
    };
    if (initial) await update.mutateAsync({ id: initial.id, ...payload });
    else await create.mutateAsync(payload);
    setOpen(false);
    onClose?.();
  };

  const handleNext = async () => {
    const fields: (keyof FormValues)[][] = [
      ["name", "category", "amount"],
      ["applies_to", "class_level", "term"],
    ];
    const valid = await form.trigger(fields[currentStep], { shouldFocus: true });
    if (valid) setCurrentStep((c) => c + 1);
  };

  const isLoading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCurrentStep(0); onClose?.(); } }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)}>
            <WizardForm
              steps={STEPS}
              currentStep={currentStep}
              onNext={handleNext}
              onBack={() => setCurrentStep((c) => Math.max(0, c - 1))}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
              isLoading={isLoading}
              submitLabel={initial ? "Save Changes" : "Add Fee"}
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl><Input placeholder="e.g. Tuition Fee" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (UGX) *</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="applies_to" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applies To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Learners</SelectItem>
                            <SelectItem value="class">Specific Class Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="class_level" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Level (P1-P7)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            {...field}
                            value={field.value ?? ""}
                            disabled={form.watch("applies_to") !== "class"}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="term" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="term_1">Term 1</SelectItem>
                          <SelectItem value="term_2">Term 2</SelectItem>
                          <SelectItem value="term_3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
              )}
            </WizardForm>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
