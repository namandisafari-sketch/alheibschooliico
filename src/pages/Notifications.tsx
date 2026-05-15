import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bell, Send, Clock, CheckCircle, XCircle, FileText, History, Inbox, Info, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useBroadcastNotification, useInAppNotifications, useMarkNotificationRead } from "@/hooks/useInAppNotifications";
import { toast } from "@/hooks/use-toast";

const Notifications = () => {
  const broadcast = useBroadcastNotification();
  const { data: myNotifs = [] } = useInAppNotifications();
  const markRead = useMarkNotificationRead();

  const [form, setForm] = useState({
    title: "", message: "", type: "info" as "info" | "success" | "warning" | "error",
    audience: "all" as "all" | "admins" | "teachers" | "staff", link: "",
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("notification_templates").select("*").order("name");
      return data || [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["notification-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_logs").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Title and message required", variant: "destructive" });
      return;
    }
    try {
      const count = await broadcast.mutateAsync({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        audience: form.audience,
        link: form.link.trim() || undefined,
      });
      toast({ title: "Notification sent", description: `Delivered to ${count} user(s)` });
      setForm({ ...form, title: "", message: "", link: "" });
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    }
  };

  const unread = myNotifs.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout title="Notifications" subtitle="In-app inbox, broadcasts, templates and history">
      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox">
            <Inbox className="h-4 w-4 mr-2" />Inbox{unread > 0 && <Badge variant="secondary" className="ml-2">{unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="compose"><Send className="h-4 w-4 mr-2" />Broadcast</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-2" />Templates</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />SMS/WA Log</TabsTrigger>
        </TabsList>

        {/* INBOX */}
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Inbox</CardTitle>
              <CardDescription>{myNotifs.length} message(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {myNotifs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>You're all caught up</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myNotifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => !n.is_read && markRead.mutate(n.id)}
                      className={`w-full text-left rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors ${
                        !n.is_read ? "bg-primary/5 border-primary/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <TypeIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={!n.is_read ? "font-semibold" : "font-medium"}>{n.title}</p>
                            <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd MMM HH:mm")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                          {n.link && <p className="text-xs text-primary mt-1">{n.link}</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BROADCAST */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Broadcast In-App Notification</CardTitle>
              <CardDescription>Sends instantly to selected audience's inbox</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Audience</Label>
                  <Select value={form.audience} onValueChange={(v: any) => setForm({ ...form, audience: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      <SelectItem value="admins">Admins only</SelectItem>
                      <SelectItem value="teachers">Teachers only</SelectItem>
                      <SelectItem value="staff">Staff only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={500} />
              </div>
              <div className="space-y-1.5">
                <Label>Link (optional)</Label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/fees" maxLength={200} />
              </div>
              <div className="flex justify-end">
                <Button onClick={send} disabled={broadcast.isPending}>
                  <Send className="h-4 w-4 mr-2" />Send Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Templates</CardTitle>
              <CardDescription>Pre-defined SMS/WhatsApp templates (used when external messaging is enabled)</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No templates yet</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t: any) => (
                    <div key={t.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{t.name}</p>
                        <Badge variant="outline">{t.channel}</Badge>
                        {!t.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2">{t.message_body.slice(0, 200)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history">
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>SMS / WhatsApp pending integration</AlertTitle>
            <AlertDescription>
              External SMS/WhatsApp dispatch requires Twilio or WhatsApp credentials. In-app notifications are fully active above.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader><CardTitle className="text-base">External Message Log</CardTitle></CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No external messages yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead><TableHead>Channel</TableHead>
                      <TableHead>Message</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell><div className="font-medium">{l.recipient_name || "—"}</div><div className="text-xs text-muted-foreground">{l.recipient_phone}</div></TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{l.channel}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{l.message_content}</TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                        <TableCell className="text-xs">{format(new Date(l.created_at), "dd MMM HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

const TypeIcon = ({ type }: { type: string }) => {
  const map: any = {
    info: <Info className="h-5 w-5 text-primary mt-0.5" />,
    success: <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />,
    error: <XCircle className="h-5 w-5 text-destructive mt-0.5" />,
  };
  return map[type] || map.info;
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "delivered": return <Badge className="bg-green-600">Delivered</Badge>;
    case "sent": return <Badge className="bg-blue-600">Sent</Badge>;
    case "failed": return <Badge variant="destructive">Failed</Badge>;
    case "pending": return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default Notifications;
