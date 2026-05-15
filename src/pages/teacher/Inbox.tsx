// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, AlertCircle } from "lucide-react";

const TeacherInbox = () => {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [warns, setWarns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: m } = await supabase.from("direct_messages" as any).select("*").eq("to_user", user.id).order("created_at", { ascending: false });
      const { data: w } = await supabase.from("user_warnings" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setMsgs(m || []); setWarns(w || []);
    };
    load();
    const ch = supabase.channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `to_user=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_warnings", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <FeaturePageShell
      title="Inbox"
      subtitle="Realtime messages and warnings from leadership"
      icon={Inbox}
      features={["Direct messages from director", "Warnings and notices", "Acknowledge to clear", "Live updates"]}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" />Warnings</h3>
          <div className="space-y-2">
            {warns.map((w) => (
              <div key={w.id} className={`border rounded-lg p-3 ${w.severity === "critical" ? "border-destructive bg-destructive/5" : "border-amber-500 bg-amber-50"}`}>
                <div className="flex justify-between"><p className="font-semibold text-sm">{w.title}</p><Badge>{w.severity}</Badge></div>
                <p className="text-sm mt-1">{w.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(w.created_at).toLocaleString()} {w.acknowledged_at && "• Acknowledged"}</p>
              </div>
            ))}
            {!warns.length && <p className="text-sm text-muted-foreground">No warnings.</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-3">Messages</h3>
          <div className="space-y-2">
            {msgs.map((m) => (
              <div key={m.id} className={`border rounded-lg p-3 ${m.urgent ? "border-destructive" : ""}`}>
                {m.urgent && <Badge variant="destructive" className="mb-1">URGENT</Badge>}
                <p className="text-sm">{m.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
              </div>
            ))}
            {!msgs.length && <p className="text-sm text-muted-foreground">No messages.</p>}
          </div>
        </CardContent>
      </Card>
    </FeaturePageShell>
  );
};

export default TeacherInbox;
