// @ts-nocheck

import { useState, ReactNode, useEffect } from "react";
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
import { Loader2, Package, Truck, MapPin, Calendar, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category_id: z.string().min(1, "Please select a category"),
  description: z.string().trim().optional(),
  unit: z.string().trim().min(1, "Unit is required"),
  min_stock_level: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(0)),
  sku: z.string().trim().optional(),
  supplier_name: z.string().trim().optional(),
  supplier_contact: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  storage_location: z.string().trim().optional(),
  expiry_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryItemDialogProps {
  children?: ReactNode;
  item?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "add" | "edit";
}

export function InventoryItemDialog({ children, item, open: controlledOpen, onOpenChange: setControlledOpen, mode = "add" }: InventoryItemDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  
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
      sku: "",
      supplier_name: "",
      supplier_contact: "",
      brand: "",
      model: "",
      storage_location: "",
      expiry_date: "",
    },
  });

  useEffect(() => {
    if (item && mode === "edit") {
      form.reset({
        name: item.name || "",
        category_id: item.category_id || "",
        description: item.description || "",
        unit: item.unit || "pieces",
        min_stock_level: String(item.min_stock_level || 5) as any,
        sku: item.sku || "",
        supplier_name: item.supplier_name || "",
        supplier_contact: item.supplier_contact || "",
        brand: item.brand || "",
        model: item.model || "",
        storage_location: item.storage_location || "",
        expiry_date: item.expiry_date || "",
      });
    } else {
        form.reset({
            name: "",
            category_id: "",
            description: "",
            unit: "pieces",
            min_stock_level: "5" as any,
            sku: "",
            supplier_name: "",
            supplier_contact: "",
            brand: "",
            model: "",
            storage_location: "",
            expiry_date: "",
          });
    }
  }, [item, mode, form, open]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (mode === "edit" && item) {
        const { error } = await supabase
          .from("inventory_items")
          .update({
            name: values.name,
            category_id: values.category_id,
            description: values.description || null,
            unit: values.unit,
            min_stock_level: values.min_stock_level,
            sku: values.sku || null,
            supplier_name: values.supplier_name || null,
            supplier_contact: values.supplier_contact || null,
            brand: values.brand || null,
            model: values.model || null,
            storage_location: values.storage_location || null,
            expiry_date: values.expiry_date || null,
          })
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { data: newItem, error: itemError } = await supabase
          .from("inventory_items")
          .insert({
            name: values.name,
            category_id: values.category_id,
            description: values.description || null,
            unit: values.unit,
            min_stock_level: values.min_stock_level,
            sku: values.sku || null,
            supplier_name: values.supplier_name || null,
            supplier_contact: values.supplier_contact || null,
            brand: values.brand || null,
            model: values.model || null,
            storage_location: values.storage_location || null,
            expiry_date: values.expiry_date || null,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Initialize stock at 0
        await supabase.from("inventory_stock").insert({ item_id: newItem.id, quantity: 0 });
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: `Inventory item ${mode === "edit" ? "updated" : "added"}` });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {mode === "edit" ? "Edit Detailed Item" : "Add Detailed Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? `Updating information for ${item?.name}` : "Enter comprehensive details for the new school supply."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="gap-2">
                   <Info className="h-4 w-4" /> Basic Info
                </TabsTrigger>
                <TabsTrigger value="supply" className="gap-2">
                   <Truck className="h-4 w-4" /> Supply & Brand
                </TabsTrigger>
                <TabsTrigger value="logistics" className="gap-2">
                   <MapPin className="h-4 w-4" /> Logistics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl><Input placeholder="e.g. Blue Bic Pens" {...field} /></FormControl>
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
                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
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
                        <FormControl><Input placeholder="pcs, kg, box..." {...field} /></FormControl>
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
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl><Input placeholder="Additional notes or specifications..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="supply" className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl><Input placeholder="e.g. Bic, Apple, Oxford" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model / Series</FormLabel>
                          <FormControl><Input placeholder="e.g. Cristal Ultra" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplier_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Supplier</FormLabel>
                          <FormControl><Input placeholder="Vendor name" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplier_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Contact</FormLabel>
                          <FormControl><Input placeholder="Phone or Email" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>

              <TabsContent value="logistics" className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="min_stock_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Threshold</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Keeping Unit (SKU)</FormLabel>
                          <FormControl><Input placeholder="Internal SKU code" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="storage_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Location</FormLabel>
                          <FormControl><Input placeholder="e.g. Cabinet A, Shelf 3" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date (If Any)</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="px-8">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "edit" ? "Save Detailed Changes" : "Record Detailed Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}