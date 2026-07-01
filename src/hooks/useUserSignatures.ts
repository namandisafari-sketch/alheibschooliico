import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface UserSignature {
  id: string;
  user_id: string;
  image_url: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export const useUserSignatures = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-signatures", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_signatures")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserSignature[];
    },
    enabled: !!user?.id,
  });
};

export const useActiveSignature = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-signature", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_signatures")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as UserSignature | null;
    },
    enabled: !!user?.id,
  });
};

export const useUploadSignature = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, label }: { file: File; label: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(filePath);

      const imageUrl = urlData?.publicUrl;
      if (!imageUrl) throw new Error("Failed to get public URL");

      const hasExisting = await queryClient.getQueryData(["user-signatures", user.id]);
      const isFirst = !hasExisting || (hasExisting as any[]).length === 0;

      const { error: dbError } = await supabase.from("user_signatures").insert({
        user_id: user.id,
        image_url: imageUrl,
        label,
        is_active: isFirst,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["active-signature"] });
      toast({ title: "Signature uploaded", description: "Your signature has been saved" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });
};

export const useSetActiveSignature = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (signatureId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error: deactivateError } = await supabase
        .from("user_signatures")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (deactivateError) throw deactivateError;

      const { error: activateError } = await supabase
        .from("user_signatures")
        .update({ is_active: true })
        .eq("id", signatureId);

      if (activateError) throw activateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["active-signature"] });
      toast({ title: "Signature updated", description: "Active signature changed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteSignature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signature: UserSignature) => {
      const filePath = signature.image_url.split("/").slice(-2).join("/");

      await supabase.storage.from("signatures").remove([filePath]);

      const { error } = await supabase
        .from("user_signatures")
        .delete()
        .eq("id", signature.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["active-signature"] });
      toast({ title: "Deleted", description: "Signature removed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
