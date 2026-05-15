// @ts-nocheck
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";

const RECIPIENTS = [
  { value: "center_director", label: "Center Director" },
  { value: "direct_manager", label: "Direct Manager" },
  { value: "dos", label: "Director of Studies (DOS)" },
  { value: "head_teacher", label: "Head Teacher" },
  { value: "office_manager", label: "Office Manager" },
  { value: "accountant", label: "Accountant" },
];

const TeacherLetters = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [toRole, setToRole] = useState("center_director");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: sent = [] } = useQuery({
    queryKey: ["my-letters", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("staff_letters" as any).select("*").eq("from_user", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    const { error } = await supabase.from("staff_letters" as any).insert({
      from_user: user!.id, to_role: toRole, subject, body,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Letter sent" }); setSubject(""); setBody(""); qc.invalidateQueries({ queryKey: ["my-letters"] }); }
  };

  return (
    <FeaturePageShell
      title="Official Letters"
      subtitle="Write formal letters to leadership"
      icon={Mail}
      features={["Send letters to Director, DOS, Manager, Office", "Track read receipts", "Letters archived for your records"]}
    >
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold">Compose</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Recipient</Label>
              <Select value={toRole} onValueChange={setToRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RECIPIENTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          </div>
          <div><Label>Letter body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} /></div>
          <Button onClick={send}><Send className="h-4 w-4 mr-2" />Send letter</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-3">Sent letters</h3>
          <div className="space-y-2">
            {sent.map((l: any) => (
              <div key={l.id} className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <p className="font-semibold">{l.subject}</p>
                  <Badge variant="outline">to: {l.to_role}</Badge>
                </div>
                <p className="text-muted-foreground text-xs mt-1">{l.body?.slice(0, 200)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString()} {l.read_at && "• Read"}</p>
              </div>
            ))}
            {!sent.length && <p className="text-sm text-muted-foreground">No letters sent.</p>}
          </div>
        </CardContent>
      </Card>
    </FeaturePageShell>
  );
};

export default TeacherLetters;
