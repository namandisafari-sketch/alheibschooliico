import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Send, Mail, History, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  reply_to: string;
}

const DEFAULT_SETTINGS: SmtpSettings = {
  smtp_host: "",
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: "",
  smtp_pass: "",
  from_name: "Al-Heib School",
  from_email: "noreply@sised.sc.ug",
  reply_to: "",
};

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export const EmailSettingsCard = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SmtpSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings({
          smtp_host: json.data.smtp_host || "",
          smtp_port: json.data.smtp_port || 587,
          smtp_secure: json.data.smtp_secure || false,
          smtp_user: json.data.smtp_user || "",
          smtp_pass: json.data.smtp_pass || "",
          from_name: json.data.from_name || "Al-Heib School",
          from_email: json.data.from_email || "noreply@sised.sc.ug",
          reply_to: json.data.reply_to || "",
        });
      }
    } catch (e) {
      console.error("Failed to load email settings", e);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/email/logs?limit=10");
      const json = await res.json();
      if (json.success) setLogs(json.data || []);
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Saved", description: "Email settings saved successfully." });
        loadSettings();
      } else {
        toast({ title: "Error", description: json.message || "Failed to save", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Test Sent", description: `Test email sent to ${testEmail}` });
        loadLogs();
      } else {
        toast({ title: "Test Failed", description: json.message || "Could not send test", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email / SMTP Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Email / SMTP Settings</CardTitle>
        </div>
        <CardDescription>Configure the SMTP server for sending system emails.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>SMTP Host</Label>
            <Input
              placeholder="smtp.gmail.com"
              value={settings.smtp_host}
              onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP Port</Label>
            <Input
              type="number"
              placeholder="587"
              value={settings.smtp_port}
              onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              placeholder="your@email.com"
              value={settings.smtp_user}
              onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="SMTP password or app password"
              value={settings.smtp_pass}
              onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Label htmlFor="smtp-secure">Use TLS/SSL</Label>
            <Switch
              id="smtp-secure"
              checked={settings.smtp_secure}
              onCheckedChange={(v) => setSettings({ ...settings, smtp_secure: v })}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-bold mb-4">Sender Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reply-To (optional)</Label>
              <Input
                placeholder="admin@sised.sc.ug"
                value={settings.reply_to}
                onChange={(e) => setSettings({ ...settings, reply_to: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Input
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-52"
            />
            <Button variant="secondary" onClick={sendTest} disabled={testing || !testEmail} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Test
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-bold">Recent Email Logs</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={loadLogs} disabled={logsLoading}>
              <Loader2 className={`h-3 w-3 ${logsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">No email logs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.created_at).toLocaleDateString()}{" "}
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-xs">{log.recipient_email}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{log.subject}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[10px]">
                        {log.status === "sent" ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Sent</>
                        ) : (
                          <><AlertCircle className="h-3 w-3 mr-1" /> {log.error_message ? "Failed" : log.status}</>
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
