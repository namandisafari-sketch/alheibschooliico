// @ts-nocheck
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Sparkles, Send, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Props {
  pageKey: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  features: string[];
  badge?: string;
}

interface Note {
  id: string;
  page_key: string;
  title: string | null;
  body: string;
  created_at: string;
  created_by: string | null;
  author_name?: string | null;
}

export const ScratchPage = ({ pageKey, title, subtitle, icon: Icon, features, badge }: Props) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [bodyInput, setBodyInput] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_notes")
      .select("*")
      .eq("page_key", pageKey)
      .order("created_at", { ascending: false })
      .limit(25);
    if (!error) setNotes((data as Note[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [pageKey]);

  const submit = async () => {
    if (!bodyInput.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("page_notes").insert({
      page_key: pageKey,
      title: titleInput.trim() || null,
      body: bodyInput.trim(),
      created_by: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setTitleInput(""); setBodyInput("");
    toast({ title: "Saved" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("page_notes").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <div className="space-y-6">
        {/* Hero */}
        <Card className="border-2 border-slate-100 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-7 w-7" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">{title}</h2>
                  {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
                </div>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capabilities</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex gap-2 items-start text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick entry */}
        <Card className="border-2 border-slate-100 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add an entry</p>
            <Input
              placeholder="Short title (optional)"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
            />
            <Textarea
              placeholder="What happened? Any details, names, follow-ups..."
              value={bodyInput}
              onChange={(e) => setBodyInput(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={submit} disabled={submitting || !bodyInput.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Save entry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feed */}
        <Card className="border-2 border-slate-100 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent entries</p>
              <Badge variant="secondary">{notes.length}</Badge>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No entries yet — add the first one above.</p>
            ) : (
              <div className="divide-y">
                {notes.map((n) => (
                  <div key={n.id} className="py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {n.title && <p className="font-semibold text-sm">{n.title}</p>}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {n.created_by === user?.id && (
                      <Button variant="ghost" size="icon" onClick={() => remove(n.id)} className="h-8 w-8 text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
