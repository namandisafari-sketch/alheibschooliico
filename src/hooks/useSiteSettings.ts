import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSettings {
  school_name: string;
  tagline: string;
  description: string;
  cta_text: string;
  cta_link: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesSettings {
  title: string;
  items: FeatureItem[];
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsSettings {
  items: StatItem[];
}

export interface ContactSettings {
  title: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
}

export interface ThemeSettings {
  primary_color: string;
  hero_bg_gradient: string;
  show_stats: boolean;
  show_features: boolean;
  show_contact: boolean;
}

export interface SiteSettings {
  landing_hero: HeroSettings;
  landing_features: FeaturesSettings;
  landing_stats: StatsSettings;
  landing_contact: ContactSettings;
  landing_theme: ThemeSettings;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      const settings: Partial<SiteSettings> = {};
      data?.forEach((row) => {
        settings[row.key as keyof SiteSettings] = row.value as any;
      });

      return settings as SiteSettings;
    },
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};
