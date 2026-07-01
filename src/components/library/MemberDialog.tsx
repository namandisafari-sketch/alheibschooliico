import { useState, useEffect, JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLibrary, LibraryMember } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardForm, WizardStep } from "@/components/ui/wizard-form";

const formSchema = z.object({
  id_card_number: z.string().trim().min(1, "ID card number is required"),
  member_type: z.enum(["student", "teacher", "staff", "external"]).default("student"),
  photo_url: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
  max_loans: z.coerce.number().int().min(1).default(3),
  notes: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS: WizardStep[] = [
  { id: "identity", title: "Identity", description: "ID card, type, contact" },
  { id: "library", title: "Library Info", description: "Loans, address, notes" },
];

interface MemberDialogProps {
  open: boolean;
  member?: LibraryMember | null;
  onOpenChange: (open: boolean) => void;
}

export function MemberDialog({ open, member, onOpenChange }: MemberDialogProps): JSX.Element {
  const editing = !!member;
  const { addMember, updateMember } = useLibrary();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_card_number: "",
      member_type: "student",
      photo_url: "",
      phone: "",
      email: "",
      address: "",
      max_loans: 3,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (member) {
        form.reset({
          id_card_number: member.id_card_number || "",
          member_type: (member.member_type as any) || "student",
          photo_url: member.photo_url || "",
          phone: member.phone || "",
          email: member.email || "",
          address: member.address || "",
          max_loans: member.max_loans || 3,
          notes: member.notes || "",
        });
      } else {
        form.reset();
      }
      setCurrentStep(0);
    }
  }, [open, member, form]);

  const save = async (values: FormValues) => {
    if (editing) {
      await updateMember.mutateAsync({ id: member!.id, ...values } as any);
    } else {
      await addMember.mutateAsync(values as any);
    }
    onOpenChange(false);
  };

  const handleNext = async () => {
    const fields: (keyof FormValues)[][] = [
      ["id_card_number", "member_type", "phone", "email"],
      ["address", "max_loans", "notes", "photo_url"],
    ];
    const valid = await form.trigger(fields[currentStep], { shouldFocus: true });
    if (valid) setCurrentStep((c) => c + 1);
  };

  const isLoading = addMember.isPending || updateMember.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Library Member" : "Add Library Member"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(save)}>
            <WizardForm
              steps={STEPS}
              currentStep={currentStep}
              onNext={handleNext}
              onBack={() => setCurrentStep((c) => Math.max(0, c - 1))}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
              isLoading={isLoading}
              submitLabel={editing ? "Save Changes" : "Add Member"}
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="id_card_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Card Number *</FormLabel>
                      <FormControl><Input placeholder="e.g. L-XXXXXXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="member_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="max_loans" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Loans</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="photo_url" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
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
}
