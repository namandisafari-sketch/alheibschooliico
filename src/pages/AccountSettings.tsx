import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, User, Mail, Bell, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SignatureManager } from "@/components/signature/SignatureManager";

const AccountSettings = () => {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifEmail, setNotifEmail] = useState("");
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifLoaded, setNotifLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id || notifLoaded) return;
    supabase.from("profiles").select("notification_email").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.notification_email) setNotifEmail(data.notification_email);
        setNotifLoaded(true);
      });
  }, [user?.id]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifEmail = async () => {
    if (!user?.id) return;
    setSavingNotif(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notification_email: notifEmail.trim() || null })
      .eq("id", user.id);
    setSavingNotif(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notification email updated. System emails will be sent to this address.");
  };

  return (
    <DashboardLayout title="Account Settings" subtitle="Manage your profile and security credentials">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your identity details are managed by the school administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Full Name</Label>
                <div className="p-2 rounded-md bg-muted font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {user?.user_metadata?.full_name || "N/A"}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Login Email</Label>
                <div className="p-2 rounded-md bg-muted font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Email and name changes are locked. If your details are incorrect, please
                submit a request to the <strong>Administrator</strong> for approval.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Notification Email
            </CardTitle>
            <CardDescription>
              System notifications, approvals, and alerts will be sent to this email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-md">
              <Label htmlFor="notifEmail">Secondary Email (for system mails)</Label>
              <div className="flex gap-2">
                <Input
                  id="notifEmail"
                  type="email"
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                  placeholder={user?.email || "Enter notification email"}
                />
                <Button onClick={handleSaveNotifEmail} disabled={savingNotif}>
                  {savingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Leave blank to use your login email for notifications.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Security Credentials
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">
                {role?.[0] || "U"}
              </div>
              <div>
                <p className="font-semibold capitalize">{role} Workspace</p>
                <p className="text-sm text-muted-foreground">
                  You are currently logged into the {role} dashboard with specific tools for your duties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <SignatureManager />
      </div>
    </DashboardLayout>
  );
};

export default AccountSettings;
