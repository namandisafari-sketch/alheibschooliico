// @ts-nocheck
import { useState } from "react";
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
import { ExtendedProfessionalProfileForm } from "./ExtendedProfessionalProfileForm";

interface AddTeacherDialogProps {
  children: React.ReactNode;
}

export function AddTeacherDialog({ children }: AddTeacherDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      // Generate a UUID for the new teacher profile
      const newId = crypto.randomUUID();
      
      // Pack the extended metadata inside the profiles scope column
      const scopeData = {
        date_of_birth: values.date_of_birth || null,
        specialized_subjects: values.specialized_subjects || null,
        years_of_experience: values.years_of_experience || null,
        certifications: values.certifications || [],
      };

      const { error } = await supabase.from("profiles").insert({
        id: newId,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        qualification: values.qualification || null,
        registration_number: values.registration_number || null,
        role: "teacher",
        scope: JSON.stringify(scopeData),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Teacher registered with EMIS and extended professional profile data." });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
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

  const onSubmit = async (values: any) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Teacher (EMIS & Professional Profile Compliant)</DialogTitle>
          <DialogDescription>
            Enter the teacher's credentials, qualifications, birth details, and professional certificates.
          </DialogDescription>
        </DialogHeader>

        <ExtendedProfessionalProfileForm 
          onSubmit={onSubmit} 
          isSubmitting={mutation.isPending} 
          mode="create" 
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}