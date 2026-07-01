// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Coins, Check, X, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export const AdvanceApprovals = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ["director-advances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_advances")
        .select("*, employees(full_name)")
        .eq("stage", "accountant_verified")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["director-advance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advance_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];
      const userIds = data.map((r: any) => r.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name]));
      return data.map((r: any) => ({ ...r, _full_name: profileMap[r.user_id] || r.user_id?.slice(0, 8) }));
    }
  });

  const decide = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string, action: "approve" | "reject", reason?: string }) => {
      const { data, error } = await supabase.rpc("advance_custody_request", {
        _id: id,
        _action: action,
        _reason: reason
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["director-advances"] });
      toast.success("Advance request decided");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const approvePending = async (id: string) => {
    const { error } = await supabase
      .from("advance_requests")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Advance request approved");
    qc.invalidateQueries({ queryKey: ["director-advance-requests"] });
  };

  const rejectPending = async (id: string) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    const { error } = await supabase
      .from("advance_requests")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Advance request rejected");
    qc.invalidateQueries({ queryKey: ["director-advance-requests"] });
  };

  if (isLoading || requestsLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  const totalPending = advances.length + pendingRequests.length;

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-blue-50/50 p-8 border-b border-blue-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">New Advance Requests</CardTitle>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Awaiting Initial Review</p>
              </div>
              <Badge className="ml-auto bg-blue-500 text-white text-xs">{pendingRequests.length} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-lg font-black text-blue-700 border border-blue-200">
                      {req._full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{req._full_name || "Unknown"}</h4>
                      <p className="text-xs text-slate-500">Requested: {format(new Date(req.created_at), "PPP")}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 italic max-w-md">"{req.reason}"</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount Requested</p>
                      <p className="text-xl font-black text-slate-900 font-mono">{(req.amount || 0).toLocaleString()} <span className="text-xs text-slate-400">UGX</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approvePending(req.id)} className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]">
                        <Check className="h-3 w-3 mr-1.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectPending(req.id)} className="h-9 px-5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-[10px]">
                        <X className="h-3 w-3 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-amber-50/50 p-8 border-b border-amber-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Salary Advance Requests</CardTitle>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pending Final Director Sign-off</p>
            </div>
            <Badge className="ml-auto bg-amber-500 text-white text-xs">{advances.length} pending</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {advances.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">No advances pending your approval.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {advances.map((adv: any) => (
                <div key={adv.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-5">
                     <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-900 border border-slate-200">
                        {adv.employees?.full_name?.charAt(0)}
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">{adv.employees?.full_name}</h4>
                        <p className="text-xs text-slate-500 font-medium">Requested: {format(new Date(adv.created_at), "PPP")} • <span className="text-amber-600 font-bold">{adv.duration_text}</span></p>
                        <p className="text-[10px] text-slate-400 mt-1 italic max-w-md">"{adv.purpose_details || 'Personal financial support'}"</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Amount Requested</p>
                        <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{(adv.amount || 0).toLocaleString()} <span className="text-xs text-slate-400">UGX</span></p>
                     </div>
                     <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => decide.mutate({ id: adv.id, action: 'approve' })}
                          disabled={decide.isPending}
                          className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200"
                        >
                           <Check className="h-3 w-3 mr-2" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const reason = prompt("Rejection reason?");
                            if(reason) decide.mutate({ id: adv.id, action: 'reject', reason });
                          }}
                          disabled={decide.isPending}
                          className="h-10 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-[10px]"
                        >
                           <X className="h-3 w-3 mr-2" /> Reject
                        </Button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
