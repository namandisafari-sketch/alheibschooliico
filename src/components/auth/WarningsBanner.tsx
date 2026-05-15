// @ts-nocheck
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WarningsBanner = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("user_warnings" as any)
        .select("*").eq("user_id", user.id).is("acknowledged_at", null).order("created_at", { ascending: false });
      setItems(data || []);
    };
    load();
    const ch = supabase.channel(`warn-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_warnings", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const ack = async (id: string) => {
    await supabase.from("user_warnings" as any).update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
    setItems((arr) => arr.filter((x) => x.id !== id));
  };

  if (!items.length) return null;
  return (
    <div className="space-y-2 mb-4">
      {items.map((w) => (
        <Card key={w.id} className={w.severity === "critical" ? "border-destructive bg-destructive/10" : "border-amber-500 bg-amber-50"}>
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className={w.severity === "critical" ? "text-destructive" : "text-amber-600"} />
            <div className="flex-1">
              <p className="font-bold text-sm">{w.title} <span className="text-[10px] uppercase ml-2 opacity-60">{w.severity}</span></p>
              <p className="text-sm text-muted-foreground mt-1">{w.message}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => ack(w.id)}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
