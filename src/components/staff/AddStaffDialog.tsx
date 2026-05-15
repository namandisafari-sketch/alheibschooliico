// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { STAFF_ROLES, StaffRole } from "@/hooks/useStaff";
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
import { LocationSelector } from "@/components/common/LocationSelector";

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255).optional().or(z.literal("")),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20),
  role: z.string().min(1, "Please select a role"),
  qualification: z.string().trim().max(200).optional(),
  nin: z.string().trim().length(14, "NIN must be 14 characters").optional().or(z.literal("")),
  tin: z.string().trim().optional(),
  nssf_number: z.string().trim().optional(),
  district_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddStaffDialogProps {
  children: React.ReactNode;
  defaultRole?: StaffRole;
}

export function AddStaffDialog({ children, defaultRole }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: defaultRole || "",
      qualification: "",
      nin: "",
      tin: "",
      nssf_number: "",
      district_id: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const newId = crypto.randomUUID();

      const { error } = await supabase.from("profiles").insert({
        id: newId,
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone,
        role: values.role,
        qualification: values.qualification || null,
        nin: values.nin || null,
        tin: values.tin || null,
        nssf_number: values.nssf_number || null,
        district_id: values.district_id || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Staff member added successfully" });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["all-staff"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // Filter out teacher role for this dialog (teachers have their own page)
  const availableRoles = STAFF_ROLES.filter((r) => r.value !== "teacher");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Enter the staff member's information for school payroll and EMIS.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Full Name *</FormLabel>
                      <FormControl><Input placeholder="Enter full name" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Role *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableRoles.map((role) => (<SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number *</FormLabel>
                      <FormControl><Input placeholder="+256 700 123 456" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email</FormLabel>
                      <FormControl><Input type="email" placeholder="staff@school.edu" {...field} className="h-10" /></FormControl>
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
                          label="Primary District"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Compliance Info */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] mb-2">Statutory & EMIS</h4>
                
                <FormField
                  control={form.control}
                  name="nin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">National ID (NIN) *</FormLabel>
                      <FormControl><Input placeholder="CM123456..." maxLength={14} {...field} className="h-9 font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">TIN Number (URA)</FormLabel>
                      <FormControl><Input placeholder="100..." {...field} className="h-9 font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nssf_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">NSSF Number</FormLabel>
                      <FormControl><Input placeholder="12-digit number" {...field} className="h-9 font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-600">Qualification</FormLabel>
                      <FormControl><Input placeholder="e.g. Diploma in IT" {...field} className="h-9 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="min-w-[140px] shadow-lg shadow-primary/10">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Staff
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}