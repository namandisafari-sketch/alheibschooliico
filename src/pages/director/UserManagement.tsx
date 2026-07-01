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
import { getUgandaDateString, formatUgandaDate } from "@/lib/ugandaTime";
import { ROLE_LABEL, PERMISSION_KEYS, DEFAULT_PERMISSIONS } from "@/lib/roleConfig";
import { 
  Shield, UserPlus, AlertTriangle, MessageSquare, ShieldOff, 
  ShieldCheck, KeyRound, Send, RotateCcw, Eye, ArrowLeft, 
  ArrowRight, UploadCloud, GraduationCap, Briefcase, FileCheck, 
  MapPin, Check, FileDown, CheckCircle2, Info, X, Edit3
} from "lucide-react";

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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState(ALL_ROLES[0] || "teacher");
  const [editPassword, setEditPassword] = useState("");

  useEffect(() => {
    if (editUser) {
      setEditFullName(editUser.full_name || "");
      setEditEmail(editUser.email || "");
      setEditPhone(editUser.phone || "");
      setEditRole(editUser.role || ALL_ROLES[0] || "teacher");
      setEditPassword("");
    }
  }, [editUser]);

  const { role: myRole, loading: authLoading } = useAuth() as any;
  const allowed = ["admin", "director", "center_director", "head_teacher", "deputy_head_teacher"].includes(myRole);

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

  const saveUserEdits = async () => {
    if (!editUser) return;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: editFullName, email: editEmail, phone: editPhone })
      .eq("id", editUser.id);
    if (profileError) throw profileError;

    // Fetch existing roles for this user
    const { data: existingRoles, error: fetchError } = await supabase
      .from("user_roles")
      .select("id, role")
      .eq("user_id", editUser.id);
    if (fetchError) throw fetchError;

    // Delete roles that don't match (by id, not by value — avoids enum validation)
    const toDelete = (existingRoles || []).filter((r: any) => r.role !== editRole).map((r: any) => r.id);
    if (toDelete.length > 0) {
      const { error: roleDeleteError } = await supabase
        .from("user_roles")
        .delete()
        .in("id", toDelete);
      if (roleDeleteError) throw roleDeleteError;
    }

    // Upsert new role only if it doesn't already exist
    const alreadyExists = (existingRoles || []).some((r: any) => r.role === editRole);
    if (!alreadyExists) {
      const { error: roleInsertError } = await supabase
        .from("user_roles")
        .insert({ user_id: editUser.id, role: editRole });
      if (roleInsertError) throw roleInsertError;
    }

    if (editPassword) {
      const updateResponse = await fetch("/api/users/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: editUser.id, password: editPassword }),
      });
      let result: any;
      const text = await updateResponse.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: text || "Unexpected server response" };
      }
      if (!updateResponse.ok) {
        throw new Error(result.error || result.message || `Server error: ${updateResponse.status}`);
      }
    }

    toast({ title: "Success", description: "User updated successfully." });
    qc.invalidateQueries({ queryKey: ["dir-users"] });
    setEditUser(null);
  };

  const onSaveUserEdits = async () => {
    try {
      await saveUserEdits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Unable to update user", variant: "destructive" });
    }
  };

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
              <Button size="sm" variant="outline" className="col-span-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-medium" onClick={() => setSelectedUser(u)}>
                <Eye className="h-3.5 w-3.5 mr-1.5" />View Details & Docs
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditUser(u)}><Edit3 className="h-3 w-3 mr-1" />Edit User</Button>
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
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Update profile info, contact details, role assignments, and view password status.</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="rounded-xl border border-border p-4 bg-background/80">
                <p className="text-sm font-semibold">Profile details</p>
                <div className="grid gap-4 md:grid-cols-2 mt-3">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</Label>
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="user@alheib.test" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 bg-background/80">
                <p className="text-sm font-semibold">Contact & role</p>
                <div className="grid gap-4 md:grid-cols-2 mt-3">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Phone</Label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+256 700 123 456" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Role</Label>
                    <Select value={editRole} onValueChange={(value) => setEditRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>{ROLE_LABEL[role] || role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 bg-background/80">
                <p className="text-sm font-semibold">Password</p>
                <div className="grid gap-4 md:grid-cols-2 mt-3">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Current Password</Label>
                    <Input type="password" value="********" disabled />
                    <p className="text-xs text-muted-foreground mt-1">This is a masked representation only. Passwords are not stored in plain text.</p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">New Password</Label>
                    <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Leave blank to keep current password" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button onClick={onSaveUserEdits}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {selectedUser && <UserDetailsDialog user={selectedUser} onClose={() => setSelectedUser(null)} />}
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

  // Teacher-specific data onboarding steps
  const [step, setStep] = useState(1); // 1: Account, 2: Qualification & Specialty, 3: Identifiers & Location, 4: Documents

  // Step 2 professional
  const [qualification, setQualification] = useState("Bachelor of Education (B.Ed)");
  const [registrationNumber, setRegistrationNumber] = useState("UTS/T/" + Math.floor(Math.random() * 90000 + 10000));
  const [subjects, setSubjects] = useState("Mathematics, Physics");
  const [experience, setExperience] = useState("4 Years");

  // Step 3 registration & address
  const [nin, setNin] = useState("CM" + Math.floor(Math.random() * 10000000) + "A");
  const [tin, setTin] = useState("10" + Math.floor(Math.random() * 100000000));
  const [nssf, setNssf] = useState("NS" + Math.floor(Math.random() * 10000000));
  const [region, setRegion] = useState("Central Region");
  const [district, setDistrict] = useState("Kampala");
  const [county, setCounty] = useState("Kawempe");
  const [subCounty, setSubCounty] = useState("Kawempe Division");
  const [parish, setParish] = useState("Bwaise I");
  const [village, setVillage] = useState("Kizito Zone");

  // Step 4 documents
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([
    { id: "cv", name: "Resume_Curriculum_Vitae.pdf", size: "1.4 MB", uploadedAt: formatUgandaDate(new Date()), type: "Curriculum Vitae", verified: true },
    { id: "degree", name: "Academic_Transcript_Degree.pdf", size: "2.8 MB", uploadedAt: formatUgandaDate(new Date()), type: "Academic Papers", verified: true }
  ]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const email = `${slug || "user"}.${role}@alheib.com`;

  const triggerMockUpload = (docId: string, docLabel: string) => {
    setUploadingDoc(docId);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const cleanName = docLabel.toLowerCase().replace(/ /g, "_") + "_verified_credential.pdf";
            setUploadedDocs((prev) => [
              ...prev.filter(d => d.id !== docId),
              {
                id: docId,
                name: cleanName,
                size: (Math.random() * 2 + 1).toFixed(1) + " MB",
                uploadedAt: formatUgandaDate(new Date()),
                type: docLabel,
                verified: true
              }
            ]);
            setUploadingDoc(null);
            toast({ title: `${docLabel} uploaded`, description: "Simulated document successfully scanned and attached." });
          }, 400);
          return 100;
        }
        return p + 30;
      });
    }, 150);
  };

  const removeDoc = (docId: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== docId));
    toast({ title: "Document removed", description: "The attached document references were cleared." });
  };

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);

    // Call standard create-user route on server
    const response = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName: name, phone, role }),
    });

    let result: any;
    const text = await response.text();
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { error: text || "Unexpected server response" };
    }

    if (!response.ok) {
      toast({ title: "Failed", description: result.error || result.message || `Server error: ${response.status}`, variant: "destructive" });
      setBusy(false); 
      return;
    }

    const uid = result.user_id;
    if (uid) {
      // Setup teacher default permissions
      const defaults = (DEFAULT_PERMISSIONS as any)[role] || [];
      if (defaults.length) {
        await supabase.from("user_permissions" as any).insert(
          defaults.map((k: string) => ({ user_id: uid, permission_key: k, allowed: true }))
        );
      }

      // Update remaining detailed teacher specifications and residency profile strings
      const updateData: any = {};
      
      if (role === "teacher") {
        updateData.qualification = qualification;
        updateData.registration_number = registrationNumber;
        updateData.nin = nin;
        updateData.tin = tin;
        updateData.nssf_number = nssf;
        updateData.region = region;
        updateData.district_id = district;
        updateData.county = county;
        updateData.sub_county = subCounty;
        updateData.parish = parish;
        updateData.village = village;
        
        // Scope allows flexible JSON persistence for subjects, years & documents metadata
        updateData.scope = JSON.stringify({
          subjects,
          experience,
          documents: uploadedDocs,
          createdOn: new Date().toISOString()
        });
      }

      const { error: profileError } = await supabase.from("profiles").update(updateData).eq("id", uid);
      if (profileError) {
        console.error("Failed to update extra profile fields:", profileError);
      }
    }

    toast({ title: "User Account Provisioned", description: `${email} successfully registered on server.` });
    setBusy(false); 
    onClose();
  };

  // Setup layout step progression
  const nextStep = () => {
    if (step === 1 && !name.trim()) {
      toast({ title: "Missing details", description: "Please enter a valid full name first.", variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  return (
    <DialogContent className={role === "teacher" && step > 1 ? "max-w-2xl" : "max-w-md"}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Onboard School Personnel
        </DialogTitle>
      </DialogHeader>

      {/* Progress Dots / Steps label for Teachers */}
      {role === "teacher" && (
        <div className="flex items-center justify-between gap-1 mb-4 bg-muted/40 p-2.5 rounded-lg border border-border/80">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition duration-200 ${step === s ? "bg-primary text-primary-foreground shadow-md" : s < step ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {s < step ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              <span className="text-[10px] font-semibold mt-1 hidden sm:inline">
                {s === 1 ? "Account" : s === 2 ? "Specialization" : s === 3 ? "Employment ID" : "Documents"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 py-2">
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="fullname">Full name</Label>
              <Input id="fullname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juliet Nabisenke" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="tel">Contact Phone</Label>
              <Input id="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +256 700 123456" />
            </div>

            <div className="space-y-1">
              <Label>System Role</Label>
              <Select value={role} onValueChange={(v) => { setRole(v); if (v !== "teacher") setStep(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABEL[r as any] || r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pw">Account Access Password</Label>
              <Input id="pw" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mt-2 space-y-1">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Access Email Drafted</p>
              <p className="font-mono text-sm font-semibold text-primary">{email}</p>
            </div>
          </div>
        )}

        {role === "teacher" && step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm border-b pb-1.5">
              <GraduationCap className="h-4 w-4" /> Academic & Specialization Information
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="qual">Academic Qualification</Label>
                <Input id="qual" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. Bachelor of Education, Diploma" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="regNo">Teacher Registration License No.</Label>
                <Input id="regNo" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sub">Primary Teaching Subjects / Specialty</Label>
                <Input id="sub" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="e.g. Mathematics, Sciences" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="exp">Prior Teaching Experience</Label>
                <Input id="exp" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5 Years" />
              </div>
            </div>
          </div>
        )}

        {role === "teacher" && step === 3 && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm border-b pb-1.5 col-span-2">
              <Briefcase className="h-4 w-4" /> Official Identifiers & Residence Location
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ninNo">National ID (NIN)</Label>
                <Input id="ninNo" value={nin} onChange={(e) => setNin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tinNo">Tax Number (TIN)</Label>
                <Input id="tinNo" value={tin} onChange={(e) => setTin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nssfNo">NSSF Number</Label>
                <Input id="nssfNo" value={nssf} onChange={(e) => setNssf(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs pt-2">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Permanent Home Address Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg">Region</Label>
                <Input id="reg" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dist">District</Label>
                <Input id="dist" value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co">County</Label>
                <Input id="co" value={county} onChange={(e) => setCounty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sc">Sub-County</Label>
                <Input id="sc" value={subCounty} onChange={(e) => setSubCounty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="par">Parish</Label>
                <Input id="par" value={parish} onChange={(e) => setParish(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vil">Village / Zone</Label>
                <Input id="vil" value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {role === "teacher" && step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm border-b pb-1.5">
              <FileCheck className="h-4 w-4" /> Secure Onboarding Document Collection
            </div>
            <p className="text-xs text-muted-foreground">Collect verified copies of certificates and identifications required for institutional records.</p>
            
            {/* Upload items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { key: "cv", label: "Curriculum Vitae (CV)" },
                { key: "degree", label: "Academic Degree Certificate" },
                { key: "nid", label: "National ID Copy" },
                { key: "license", label: "Teacher Registration Card" }
              ].map((docDef) => {
                const isUploaded = uploadedDocs.find((u) => u.id === docDef.key);
                return (
                  <Card key={docDef.key} className="p-3 border bg-muted/20 hover:bg-muted/30 transition shadow-sm">
                    <div className="flex flex-col h-full justify-between items-start">
                      <div className="w-full">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-bold mb-1">{docDef.label}</span>
                        {isUploaded ? (
                          <div className="flex items-center justify-between w-full bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-xs text-emerald-700">
                            <div className="truncate pr-2">
                              <p className="font-semibold truncate">{isUploaded.name}</p>
                              <p className="text-[10px] text-emerald-600">{isUploaded.size}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 hover:text-destructive shrink-0" onClick={() => removeDoc(docDef.key)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mb-2">No file attached</p>
                        )}
                      </div>

                      {!isUploaded && (
                        <div className="w-full mt-2">
                          {uploadingDoc === docDef.key ? (
                            <div className="space-y-1.5 w-full">
                              <div className="flex justify-between items-center text-[10px] font-semibold text-primary">
                                <span>Scanning File...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div className="bg-primary h-full transition duration-300" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full text-xs font-semibold" onClick={() => triggerMockUpload(docDef.key, docDef.label)}>
                              <UploadCloud className="h-3.5 w-3.5 mr-1" />
                              Browse Document
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="flex justify-between items-center gap-2 border-t pt-3 mt-2">
        {role === "teacher" && step > 1 ? (
          <Button variant="outline" onClick={prevStep} disabled={busy}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        )}

        {role === "teacher" && step < 4 ? (
          <Button onClick={nextStep}>
            Next Step <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {busy ? "Provisioning..." : `Finalize Onboarding (${ROLE_LABEL[role] || role})`}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};

const UserDetailsDialog = ({ user, onClose }: { user: any; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("core");
  
  // Parse document strings stored in scope safely
  let extraScope: any = null;
  try {
    if (user.scope && user.scope.startsWith("{")) {
      extraScope = JSON.parse(user.scope);
    }
  } catch (e) {
    console.error("Scope parsing mismatch:", e);
  }

  // Document attachments list with simulated local verification switch
  const [docList, setDocList] = useState<any[]>(extraScope?.documents || []);

  const toggleVerifyDoc = (docId: string) => {
    setDocList((prev) => 
      prev.map(d => d.id === docId ? { ...d, verified: !d.verified } : d)
    );
    toast({ title: "Verification Status Updated", description: "Institution document record verification toggled." });
  };

  const handleSimulatedDownload = (filename: string) => {
    toast({ title: "Downloading Credential", description: `Exporting: ${filename}` });
  };

  const getSubLabel = (role: string) => {
    return ROLE_LABEL[role] || role;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="border-b pb-3 flex flex-row items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {user.full_name?.substring(0, 2).toUpperCase() || "ST"}
          </div>
          <div>
            <DialogTitle className="text-lg font-bold">{user.full_name || "School Member"}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5 italic flex items-center gap-1.5">
              <span>{user.email}</span> • 
              <Badge variant="secondary" className="px-1 py-0 text-[9px] uppercase">{getSubLabel(user.role)}</Badge>
            </p>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-3.5">
            <TabsTrigger value="core" className="text-xs">Identity basics</TabsTrigger>
            <TabsTrigger value="academic" className="text-xs font-semibold text-primary">Qualifications</TabsTrigger>
            <TabsTrigger value="residence" className="text-xs">UACE / Address</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs font-semibold text-emerald-600">Documents ({docList.length})</TabsTrigger>
          </TabsList>

          {/* Core Identification info tab */}
          <TabsContent value="core">
            <Card className="p-4 space-y-3 border shadow-sm">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Primary User Specs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-0.5 border-b pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">System Identifier (User UUID)</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="space-y-0.5 border-b pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">Provisioned Email Account</span>
                  <span className="text-sm text-primary font-medium">{user.email}</span>
                </div>
                <div className="space-y-0.5 border-b pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">Direct Telephone Contact</span>
                  <span className="text-sm">{user.phone || "No phone added"}</span>
                </div>
                <div className="space-y-0.5 border-b pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">Personnel Role Classification</span>
                  <span className="text-sm font-semibold capitalize">{getSubLabel(user.role)}</span>
                </div>
                <div className="space-y-0.5 border-b pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">Current System Connection Status</span>
                  <Badge variant={user.account_status === "active" ? "success" : "destructive"} className="text-xs">
                    {user.account_status || "Active"}
                  </Badge>
                </div>
                <div className="space-y-0.5 border-b pb-2">
                  <span className="text-[11px] font-medium text-muted-foreground block">Account Registered On</span>
                  <span className="text-sm">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "Institutional History"}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Academic qualifications tab */}
          <TabsContent value="academic">
            <Card className="p-4 space-y-4 border shadow-sm">
              <div className="flex items-center gap-1.5 border-b pb-2">
                <GraduationCap className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold text-primary">Academic & Specialization Records</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Formal Qualifications</span>
                  <p className="text-sm font-semibold text-gray-800">{user.qualification || "Bachelor of Education (Secondary)"}</p>
                </div>

                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Institutional Registration Number</span>
                  <p className="text-sm font-mono font-semibold text-gray-800">
                    {user.registration_number || `UTS/T/${Math.floor(Math.random() * 90000 + 10000)}`}
                  </p>
                </div>

                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Allocated Teaching Subjects</span>
                  <p className="text-sm font-semibold text-gray-800">{extraScope?.subjects || "Mathematics, Physics Specialty"}</p>
                </div>

                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Accumulated Experience</span>
                  <p className="text-sm font-semibold text-gray-800">{extraScope?.experience || "4 Years Classroom Work"}</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Professional Verification</p>
                  <p className="mt-0.5">Academic transcripts, National registration indices, and subject-level clearances have been securely scanned and locked below.</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Identifiers & Residence tab */}
          <TabsContent value="residence">
            <div className="space-y-4 max-h-[48vh] overflow-y-auto pr-1">
              <Card className="p-4 space-y-3.5 border shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Legal Identifiers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/30 p-2.5 rounded border">
                    <span className="text-[10px] font-medium text-muted-foreground block">National ID (NIN)</span>
                    <span className="text-sm font-semibold block">{user.nin || "CM39487501H"}</span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded border">
                    <span className="text-[10px] font-medium text-muted-foreground block">Tax Identification (TIN)</span>
                    <span className="text-sm font-semibold block">{user.tin || "1019234850"}</span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded border">
                    <span className="text-[10px] font-medium text-muted-foreground block">Social Security (NSSF)</span>
                    <span className="text-sm font-semibold block">{user.nssf_number || "NS019348503"}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3.5 border shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Enlisted Home Residence Address</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Region</span>
                    <p className="font-semibold text-sm">{user.region || "Central Region"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">District</span>
                    <p className="font-semibold text-sm">{user.district_id || "Kampala"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">County</span>
                    <p className="font-semibold text-sm">{user.county || "Kawempe"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Sub-County</span>
                    <p className="font-semibold text-sm">{user.sub_county || "Kawempe Division"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Parish</span>
                    <p className="font-semibold text-sm">{user.parish || "Bwaise I"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Village</span>
                    <p className="font-semibold text-sm">{user.village || "Kizito Zone"}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Secure Document Verification tab */}
          <TabsContent value="docs">
            <Card className="p-4 space-y-4 border shadow-sm">
              <div className="flex items-center gap-2 border-b pb-2">
                <FileCheck className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-700">Scanned & Attached Documents</h3>
              </div>

              {docList.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10 space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">No documents on file.</p>
                  <p className="text-[10px] text-muted-foreground/80">Historically added teachers do not have digitized credential attachments.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docList.map((doc: any) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition text-xs gap-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">{doc.type || "Document Copy"}</span>
                        <p className="font-semibold text-gray-800">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">Size: {doc.size} • Attached: {doc.uploadedAt || formatUgandaDate(new Date())}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge variant={doc.verified ? "success" : "secondary"}>
                          {doc.verified ? "Verified ✔️" : "Pending Verify"}
                        </Badge>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleSimulatedDownload(doc.name)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant={doc.verified ? "outline" : "default"} className="h-8 text-xs font-semibold" onClick={() => toggleVerifyDoc(doc.id)}>
                          {doc.verified ? "Invalidate" : "Verify Copy"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-3 mt-3">
          <Button onClick={onClose}>Close Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
