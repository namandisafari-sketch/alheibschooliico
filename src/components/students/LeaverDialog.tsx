import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMarkAsLeft, Learner } from "@/hooks/useLearners";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LogOut } from "lucide-react";

const formSchema = z.object({
  exit_reason: z.string().min(1, "Please select a reason"),
  exit_date: z.string().min(1, "Exit date is required"),
  destination_text: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeaverDialogProps {
  learner: Learner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeaverDialog = ({ learner, open, onOpenChange }: LeaverDialogProps) => {
  const markAsLeft = useMarkAsLeft();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exit_reason: "",
      exit_date: new Date().toISOString().split("T")[0],
      destination_text: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await markAsLeft.mutateAsync({
        learnerId: learner.id,
        classId: learner.class_id,
        exitReason: values.exit_reason,
        exitDate: values.exit_date,
        destinationText: values.destination_text,
        notes: values.notes,
      });
      toast({
        title: "Learner marked as left",
        description: `${learner.full_name} has been recorded as a leaver.`,
      });
      onOpenChange(false);
      form.reset();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            Mark as Left — {learner.full_name}
          </DialogTitle>
          <DialogDescription>
            Record the reason and date this learner is leaving the school.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="exit_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transferred">Transferred to another school</SelectItem>
                      <SelectItem value="moved_away">Moved away / Relocated</SelectItem>
                      <SelectItem value="financial">Financial reasons</SelectItem>
                      <SelectItem value="disciplinary">Disciplinary expulsion</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exit_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Transferred to Kampala High School" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional information..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={markAsLeft.isPending}
              >
                {markAsLeft.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm & Mark as Left
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
