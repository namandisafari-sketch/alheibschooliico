
import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Users, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  item_id: z.string().min(1, "Please select an item"),
  quantity_per_person: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(1)),
  learner_ids: z.array(z.string()).min(1, "Select at least one learner"),
  notes: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BulkIssueDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchLearner, setSearchLearner] = useState("");
  const [learners, setLearners] = useState<any[]>([]);
  const { items } = useInventory();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_id: "",
      quantity_per_person: "1" as any,
      learner_ids: [],
      notes: "",
    },
  });

  const fetchLearners = async () => {
    const { data } = await supabase
      .from("learners")
      .select("id, full_name, class:classes(name)")
      .order("full_name")
      .limit(200);
    setLearners(data || []);
  };

  useEffect(() => {
    if (open) fetchLearners();
  }, [open]);

  const filteredLearners = learners.filter((l) =>
    l.full_name.toLowerCase().includes(searchLearner.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const transactions = values.learner_ids.map((id) => ({
        item_id: values.item_id,
        type: "issuance" as const,
        quantity: values.quantity_per_person,
        learner_id: id,
        status: "pending",
        notes: values.notes || "Bulk issuance",
      }));

      const { error } = await supabase.from("inventory_transactions").insert(transactions);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bulk issuance requests sent to Admin for approval" });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Issue Items</DialogTitle>
          <DialogDescription>Distribute items to multiple students at once. Admin approval required.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {items.data?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.stock?.[0]?.quantity || 0} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity_per_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty Per Pupil</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Select Pupils ({form.watch("learner_ids").length} selected)</FormLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pupils..."
                  className="pl-10"
                  value={searchLearner}
                  onChange={(e) => setSearchLearner(e.target.value)}
                />
              </div>
              <ScrollArea className="h-64 border rounded-md p-2">
                <div className="space-y-2">
                  {filteredLearners.map((learner) => (
                    <div key={learner.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors">
                      <Checkbox
                        id={`learner-${learner.id}`}
                        checked={form.watch("learner_ids").includes(learner.id)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues("learner_ids");
                          if (checked) {
                            form.setValue("learner_ids", [...current, learner.id]);
                          } else {
                            form.setValue("learner_ids", current.filter((id) => id !== learner.id));
                          }
                        }}
                      />
                      <label htmlFor={`learner-${learner.id}`} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{learner.full_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({learner.class?.name || "No Class"})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <FormMessage />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl><Input placeholder="e.g. Termly pen distribution" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Approval Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
