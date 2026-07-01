// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const BUCKET = "teacher-documents";

export interface TeacherDocument {
  id: string;
  teacher_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useTeacherDocuments(teacherId?: string) {
  return useQuery({
    queryKey: ["teacher-documents", teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_documents")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TeacherDocument[];
    },
  });
}

export function useDeleteTeacherDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([filePath]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("teacher_documents")
        .delete()
        .eq("id", id);
      if (dbError) throw dbError;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["teacher-documents"] });
      toast({ title: "Document deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useUploadTeacherDocument() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({
      teacherId,
      file,
      documentType,
    }: {
      teacherId: string;
      file: File;
      documentType: string;
    }) => {
      setProgress(0);

      const fileExt = file.name.split(".").pop();
      const filePath = `${teacherId}/${documentType}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      setProgress(50);

      const { data: { user } } = await supabase.auth.getUser();

      const { data: doc, error: dbError } = await supabase
        .from("teacher_documents")
        .insert({
          teacher_id: teacherId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
        })
        .select("id")
        .single();
      if (dbError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw dbError;
      }
      setProgress(100);
      return doc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-documents"] });
      toast({ title: "Document uploaded successfully" });
      setProgress(0);
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setProgress(0);
    },
  });

  return { ...mutation, progress };
}

export function useDocumentSignedUrl(filePath: string | null) {
  return useQuery({
    queryKey: ["teacher-document-url", filePath],
    enabled: !!filePath,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
