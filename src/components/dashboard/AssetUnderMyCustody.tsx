// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useInventory } from "@/hooks/useInventory";

const formSchema = z.object({
  name: z.string().trim().min(2, "Asset name required"),
  category_id: z.string().min(1, "Please select a category"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const AssetUnderMyCustody = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { categories } = useInventory();
  const [open, setOpen] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ["my-assigned-assets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("assets")
        .select("id, name, quantity, serial_number, status, condition, location, category_id")
        .eq("assigned_to_staff", user.id)
        .order("name");
      return data || [];
    },
    enabled: !!user?.id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
      location: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("assets").insert({
        name: values.name,
        category_id: values.category_id,
        location: values.location || null,
        notes: values.notes || null,
        assigned_to_staff: user?.id,
        status: "assigned",
        condition: "new",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Asset recorded under your custody" });
      queryClient.invalidateQueries({ queryKey: ["my-assigned-assets", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "available": return "bg-green-100 text-green-700 border-green-200";
      case "assigned": return "bg-blue-100 text-blue-700 border-blue-200";
      case "maintenance": return "bg-amber-100 text-amber-700 border-amber-200";
      case "disposed": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" /> Assets Under My Custody ({assets.length})
          </CardTitle>
          <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No assets assigned to you yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border text-xs hover:bg-muted/50">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium truncate">{a.name}</p>
                      {a.quantity && a.quantity > 1 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">x{a.quantity}</Badge>
                      )}
                    </div>
                    {a.serial_number && <p className="text-muted-foreground truncate">SN: {a.serial_number}</p>}
                    {a.location && <p className="text-muted-foreground truncate">{a.location}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[9px] ${statusColor(a.status)}`}>
                      {a.status}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">{a.condition}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Report Asset Under My Custody
            </DialogTitle>
            <DialogDescription>
              Record an asset, equipment, or property that is under your responsibility.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name *</FormLabel>
                    <FormControl><Input placeholder="e.g. Laptop, Desk, Cabinet" {...field} /></FormControl>
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
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder="e.g. Office Room 4, Lab 1" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Input placeholder="Optional details" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Asset
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
