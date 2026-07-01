import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Search, Signature, Inbox, ChevronDown, ChevronUp } from "lucide-react";
import { LetterPrintView } from "./LetterPrintView";
import { cn } from "@/lib/utils";

const ROLE_MAP: Record<string, string> = {
  admin: "admin",
  center_director: "center_director",
  director: "center_director",
  head_teacher: "head_teacher",
  deputy_head_teacher: "head_teacher",
  dos: "dos",
  dos_theology: "dos",
  office_manager: "office_manager",
  accountant: "accountant",
  direct_manager: "direct_manager",
};

export const LetterInbox = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: userRoles = [] } = useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data || []).map((r: any) => r.role) as string[];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles.includes("admin");

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ["letter-inbox", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase.from("staff_letters" as any).select("*");

      if (!isAdmin) {
        const targetRoles = userRoles
          .map((r) => ROLE_MAP[r])
          .filter(Boolean) as string[];
        targetRoles.push(...userRoles);
        const unique = [...new Set(targetRoles)];
        if (unique.length > 0) {
          query = query.in("to_role", unique);
        } else {
          return [];
        }
      }

      const { data } = await query
        .order("created_at", { ascending: false })
        .limit(50);

      return (data || []).filter((l: any) => l.from_user !== user?.id);
    },
    enabled: !!user?.id && userRoles.length > 0,
  });

  const markRead = async (id: string) => {
    await supabase.from("staff_letters" as any).update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null).catch(() => {});
  };

  const filtered = letters.filter((l: any) =>
    !search || l.subject?.toLowerCase().includes(search.toLowerCase()) ||
    l.body?.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = letters.filter((l: any) => !l.read_at).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-1 text-[10px] h-5">{unreadCount} unread</Badge>
            )}
          </h3>
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search letters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <Mail className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No letters received</p>
            <p className="text-xs">Letters sent to your role will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((l: any) => {
              const isExpanded = expandedId === l.id;
              return (
                <div
                  key={l.id}
                  className={cn(
                    "border rounded-lg text-sm transition-colors cursor-pointer",
                    isExpanded ? "border-primary/30" : "border-border hover:border-muted-foreground/30",
                    !l.read_at && "bg-primary/5 border-l-primary"
                  )}
                  onClick={() => {
                    setExpandedId(isExpanded ? null : l.id);
                    if (!l.read_at) markRead(l.id);
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!l.read_at && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                          <p className={cn("font-medium truncate", !l.read_at && "font-semibold")}>{l.subject}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          From: {l.sender_name || "Staff Member"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{l.to_role}</Badge>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {l.body?.replace(/<!--signature:.*?-->/g, "")}
                        </p>
                        {l.body?.includes("<!--signature:") && (
                          <div className="flex items-center gap-2">
                            <Signature className="h-3 w-3 text-muted-foreground" />
                            <img
                              src={l.body.match(/<!--signature:(.*?)-->/)?.[1]}
                              alt="Signed"
                              className="h-8 rounded border bg-white"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(l.created_at).toLocaleString()}
                            {l.read_at && <> · Read {new Date(l.read_at).toLocaleString()}</>}
                          </p>
                          <LetterPrintView letter={l} senderName={l.sender_name} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
