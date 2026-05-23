// @ts-nocheck
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL, PERMISSION_KEYS, DEFAULT_PERMISSIONS } from "@/lib/roleConfig";
import { Shield, UserPlus, AlertTriangle, MessageSquare, ShieldOff, ShieldCheck, KeyRound, Send, RotateCcw } from "lucide-react";

const ALL_ROLES = Object.keys(ROLE_LABEL).filter((r) => r !== "admin");

const UserManagement = () => {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [permsUser, setPermsUser] = useState<any>(null);
  const [killUser, setKillUser] = useState<any>(null);
  const [warnUser, setWarnUser] = useState<any>(null);
  const [dmUser, setDmUser] = useState<any>(null);

  const { role: myRole, loading: authLoading } = useAuth() as any;
  const allowed = ["admin", "director", "center_director"].includes(myRole);

  const { data: users = [], refetch } = useQuery({
    queryKey: ["dir-users"],
    enabled: allowed,
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("full_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const rmap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
      return (profiles || []).map((p: any) => ({ ...p, role: rmap.get(p.id) || null }));
    },
  });

  const filtered = users.filter((u: any) =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!authLoading && !allowed) {
    return (
      <DashboardLayout title="Access Restricted" subtitle="">
        <Card className="max-w-xl mx-auto mt-12">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-destructive" />Restricted Area</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">User management is only available to administrators and directors. Please contact the school director if you believe you should have access.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Director • User Control" subtitle="Create, restrict, suspend, message and kick any user in real-time">

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input placeholder="Search by name, email, role…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Create user</Button>
          </DialogTrigger>
          <CreateUserDialog onClose={() => { setCreateOpen(false); refetch(); }} />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((u: any) => (
          <Card key={u.id} className={u.account_status === "disconnected" ? "border-destructive/50 bg-destructive/5" : u.account_status === "suspended" ? "border-amber-500/50 bg-amber-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{u.full_name || "Unnamed"}</CardTitle>
                  <p className="text-xs text-muted-foreground italic mt-0.5">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "destructive" : "secondary"} className="text-[10px]">
                  {u.role ? ROLE_LABEL[u.role] || u.role : "no role"}
                </Badge>
              </div>
              {u.account_status !== "active" && (
                <div className="text-[11px] mt-2 px-2 py-1 rounded bg-background/80 border">
                  <span className="font-bold uppercase">{u.account_status}</span>
                  {u.suspension_reason && <span className="text-muted-foreground"> — {u.suspension_reason}</span>}
                </div>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => setPermsUser(u)}><KeyRound className="h-3 w-3 mr-1" />Permissions</Button>
              <Button size="sm" variant="outline" onClick={() => setDmUser(u)}><MessageSquare className="h-3 w-3 mr-1" />Message</Button>
              <Button size="sm" variant="outline" onClick={() => setWarnUser(u)}><AlertTriangle className="h-3 w-3 mr-1" />Warn</Button>
              <Button size="sm" variant="outline" onClick={() => resetPassword(u.email)}><RotateCcw className="h-3 w-3 mr-1" />Reset PW</Button>
              {u.account_status === "active" ? (
                <Button size="sm" variant="destructive" className="col-span-2" onClick={() => setKillUser(u)} disabled={u.id === me?.id}><ShieldOff className="h-3 w-3 mr-1" />Disconnect account</Button>
              ) : (
                <Button size="sm" variant="default" className="col-span-2" onClick={() => reactivate(u.id, qc)}><ShieldCheck className="h-3 w-3 mr-1" />Reactivate account</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {permsUser && <PermissionsDialog user={permsUser} onClose={() => { setPermsUser(null); qc.invalidateQueries({ queryKey: ["dir-users"] }); }} />}
      {killUser && <KillDialog user={killUser} onClose={() => { setKillUser(null); refetch(); }} byId={me?.id} />}
      {warnUser && <WarnDialog user={warnUser} onClose={() => setWarnUser(null)} byId={me?.id} />}
      {dmUser && <DmDialog user={dmUser} onClose={() => setDmUser(null)} byId={me?.id} />}
    </DashboardLayout>
  );
};

async function reactivate(uid: string, qc: any) {
  const { error } = await supabase.from("profiles").update({ account_status: "active", suspension_reason: null, suspended_until: null }).eq("id", uid);
  if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
  else { toast({ title: "Reactivated", description: "User can sign in again." }); qc.invalidateQueries({ queryKey: ["dir-users"] }); }
}

async function resetPassword(email: string) {
  if (!email) { toast({ title: "No email on file", variant: "destructive" }); return; }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=1`,
  });
  if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
  else toast({ title: "Reset link sent", description: `Sent to ${email}` });
}

const CreateUserDialog = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("teacher");
  const [password, setPassword] = useState("1234school.com");
  const [busy, setBusy] = useState(false);

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const email = `${slug || "user"}.${role}@alheib.com`;

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email, password, fullName: name, phone, role },
    });
    if (error || (data as any)?.error) {
      toast({ title: "Failed", description: (data as any)?.error || error?.message, variant: "destructive" });
      setBusy(false); return;
    }
    const uid = (data as any)?.user_id;
    if (uid) {
      const defaults = (DEFAULT_PERMISSIONS as any)[role] || [];
      if (defaults.length) {
        await supabase.from("user_permissions" as any).insert(
          defaults.map((k: string) => ({ user_id: uid, permission_key: k, allowed: true }))
        );
      }
    }
    toast({ title: "Created", description: `${email} • password: ${password}` });
    setBusy(false); onClose();
  };


  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Create new user</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r as any] || r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Password</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <p className="text-xs text-muted-foreground">Email will be: <span className="font-mono text-primary">{email}</span></p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={busy || !name.trim()}>Create + assign defaults</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const PermissionsDialog = ({ user, onClose }: any) => {
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  useEffect(() => {
    supabase.from("user_permissions" as any).select("permission_key, allowed").eq("user_id", user.id).then(({ data }) => {
      const m: Record<string, boolean> = {};
      (data || []).forEach((p: any) => { m[p.permission_key] = p.allowed; });
      setPerms(m);
    });
  }, [user.id]);

  const toggle = async (key: string, value: boolean) => {
    setPerms((p) => ({ ...p, [key]: value }));
    await supabase.from("user_permissions" as any).upsert({ user_id: user.id, permission_key: key, allowed: value }, { onConflict: "user_id,permission_key" });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Permissions • {user.full_name}</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {PERMISSION_KEYS.map((p) => (
            <div key={p.key} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{p.key}</p>
              </div>
              <Switch checked={!!perms[p.key]} onCheckedChange={(v) => toggle(p.key, v)} />
            </div>
          ))}
        </div>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const KillDialog = ({ user, onClose, byId }: any) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      account_status: "disconnected",
      suspension_reason: reason || "Disconnected by director.",
      suspended_by: byId, suspended_at: new Date().toISOString(),
    } as any).eq("id", user.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Disconnected", description: `${user.full_name} will be kicked out instantly.` });
    setBusy(false); onClose();
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-destructive">Disconnect {user.full_name}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">They will be signed out immediately and shown the reason on the login screen.</p>
        <Textarea placeholder="Reason shown to user…" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy}><ShieldOff className="h-4 w-4 mr-2" />Disconnect now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WarnDialog = ({ user, onClose, byId }: any) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("warning");
  const submit = async () => {
    if (!title.trim() || !message.trim()) return;
    const { error } = await supabase.from("user_warnings" as any).insert({
      user_id: user.id, issued_by: byId, severity, title, message,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Warning issued" });
    onClose();
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Warn {user.full_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Issue</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DmDialog = ({ user, onClose, byId }: any) => {
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const submit = async () => {
    if (!body.trim()) return;
    const { error } = await supabase.from("direct_messages" as any).insert({
      from_user: byId, to_user: user.id, body, urgent,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Message sent" });
    onClose();
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Message {user.full_name}</DialogTitle></DialogHeader>
        <Textarea placeholder="Your message…" value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
        <div className="flex items-center gap-2">
          <Switch checked={urgent} onCheckedChange={setUrgent} id="urg" />
          <Label htmlFor="urg">Mark as urgent</Label>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}><Send className="h-4 w-4 mr-2" />Send</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;
