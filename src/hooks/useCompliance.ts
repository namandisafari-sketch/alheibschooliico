// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGovernanceMembers = () => {
  return useQuery({
    queryKey: ["governance-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governance_members")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });
};

export const useGovernanceMeetings = () => {
  return useQuery({
    queryKey: ["governance-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governance_meetings")
        .select("*")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useGovernancePolicies = () => {
  return useQuery({
    queryKey: ["governance-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governance_policies")
        .select("*")
        .order("last_updated", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useMinistryGuidelines = () => {
  return useQuery({
    queryKey: ["ministry-guidelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministry_guidelines")
        .select("*")
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCompliancePortals = () => {
  return useQuery({
    queryKey: ["compliance-portals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_portals")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useComplianceNotices = () => {
  return useQuery({
    queryKey: ["compliance-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_notices")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useNationalStandards = () => {
  return useQuery({
    queryKey: ["national-standards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("national_standards")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useComplianceContacts = () => {
  return useQuery({
    queryKey: ["compliance-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_contacts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};
