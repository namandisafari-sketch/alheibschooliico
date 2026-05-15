// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BudgetRequestsTab = () => {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["budget-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`*, projects(name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "head_office" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-requests"] });
      toast.success("Request approved for Head Office endorsement");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Active Requests
        </h3>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Create Request
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
        ) : requests?.map((req) => (
          <Card key={req.id} className="border-none shadow-md overflow-hidden group">
            <div className={`h-1 w-full ${
              req.status === 'approved' ? 'bg-success' : 
              req.status === 'committee' ? 'bg-amber-400' : 'bg-destructive'
            }`} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="font-mono text-[10px]">PO-{req.id.slice(0, 8)}</Badge>
                {req.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-success" /> : 
                 req.status === 'committee' ? <Clock className="h-4 w-4 text-amber-500 animate-pulse" /> : 
                 <XCircle className="h-4 w-4 text-destructive" />}
              </div>
              <CardTitle className="text-base font-bold mt-2">{req.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{req.projects?.name || 'General Fund'}</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-primary">UGX {req.total_amount?.toLocaleString()}</p>
              <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1 text-xs">View Details</Button>
                {req.status === 'committee' && (
                  <Button size="sm" onClick={() => approveMutation.mutate(req.id)} className="flex-1 text-xs bg-success hover:bg-success/90">Approve</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};