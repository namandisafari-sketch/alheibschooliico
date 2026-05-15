import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeachers } from "@/hooks/useTeachers";
import { toast } from "@/hooks/use-toast";
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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  level: z.coerce.number().min(1, "Level must be 1-7").max(7, "Level must be 1-7"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(100).optional(),
  room: z.string().trim().max(50).optional(),
  teacher_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddClassDialogProps {
  children: React.ReactNode;
  initialData?: any; // Using any for now to avoid complex type issues with Class vs FormValues
}

export function AddClassDialog({ children, initialData }: AddClassDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: teachers = [] } = useTeachers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      level: initialData?.level || 1,
      capacity: initialData?.capacity || 40,
      room: initialData?.room || "",
      teacher_id: initialData?.teacher_id || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (initialData?.id) {
        const { error } = await supabase
          .from("classes")
          .update({
            name: values.name,
            level: values.level,
            capacity: values.capacity || 40,
            room: values.room || null,
            teacher_id: values.teacher_id || null,
          })
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classes").insert({
          name: values.name,
          level: values.level,
          capacity: values.capacity || 40,
          room: values.room || null,
          teacher_id: values.teacher_id || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: initialData ? "Class updated successfully" : "Class created successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      if (!initialData) form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save class",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Manage Class" : "Add New Class"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update class details and settings" : "Create a new class and assign a teacher"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Primary 1 (P1)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level (P1-P7) *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            P{level}
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
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Room 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Teacher</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No teachers available
                        </SelectItem>
                      ) : (
                        teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save Changes" : "Create Class"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
