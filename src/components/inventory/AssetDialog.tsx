
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
import { Loader2, Truck, Calendar, Wallet, User, Tag, Settings, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category_id: z.string().min(1, "Please select a category"),
  serial_number: z.string().trim().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.string().optional(),
  condition: z.string().default("good"),
  location: z.string().optional(),
  assigned_to_staff: z.string().optional(),
  manufacturer: z.string().trim().optional(),
  warranty_expiry: z.string().optional(),
  depreciation_rate: z.string().optional(),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  asset_tag_id: z.string().trim().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetDialogProps {
  children?: ReactNode;
  asset?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "add" | "edit";
}

export function AssetDialog({ children, asset, open: controlledOpen, onOpenChange: setControlledOpen, mode = "add" }: AssetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const [staff, setStaff] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const { categories } = useInventory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
      condition: "good",
      purchase_cost: "",
      purchase_date: new Date().toISOString().split("T")[0],
    },
  });

  const fetchStaff = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    setStaff(data || []);
  };

  useEffect(() => {
    if (open) fetchStaff();
  }, [open]);

  useEffect(() => {
    if (asset && mode === "edit") {
      form.reset({
        name: asset.name || "",
        category_id: asset.category_id || "",
        serial_number: asset.serial_number || "",
        purchase_date: asset.purchase_date || "",
        purchase_cost: asset.purchase_cost ? String(asset.purchase_cost) : "",
        condition: asset.condition || "good",
        location: asset.location || "",
        assigned_to_staff: asset.assigned_to_staff || "",
        manufacturer: asset.manufacturer || "",
        warranty_expiry: asset.warranty_expiry || "",
        depreciation_rate: asset.depreciation_rate ? String(asset.depreciation_rate) : "",
        last_maintenance_date: asset.last_maintenance_date || "",
        next_maintenance_date: asset.next_maintenance_date || "",
        asset_tag_id: asset.asset_tag_id || "",
        notes: asset.notes || "",
      });
    } else {
        form.reset({
            name: "",
            category_id: "",
            condition: "good",
            purchase_cost: "",
            purchase_date: new Date().toISOString().split("T")[0],
            serial_number: "",
            location: "",
            assigned_to_staff: "",
            manufacturer: "",
            warranty_expiry: "",
            depreciation_rate: "",
            last_maintenance_date: "",
            next_maintenance_date: "",
            asset_tag_id: "",
            notes: "",
        });
    }
  }, [asset, mode, form, open]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const data: any = {
        name: values.name,
        category_id: values.category_id,
        serial_number: values.serial_number || null,
        purchase_date: values.purchase_date || null,
        purchase_cost: values.purchase_cost ? parseFloat(values.purchase_cost) : null,
        condition: values.condition,
        location: values.location || null,
        assigned_to_staff: values.assigned_to_staff || null,
        manufacturer: values.manufacturer || null,
        warranty_expiry: values.warranty_expiry || null,
        depreciation_rate: values.depreciation_rate ? parseFloat(values.depreciation_rate) : null,
        last_maintenance_date: values.last_maintenance_date || null,
        next_maintenance_date: values.next_maintenance_date || null,
        asset_tag_id: values.asset_tag_id || null,
        notes: values.notes || null,
      };

      if (mode === "edit" && asset) {
        const { error } = await supabase.from("assets").update(data).eq("id", asset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assets").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: `Asset ${mode === "edit" ? "updated" : "recorded"} successfully` });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
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
            <Truck className="h-5 w-5 text-primary" />
            {mode === "edit" ? "Edit Asset Details" : "Record Detailed Asset"}
          </DialogTitle>
          <DialogDescription>
            Comprehensive tracking for school property, electronics, and furniture.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="gap-2">
                   <Info className="h-4 w-4" /> Identification
                </TabsTrigger>
                <TabsTrigger value="purchase" className="gap-2">
                   <Wallet className="h-4 w-4" /> Purchase & Value
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="gap-2">
                   <Settings className="h-4 w-4" /> Lifecycle
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Name *</FormLabel>
                        <FormControl><Input placeholder="e.g. Science Lab Projector" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="asset_tag_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Asset Tag ID</FormLabel>
                        <FormControl><Input placeholder="e.g. ALH-AST-001" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl><Input placeholder="Manufacturer S/N" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Location</FormLabel>
                          <FormControl><Input placeholder="e.g. Main Hall, Room 4" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assigned_to_staff"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custodier (Staff)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Assign Staff" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {staff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                </div>
              </TabsContent>

              <TabsContent value="purchase" className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purchase_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Acquisition</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="purchase_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost of Purchase (UGX)</FormLabel>
                          <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer / Brand</FormLabel>
                          <FormControl><Input placeholder="e.g. Toyota, HP, LG" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="warranty_expiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warranty Expiry</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Condition</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">Brand New</SelectItem>
                              <SelectItem value="good">Operational / Good</SelectItem>
                              <SelectItem value="fair">Aged / Fair</SelectItem>
                              <SelectItem value="poor">Damaged / Poor</SelectItem>
                              <SelectItem value="maintenance">Under Repair</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="depreciation_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depreciation % (Annual)</FormLabel>
                          <FormControl><Input type="number" step="0.1" placeholder="e.g. 15.0" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="last_maintenance_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Serviced On</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="next_maintenance_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Scheduled Service</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="px-8 bg-slate-900">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "edit" ? "Update Asset Record" : "Register Detailed Asset"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
