// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, AlertCircle, Bell, CheckCircle2, MessageSquare, Info, ShieldAlert, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TeacherInbox = () => {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [warns, setWarns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInbox = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: m } = await supabase
        .from("direct_messages" as any)
        .select("*")
        .eq("to_user", user.id)
        .order("created_at", { ascending: false });
      
      const { data: w } = await supabase
        .from("user_warnings" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setMsgs(m || []);
      setWarns(w || []);
    } catch (err) {
      console.error("Error loading inbox:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadInbox();
    const ch = supabase.channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `to_user=eq.${user.id}` }, () => loadInbox())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_warnings", filter: `user_id=eq.${user.id}` }, () => loadInbox())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, loadInbox]);

  const acknowledgeWarning = async (id: string) => {
    const { error } = await supabase
      .from("user_warnings" as any)
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to acknowledge warning");
    } else {
      toast.success("Warning acknowledged");
      loadInbox();
    }
  };

  const markMessageRead = async (id: string) => {
    const { error } = await supabase
      .from("direct_messages" as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    
    if (!error) loadInbox();
  };

  const unreadMessagesCount = msgs.filter(m => !m.read_at).length;
  const unacknowledgedWarningsCount = warns.filter(w => !w.acknowledged_at).length;

  return (
    <DashboardLayout title="Communication Hub" subtitle="Official notices, warnings & direct communication">
      <div className="space-y-6">
        <Tabs defaultValue="messages" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="messages" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Mail className="h-4 w-4 mr-2" />
                Messages
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="warnings" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Warnings
                {unacknowledgedWarningsCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {unacknowledgedWarningsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <Button variant="ghost" size="sm" onClick={loadInbox} className="text-xs font-bold text-muted-foreground hover:text-primary">
              <Bell className="h-3 w-3 mr-2" /> Refresh
            </Button>
          </div>

          <TabsContent value="messages" className="space-y-4 focus-visible:outline-none">
            {msgs.length > 0 ? (
              <div className="grid gap-4">
                {msgs.map((m) => (
                  <Card key={m.id} className={`border-slate-200 shadow-sm transition-all hover:shadow-md ${!m.read_at ? 'border-l-4 border-l-primary' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-full h-fit ${m.urgent ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">System Message</span>
                              {m.urgent && <Badge variant="destructive" className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0">Urgent</Badge>}
                              {!m.read_at && <Badge className="bg-primary/10 text-primary border-none text-[10px]">Unread</Badge>}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700">{m.body}</p>
                          <div className="flex justify-end pt-2">
                            {!m.read_at && (
                              <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => markMessageRead(m.id)}>
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <Inbox className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-500">Your inbox is empty</p>
                <p className="text-xs text-slate-400 mt-1">Direct messages from leadership will appear here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="warnings" className="space-y-4 focus-visible:outline-none">
            {warns.length > 0 ? (
              <div className="grid gap-4">
                {warns.map((w) => (
                  <Card key={w.id} className={`border-slate-200 shadow-sm transition-all hover:shadow-md ${w.severity === 'critical' ? 'border-l-4 border-l-red-600 bg-red-50/20' : 'border-l-4 border-l-amber-500 bg-amber-50/20'}`}>
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-full h-fit ${w.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm tracking-tight">{w.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-[9px] font-black uppercase px-1.5 py-0 border-none ${w.severity === 'critical' ? 'bg-red-600' : 'bg-amber-500'}`}>
                                  {w.severity}
                                </Badge>
                                {w.acknowledged_at && (
                                  <span className="flex items-center text-[10px] text-emerald-600 font-bold">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Acknowledged
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(w.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed py-1">{w.message}</p>
                          <div className="flex justify-end pt-2">
                            {!w.acknowledged_at ? (
                              <Button 
                                size="sm" 
                                className={`h-8 font-bold text-xs ${w.severity === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                                onClick={() => acknowledgeWarning(w.id)}
                              >
                                Acknowledge Notice
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Action taken on {new Date(w.acknowledged_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-200">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-emerald-700">All clear!</p>
                <p className="text-xs text-emerald-600 mt-1">No administrative warnings found on your record.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="border-slate-200 bg-slate-50 shadow-sm border-dashed">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg border shadow-sm">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-sm">Need to Appeal?</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If you believe a warning was issued in error or you have mitigating circumstances, you can submit an appeal directly to the Executive Board for review.
                </p>
                <div className="flex gap-3 mt-3">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold">
                    Submit Appeal
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold">
                    View My Appeals
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherInbox;
