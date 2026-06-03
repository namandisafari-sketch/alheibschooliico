// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Send, Search, Smartphone, Loader2 } from "lucide-react";
import { smsService } from "@/services/smsService";
import { useToast } from "@/hooks/use-toast";
import { formatUgandaDate } from "@/lib/ugandaTime";

const ParentChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [isSendingSMS, setIsSendingSMS] = useState<string | null>(null);
  const [tpl, setTpl] = useState(
    "Asalaam Aleykum, this is regarding your child's progress at school."
  );

  const sendDirectSMS = async (phone: string, learnerName: string) => {
    if (!phone) return;
    
    setIsSendingSMS(phone);
    try {
      // Mail Merge Logic: Replace {name} with learnerName and {school} with school name
      const mergedTemplate = tpl
        .replace(/\{name\}/gi, learnerName)
        .replace(/\{school\}/gi, "Alheib PS")
          .replace(/\{date\}/gi, formatUgandaDate(new Date()));
      
      if (result.success) {
        toast({
          title: "SMS Sent",
          description: "Message delivered successfully to " + phone
        });
      } else {
        toast({
          title: "SMS Failed",
          description: result.message || "Could not send SMS. Check balance or API key.",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "A connection error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSendingSMS(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get classes where teacher is lead
      const { data: leadCls } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);
      
      // Get classes where teacher is assigned to any subject
      const { data: assigned } = await supabase
        .from("teacher_assignments")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", user.id);

      const allClassMap = new Map();
      (leadCls || []).forEach(c => allClassMap.set(c.id, c));
      (assigned || []).forEach(a => {
        if (a.classes) allClassMap.set(a.class_id, a.classes);
      });

      const unique = Array.from(allClassMap.values());
      setClasses(unique);
      if (unique?.[0]) setClassId(unique[0].id);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const { data: ls } = await supabase
        .from("learners")
        .select("id, full_name, admission_number, class_id")
        .eq("class_id", classId)
        .order("full_name");
      const ids = (ls || []).map((l: any) => l.id);
      const { data: parents } = await supabase
        .from("learner_parents")
        .select("learner_id, full_name, phone, relationship, is_primary_contact")
        .in("learner_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const grouped = (ls || []).map((l: any) => ({
        learner: l,
        parents: (parents || []).filter((p: any) => p.learner_id === l.id),
      }));
      setContacts(grouped);
    })();
  }, [classId]);

  const filtered = contacts.filter(
    (c) =>
      !filter ||
      c.learner.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      c.parents.some((p: any) => p.full_name?.toLowerCase().includes(filter.toLowerCase()))
  );

  const wa = (phone: string, learnerName: string) => {
    const clean = phone.replace(/[^\d]/g, "");
    const msg = encodeURIComponent(
      `${tpl}\n\nLearner: ${learnerName}\n— Sent via TennaHub`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  };

  return (
    <FeaturePageShell
      title="Parent Chat"
      subtitle="Direct WhatsApp & SMS to learner parents"
      icon={MessageSquare}
      badge="Teacher"
      features={[
        "Filtered to your class only",
        "Primary contact highlighted",
        "Pre-filled message template",
        "One-tap WhatsApp / call",
      ]}
    >
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <select
              className="border rounded-md p-2 text-sm"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search learner or parent…"
                className="pl-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase mb-1">Message template</p>
            <Input value={tpl} onChange={(e) => setTpl(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filtered.map((c) => (
          <Card key={c.learner.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{c.learner.full_name}</p>
                  <p className="text-xs text-muted-foreground">{c.learner.admission_number}</p>
                </div>
                <Badge variant="outline">{c.parents.length} contact{c.parents.length === 1 ? "" : "s"}</Badge>
              </div>
              <div className="space-y-1.5">
                {c.parents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No parent contact on file.</p>
                )}
                {c.parents.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm border rounded-lg p-2">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {p.full_name}{" "}
                        <span className="text-xs text-muted-foreground">({p.relationship})</span>
                        {p.is_primary_contact && (
                          <Badge className="ml-1 text-[10px]" variant="secondary">Primary</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.phone || "—"}</p>
                    </div>
                    {p.phone && (
                      <>
                        <Button asChild size="sm" variant="outline" className="h-8 px-2.5">
                          <a href={`tel:${p.phone}`}>
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 gap-1.5 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => sendDirectSMS(p.phone, c.learner.full_name)}
                          disabled={isSendingSMS === p.phone}
                        >
                          {isSendingSMS === p.phone ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Smartphone className="h-3.5 w-3.5" />
                          )}
                          SMS
                        </Button>
                        <Button asChild size="sm" className="h-8 gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700">
                          <a href={wa(p.phone, c.learner.full_name)} target="_blank" rel="noreferrer">
                            <Send className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && (
          <p className="text-sm text-muted-foreground">No contacts match.</p>
        )}
      </div>
    </FeaturePageShell>
  );
};

export default ParentChat;
