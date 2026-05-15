import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import alheibLogo from "@/assets/alheib-logo.png";
import alheibStamp from "@/assets/alheib-stamp.png";
import alheibHeadteacherSig from "@/assets/alheib-headteacher-signature.png";

export interface IdCardSettings {
  director_name: string;
  director_signature_url: string;
  head_teacher_name: string;
  head_teacher_signature_url: string;
  school_logo_url: string;
  school_stamp_url: string;
  back_policy: string;
  back_policy_ar: string;
  // Display sizes (px) — fitted with object-contain so no cropping ever occurs
  logo_size_report: number;
  logo_size_id: number;
  signature_height_report: number;
  signature_height_id: number;
  stamp_size_report: number;
  barcode_height: number;
}

const DEFAULTS: IdCardSettings = {
  director_name: "",
  director_signature_url: "",
  head_teacher_name: "HEADTEACHER",
  head_teacher_signature_url: alheibHeadteacherSig,
  school_logo_url: alheibLogo,
  school_stamp_url: alheibStamp,
  back_policy:
    "This card remains the property of the school. If found, please return to the school office.",
  back_policy_ar:
    "هذه البطاقة ملك للمدرسة. في حال العثور عليها، يرجى إعادتها إلى مكتب المدرسة.",
  logo_size_report: 96,
  logo_size_id: 44,
  signature_height_report: 32,
  signature_height_id: 22,
  stamp_size_report: 80,
  barcode_height: 12,
};

export const useIdCardSettings = () => {
  return useQuery({
    queryKey: ["id-card-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "id_card_settings")
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULTS, ...((data?.value as Partial<IdCardSettings>) || {}) };
    },
  });
};

export const useUpdateIdCardSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: IdCardSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert([{ key: "id_card_settings", value: value as any }], { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["id-card-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};

export const uploadSignature = async (
  file: File,
  type: "director" | "head_teacher"
): Promise<string> => {
  const ext = file.name.split(".").pop() || "png";
  const path = `${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("signatures")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("signatures").getPublicUrl(path);
  return data.publicUrl;
};
