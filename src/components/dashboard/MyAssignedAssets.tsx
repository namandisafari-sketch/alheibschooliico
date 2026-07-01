// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export const MyAssignedAssets = () => {
  const { user } = useAuth();

  const { data: assets = [] } = useQuery({
    queryKey: ["my-assigned-assets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("assets")
        .select("id, name, serial_number, status, condition, location, category_id")
        .eq("assigned_to_staff", user.id)
        .order("name");
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (!assets.length) return null;

  const statusColor = (s: string) => {
    switch (s) {
      case "available": return "bg-green-100 text-green-700 border-green-200";
      case "assigned": return "bg-blue-100 text-blue-700 border-blue-200";
      case "maintenance": return "bg-amber-100 text-amber-700 border-amber-200";
      case "disposed": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4" /> My Assigned Assets ({assets.length})
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
          <Link to="/inventory-tracking">View All <ExternalLink className="h-3 w-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {assets.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border text-xs hover:bg-muted/50">
              <div>
                <p className="font-medium">{a.name}</p>
                {a.serial_number && <p className="text-muted-foreground">SN: {a.serial_number}</p>}
                {a.location && <p className="text-muted-foreground">{a.location}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[9px] ${statusColor(a.status)}`}>
                  {a.status}
                </Badge>
                <Badge variant="outline" className="text-[9px]">{a.condition}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
