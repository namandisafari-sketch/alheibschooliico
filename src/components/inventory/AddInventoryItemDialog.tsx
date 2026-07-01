// @ts-nocheck

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInventory } from "@/hooks/useInventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { WizardForm, WizardStep } from "@/components/ui/wizard-form";

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category_id: z.string().min(1, "Please select a category"),
  description: z.string().trim().optional(),
  unit: z.string().trim().min(1, "Unit is required"),
  min_stock_level: z.number().min(0),
  initial_quantity: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS: WizardStep[] = [
  { id: "details", title: "Item Details", description: "Name, category, unit" },
  { id: "stock", title: "Stock Settings", description: "Min stock, initial qty" },
];

export function AddInventoryItemDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const queryClient = useQueryClient();
  const { items, categories } = useInventory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
      description: "",
      unit: "pieces",
      min_stock_level: 5,
      initial_quantity: "0" as any,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const existing = items.data?.find(
        (i: any) => i.name.toLowerCase() === values.name.toLowerCase()
      );
      if (existing) {
        throw new Error(`An item with the name "${values.name}" already exists.`);
      }

      const { data: item, error: itemError } = await supabase
        .from("inventory_items")
        .insert({
          name: values.name,
          category_id: values.category_id,
          description: values.description || null,
          unit: values.unit,
          min_stock_level: values.min_stock_level,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      if (values.initial_quantity && values.initial_quantity > 0) {
        const { error: transError } = await supabase
          .from("inventory_transactions")
          .insert({
            item_id: item.id,
            type: "restock",
            quantity: values.initial_quantity,
            notes: "Initial stock during item creation",
          });
        if (transError) throw transError;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Inventory item added" });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      form.reset();
      setOpen(false);
      setCurrentStep(0);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleNext = async () => {
    const fields: (keyof FormValues)[][] = [
      ["name", "category_id", "unit"],
      ["min_stock_level", "initial_quantity", "description"],
    ];
    const valid = await form.trigger(fields[currentStep], { shouldFocus: true });
    if (valid) setCurrentStep((c) => c + 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCurrentStep(0); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Create a new item in the school inventory</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <WizardForm
              steps={STEPS}
              currentStep={currentStep}
              onNext={handleNext}
              onBack={() => setCurrentStep((c) => Math.max(0, c - 1))}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
              isLoading={mutation.isPending}
              submitLabel="Create Item"
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name *</FormLabel>
                        <FormControl><Input placeholder="e.g. Bic Pen Blue" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.data?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit *</FormLabel>
                          <FormControl><Input placeholder="pieces, packets..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="min_stock_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Stock Alert</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="initial_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Stock</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Input placeholder="Optional details..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </WizardForm>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
