import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Phone,
  Send,
  Search,
  Smartphone,
  Loader2,
  Users,
  UserCircle,
  BookOpen,
  AlertCircle,
  Copy,
  Check,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { smsService } from "@/services/smsService";
import { useToast } from "@/hooks/use-toast";
import { formatUgandaDate } from "@/lib/ugandaTime";

const INITIAL_TPL =
  "Asalaam Aleykum, this is regarding your child's progress at school.";

const PLACEHOLDER_TAGS = [
  { label: "{name}", desc: "Learner name" },
  { label: "{school}", desc: "School name" },
  { label: "{date}", desc: "Current date" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ParentChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [isSendingSMS, setIsSendingSMS] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tpl, setTpl] = useState(INITIAL_TPL);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_templates")
        .select("*")
        .order("name");
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const total = contacts.length;
    const withContacts = contacts.filter((c) => c.parents.length > 0).length;
    const waReady = contacts.filter((c) =>
      c.parents.some((p: any) => p.phone)
    ).length;
    return { total, withContacts, waReady };
  }, [contacts]);

  const sendDirectSMS = async (phone: string, learnerName: string) => {
    if (!phone) return;

    setIsSendingSMS(phone);
    try {
      const mergedTemplate = tpl
        .replace(/\{name\}/gi, learnerName)
        .replace(/\{school\}/gi, "Alheib PS")
        .replace(/\{date\}/gi, formatUgandaDate(new Date()));

      const result = await smsService.sendSMS(phone, mergedTemplate);

      if (result.success) {
        toast({
          title: "SMS Sent",
          description: "Message delivered successfully to " + phone,
        });
      } else {
        toast({
          title: "SMS Failed",
          description:
            result.message || "Could not send SMS. Check balance or API key.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "A connection error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSMS(null);
    }
  };

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(phone);
      toast({ title: "Copied", description: "Phone number copied to clipboard" });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available
    }
  };

  useEffect(() => {
    if (!user) return;
    setFetchError(null);
    (async () => {
      try {
        let classList: any[] = [];

        // 1. Try classes where user is the lead teacher
        const { data: leadCls, error: leadErr } = await supabase
          .from("classes")
          .select("id, name")
          .eq("teacher_id", user.id);
        if (leadErr) throw leadErr;
        classList.push(...(leadCls || []));

        // 2. Try teacher_assignments (without join to avoid relationship issues)
        const { data: assigned, error: assErr } = await supabase
          .from("teacher_assignments")
          .select("class_id")
          .eq("teacher_id", user.id);
        if (assErr) throw assErr;

        if (assigned && assigned.length > 0) {
          const classIds = [...new Set(assigned.map((a: any) => a.class_id).filter(Boolean))];
          if (classIds.length > 0) {
            const { data: assignedClasses } = await supabase
              .from("classes")
              .select("id, name")
              .in("id", classIds);
            if (assignedClasses) {
              classList.push(...assignedClasses);
            }
          }
        }

        // Deduplicate
        const seen = new Set<string>();
        const unique = classList.filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });

        // 3. Fallback: if nothing found and user is admin/head_teacher, fetch all
        if (unique.length === 0) {
          const { data: allClasses } = await supabase
            .from("classes")
            .select("id, name")
            .order("name");
          if (allClasses && allClasses.length > 0) {
            unique.push(...allClasses);
          }
        }

        setClasses(unique);
        if (unique?.[0]) setClassId(unique[0].id);
      } catch (err: any) {
        console.error("Failed to fetch classes:", err);
        setFetchError(err.message || "Failed to load classes");
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      setContacts([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    (async () => {
      try {
        const { data: ls, error: lsErr } = await supabase
          .from("learners")
          .select(
            "id, full_name, admission_number, class_id, guardian_id, " +
            "father_name, father_phone, mother_name, mother_phone, " +
            "parent_name, parent_phone, guardian_name"
          )
          .eq("class_id", classId)
          .order("full_name");
        if (lsErr) throw lsErr;

        const learners = ls || [];

        const guardianIds = [
          ...new Set(
            learners.map((l: any) => l.guardian_id).filter(Boolean)
          ),
        ];
        let guardianMap = new Map();
        if (guardianIds.length) {
          const { data: gs, error: gErr } = await supabase
            .from("guardians")
            .select("id, full_name, phone")
            .in("id", guardianIds);
          if (gErr) throw gErr;
          guardianMap = new Map((gs || []).map((g: any) => [g.id, g]));
        }

        const grouped = learners.map((l: any) => {
          const seen = new Set<string>();
          const add = (name: string, phone: string, rel: string) => {
            const clean = (phone || "").replace(/[^\d]/g, "");
            if (!name || !clean || seen.has(clean)) return;
            seen.add(clean);
            return { full_name: name, phone: clean, relationship: rel, is_primary_contact: seen.size === 1 };
          };

          const parents: any[] = [];

          const g = l.guardian_id ? guardianMap.get(l.guardian_id) : null;
          if (g) {
            const p = add(g.full_name, g.phone, "Guardian");
            if (p) parents.push(p);
          }

          for (const src of [
            { name: l.father_name, phone: l.father_phone, rel: "Father" },
            { name: l.mother_name, phone: l.mother_phone, rel: "Mother" },
            { name: l.parent_name, phone: l.parent_phone, rel: "Parent" },
            { name: l.guardian_name, phone: l.parent_phone, rel: "Guardian" },
          ]) {
            const p = add(src.name, src.phone, src.rel);
            if (p) parents.push(p);
          }

          return { learner: l, parents };
        });
        setContacts(grouped);
      } catch (err: any) {
        console.error("Failed to fetch contacts:", err);
        setFetchError(err.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  const filtered = contacts.filter(
    (c) =>
      !filter ||
      c.learner.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      c.parents.some((p: any) =>
        p.full_name?.toLowerCase().includes(filter.toLowerCase())
      )
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
      {/* Stats */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="grid grid-cols-3 divide-x">
          {[
            { icon: Users, label: "Students", value: stats.total, color: "text-blue-600" },
            { icon: UserCircle, label: "With contacts", value: stats.withContacts, color: "text-emerald-600" },
            { icon: Mail, label: "WhatsApp ready", value: stats.waReady, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 p-4">
              <div className={`${s.color} bg-muted rounded-xl p-2.5`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">{s.value}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <SearchableSelect
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              value={classId}
              onValueChange={setClassId}
              placeholder="Select a class…"
              searchPlaceholder="Search classes…"
              emptyText="No classes found"
            />
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search learner or parent…"
                className="pl-9"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Message template
                </p>
              </div>
              <div className="flex gap-1">
                {PLACEHOLDER_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title={tag.desc}
                    onClick={() =>
                      setTpl((prev) =>
                        prev.trim().endsWith(tag.label) ? prev : prev + " " + tag.label
                      )
                    }
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            {templates.length > 0 && (
              <SearchableSelect
                options={templates.map((t: any) => ({
                  value: t.id,
                  label: t.name,
                }))}
                value=""
                onValueChange={(val: string) => {
                  const t = templates.find((x: any) => x.id === val);
                  if (t) setTpl(t.message_body || t.subject || t.name);
                }}
                placeholder="Load a saved template…"
                searchPlaceholder="Search templates…"
                emptyText="No templates match"
              />
            )}
            <Textarea
              rows={2}
              value={tpl}
              onChange={(e) => setTpl(e.target.value)}
              className="resize-none text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact list */}
      <div className="space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {!loading && filtered.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                {filter
                  ? "No contacts match your search."
                  : contacts.length === 0
                  ? "No learners found in this class."
                  : "No parent contacts on file."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter
                  ? "Try a different name."
                  : contacts.length === 0
                  ? "Add learners to this class first."
                  : "Ask the office to record parent phone numbers."}
              </p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          filtered.map((c) => (
            <Card key={c.learner.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Learner header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-transparent px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background">
                      <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                        {getInitials(c.learner.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm leading-tight">
                        {c.learner.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 font-mono"
                        >
                          {c.learner.admission_number}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {c.parents.length}{" "}
                          {c.parents.length === 1 ? "contact" : "contacts"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parents */}
                <div className="divide-y">
                  {c.parents.length === 0 && (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      No parent contact on file.
                    </div>
                  )}
                  {c.parents.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] font-semibold bg-sky-100 text-sky-700">
                          {getInitials(p.full_name || "Parent")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold">
                            {p.full_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ({p.relationship})
                          </span>
                          {p.is_primary_contact && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 h-4 font-semibold uppercase tracking-wider"
                            >
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.phone || "—"}
                        </p>
                      </div>

                      {p.phone && (
                        <TooltipProvider delayDuration={200}>
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => copyPhone(p.phone)}
                                >
                                  {copied === p.phone ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Copy number</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  asChild
                                >
                                  <a href={`tel:${p.phone}`}>
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Call {p.phone}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() =>
                                    sendDirectSMS(p.phone, c.learner.full_name)
                                  }
                                  disabled={isSendingSMS === p.phone}
                                >
                                  {isSendingSMS === p.phone ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Smartphone className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Send SMS</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-8 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  asChild
                                >
                                  <a
                                    href={wa(p.phone, c.learner.full_name)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    <span className="text-[11px] font-semibold">
                                      WA
                                    </span>
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Open WhatsApp</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </FeaturePageShell>
  );
};

export default ParentChat;
