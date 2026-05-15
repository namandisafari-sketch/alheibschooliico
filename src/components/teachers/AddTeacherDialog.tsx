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
import { Loader2 } from "lucide-react";
import { LocationSelector } from "@/components/common/LocationSelector";

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20).optional().or(z.literal("")),
  qualification: z.string().trim().max(200).optional(),
  nin: z.string().trim().length(14, "NIN must be 14 characters").optional().or(z.literal("")),
  registration_number: z.string().trim().optional(),
  tin: z.string().trim().optional(),
  district_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTeacherDialogProps {
  children: React.ReactNode;
}

export function AddTeacherDialog({ children }: AddTeacherDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      qualification: "",
      nin: "",
      registration_number: "",
      tin: "",
      district_id: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Generate a UUID for the new teacher profile
      const newId = crypto.randomUUID();
      
      const { error } = await supabase.from("profiles").insert({
        id: newId,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        qualification: values.qualification || null,
        nin: values.nin || null,
        registration_number: values.registration_number || null,
        tin: values.tin || null,
        district_id: values.district_id || null,
        role: "teacher",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Teacher registered with EMIS data" });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add teacher",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Teacher (EMIS Compliant)</DialogTitle>
          <DialogDescription>
            Enter the teacher's information including statutory registration numbers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Full Name *</FormLabel>
                      <FormControl><Input placeholder="e.g. Ustaz Ibrahim Ahmed" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="teacher@school.edu" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number</FormLabel>
                      <FormControl><Input placeholder="+256 700 234 567" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Qualification</FormLabel>
                      <FormControl><Input placeholder="e.g. Bachelor of Education" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocationSelector 
                          districtValue={field.value} 
                          onDistrictChange={field.onChange} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-[2px] mb-2">Statutory Data</h4>
                
                <FormField
                  control={form.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">TRN (Registration No.)</FormLabel>
                      <FormControl><Input placeholder="TS/..." {...field} className="h-9 font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">National ID (NIN)</FormLabel>
                      <FormControl><Input placeholder="CM123..." maxLength={14} {...field} className="h-9 font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">URA TIN Number</FormLabel>
                      <FormControl><Input placeholder="100..." {...field} className="h-9 font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="min-w-[160px] shadow-lg shadow-primary/10">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Teacher
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}