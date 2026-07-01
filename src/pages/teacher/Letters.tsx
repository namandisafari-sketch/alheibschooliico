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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Mail, Send, Signature, Printer, FileText, Inbox } from "lucide-react";
import { SignaturePicker } from "@/components/signature/SignaturePicker";
import { LetterPrintView } from "@/components/letters/LetterPrintView";
import { LetterInbox } from "@/components/letters/LetterInbox";
import { cn } from "@/lib/utils";

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
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  const { data: userRoles = [] } = useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data || []).map((r: any) => r.role) as string[];
    },
    enabled: !!user?.id,
  });

  const canViewInbox = userRoles.some((r) =>
    ["admin", "center_director", "director", "head_teacher", "deputy_head_teacher", "dos", "dos_theology", "office_manager", "accountant", "direct_manager"].includes(r)
  );

  const { data: sent = [] } = useQuery({
    queryKey: ["my-letters", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("staff_letters" as any).select("*").eq("from_user", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const senderName = user?.user_metadata?.full_name || "Staff Member";

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    const finalBody = signatureUrl ? `${body}\n\n<!--signature:${signatureUrl}-->` : body;
    const { error } = await supabase.from("staff_letters" as any).insert({
      from_user: user!.id, to_role: toRole, subject, body: finalBody,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Letter sent" }); setSubject(""); setBody(""); setSignatureUrl(null); qc.invalidateQueries({ queryKey: ["my-letters"] });
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (admins?.length) {
        const rows = admins.map(a => ({
          user_id: a.user_id,
          title: "New Official Letter",
          message: `A letter titled "${subject}" was sent to ${RECIPIENTS.find(r => r.value === toRole)?.label || toRole}`,
          type: "request",
          link: "/teacher/letters",
        }));
        await supabase.from("in_app_notifications").insert(rows).catch(() => {});
      }
    }
  };

  return (
    <FeaturePageShell
      title="Official Letters"
      subtitle="Write formal letters to leadership"
      icon={Mail}
      features={["Send letters to Director, DOS, Manager, Office", "Track read receipts", "Letters archived for your records"]}
    >
      <Tabs defaultValue="compose" className="w-full">
        <TabsList className={cn("mb-4", canViewInbox ? "grid grid-cols-3 w-full max-w-sm" : "grid grid-cols-2 w-full max-w-xs")}>
          <TabsTrigger value="compose" className="text-xs gap-1"><Send className="h-3 w-3" /> Compose</TabsTrigger>
          <TabsTrigger value="sent" className="text-xs gap-1"><Mail className="h-3 w-3" /> Sent</TabsTrigger>
          {canViewInbox && (
            <TabsTrigger value="inbox" className="text-xs gap-1"><Inbox className="h-3 w-3" /> Inbox</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="compose">
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
              {signatureUrl && (
                <div className="flex items-center gap-2 p-2 rounded border border-border">
                  <Signature className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Signature attached</span>
                  <div className="h-8 w-16 ml-auto rounded border bg-white flex items-center justify-center p-0.5 overflow-hidden">
                    <img src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignatureUrl(null)}
                    className="text-xs text-destructive hover:underline ml-1"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={send}><Send className="h-4 w-4 mr-2" />Send letter</Button>
                <SignaturePicker onSign={(url) => setSignatureUrl(url)} label="Add Signature" variant="outline" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-3">Sent letters</h3>
              <div className="space-y-2">
                {sent.map((l: any) => (
                  <div key={l.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{l.subject}</p>
                        <p className="text-muted-foreground text-xs mt-1">{l.body?.replace(/<!--signature:.*?-->/g, "").slice(0, 200)}</p>
                        {l.body?.includes("<!--signature:") && (
                          <div className="mt-1 flex items-center gap-1">
                            <Signature className="h-3 w-3 text-muted-foreground" />
                            <img
                              src={l.body.match(/<!--signature:(.*?)-->/)?.[1]}
                              alt="Signed"
                              className="h-6 rounded border bg-white"
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString()} {l.read_at && "• Read"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{RECIPIENTS.find(r => r.value === l.to_role)?.label || l.to_role}</Badge>
                        <LetterPrintView letter={l} senderName={senderName} />
                      </div>
                    </div>
                  </div>
                ))}
                {!sent.length && <p className="text-sm text-muted-foreground">No letters sent.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canViewInbox && (
          <TabsContent value="inbox">
            <LetterInbox />
          </TabsContent>
        )}
      </Tabs>
    </FeaturePageShell>
  );
};

export default TeacherLetters;
