// @ts-nocheck

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  quantity: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(1)),
  learner_id: z.string().optional(),
  staff_id: z.string().optional(),
  notes: z.string().trim().optional(),
  recipient_type: z.enum(["student", "staff", "general"]),
  num_days: z.string().optional(),
  available_qty: z.number().optional(),
  approved_qty: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IssueItemDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueItemDialog({ item, open, onOpenChange }: IssueItemDialogProps) {
  const queryClient = useQueryClient();
  const [recipients, setRecipients] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: "1" as any,
      recipient_type: "student",
      notes: "",
      num_days: "",
      available_qty: item?.quantity || 0,
      approved_qty: "1" as any,
    },
  });

  const recipientType = form.watch("recipient_type");

  // Fetch recipients based on type
  const fetchRecipients = async (type: string) => {
    if (type === "student") {
      const { data } = await supabase.from("learners").select("id, full_name").order("full_name").limit(100);
      setRecipients(data || []);
    } else if (type === "staff") {
      const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
      setRecipients(data || []);
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("inventory_transactions").insert({
        item_id: item.id,
        type: "issuance",
        quantity: values.quantity,
        available_quantity: item?.quantity || 0,
        approved_quantity: values.approved_qty || values.quantity,
        num_days: values.num_days ? parseInt(values.num_days, 10) : null,
        learner_id: values.recipient_type === "student" ? values.learner_id : null,
        staff_id: values.recipient_type === "staff" ? values.staff_id : null,
        notes: values.notes || `Issued to ${values.recipient_type}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: `${item.name} issued successfully` });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue {item?.name}</DialogTitle>
          <DialogDescription>Record an item being given to a student or staff member</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Type</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      fetchRecipients(val);
                    }} 
                    value={field.value}
                  >
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student / Learner</SelectItem>
                      <SelectItem value="staff">Staff Member</SelectItem>
                      <SelectItem value="general">General / Office Use</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {recipientType !== "general" && (
              <FormField
                control={form.control}
                name={recipientType === "student" ? "learner_id" : "staff_id"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select {recipientType === "student" ? "Learner" : "Staff"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={`Select ${recipientType}`} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recipients.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Requested *</FormLabel>
                    <FormControl><Input type="number" {...field} className="h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approved_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved Qty</FormLabel>
                    <FormControl><Input type="number" {...field} className="h-12 rounded-xl bg-slate-50 font-bold" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {item?.category === "kitchen" && (
              <FormField
                control={form.control}
                name="num_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Days (Kitchen Only)</FormLabel>
                    <FormControl><Input type="number" {...field} className="h-12 rounded-xl border-amber-200 bg-amber-50/20" placeholder="e.g. 7" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks / Purpose</FormLabel>
                  <FormControl><Input placeholder="e.g. For final exams" {...field} className="h-12 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Issuance
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}