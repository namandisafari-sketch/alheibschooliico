
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

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category_id: z.string().min(1, "Please select a category"),
  description: z.string().trim().optional(),
  unit: z.string().trim().min(1, "Unit is required"),
  min_stock_level: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(0)),
  initial_quantity: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddInventoryItemDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { categories } = useInventory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
      description: "",
      unit: "pieces",
      min_stock_level: "5" as any,
      initial_quantity: "0" as any,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // 1. Insert Item
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

      // 2. If initial quantity > 0, create a restock transaction
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
      } else {
        // Initialize stock at 0 if no initial quantity
        const { error: stockError } = await supabase
          .from("inventory_stock")
          .insert({ item_id: item.id, quantity: 0 });
        if (stockError && !stockError.message.includes("unique")) throw stockError;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Inventory item added" });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Create a new item in the school inventory</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock Alert</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Item
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
