
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  min_stock_level: number;
  stock?: {
    quantity: number;
  };
  category?: {
    name: string;
  };
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
}

export const useInventory = () => {
  const queryClient = useQueryClient();

  const items = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, stock:inventory_stock(quantity), category:inventory_categories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const categories = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as InventoryCategory[];
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (values: {
      item_id: string;
      type: "restock" | "issuance" | "return" | "adjustment" | "damage";
      quantity: number;
      learner_id?: string;
      staff_id?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from("inventory_transactions").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({ title: "Success", description: "Inventory updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { items, categories, addTransaction };
};

export const useAssets = () => {
  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, category:inventory_categories(name), assigned_staff:profiles(full_name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};
