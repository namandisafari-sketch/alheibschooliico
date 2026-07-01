import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { homeFor } from "@/lib/roleConfig";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, Eye, EyeOff, ExternalLink, User, Phone, CheckCircle, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABEL } from "@/lib/roleConfig";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type RegisterStep = "name" | "details" | "confirm";

interface EligibleMatch {
  employeeId: string;
  fullName: string;
  roleSuggestion: string;
}

const REGISTRATION_ROLES = [
  "teacher", "staff", "parent", "head_of_internal", "dos_theology", "theology_teacher", "accountant",
  "secretary", "security", "gateman", "storekeeper", "matron", "cook", "nurse",
] as const;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealEmail, setAppealEmail] = useState("");
  const [appealPassword, setAppealPassword] = useState("");
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Registration state
  const [registerStep, setRegisterStep] = useState<RegisterStep>("name");
  const [registerName, setRegisterName] = useState("");
  const [registerMatches, setRegisterMatches] = useState<EligibleMatch[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<EligibleMatch | null>(null);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("");
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);

  const { user, role, signIn, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const blocked = params.get("blocked") === "1";
  const blockReason = params.get("reason") || "Your account has been disconnected by the director.";

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("alheib_remembered_email");
    if (savedEmail) {
      loginForm.setValue("email", savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user && !isLoading && !appealSubmitting) {
      if (role) {
        navigate(homeFor(role), { replace: true });
      }
    }
  }, [user, role, navigate, isLoading, appealSubmitting]);

  const handleLogin = async (values: LoginFormValues) => {
    sessionStorage.setItem("alheib_persist_session", rememberMe ? "true" : "false");
    setIsLoading(true);
    const result: any = await signIn(values.email, values.password);
    setIsLoading(false);

    if (result?.status === "disconnected") {
      navigate(`/auth?blocked=1&reason=${encodeURIComponent(result.reason || "Account disconnected")}`, { replace: true });
      return;
    }
    if (result?.error) {
      toast({
        title: "Login Failed",
        description: result.error.message === "Invalid login credentials"
          ? "Invalid email or password. If you forgot your password, use the 'Forgot Password' link below to reset it."
          : result.error.message,
        variant: "destructive",
      });
      return;
    }

    if (rememberMe) {
      localStorage.setItem("alheib_remembered_email", values.email);
    } else {
      localStorage.removeItem("alheib_remembered_email");
    }

    if (blocked) {
      navigate("/auth", { replace: true });
    }
  };

  useEffect(() => {
    if (registerMatches.length === 1) {
      setSelectedMatch(registerMatches[0]);
      if (registerMatches[0].roleSuggestion) setRegisterRole(registerMatches[0].roleSuggestion);
    }
  }, [registerMatches]);

  const checkEligibility = async () => {
    if (!registerName.trim()) {
      toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: registerName.trim() }),
      });
      const data = await res.json();
      if (!data.eligible || !data.suggestions?.length) {
        toast({ title: "Not found", description: data.message || "No matching record found. Contact administration.", variant: "destructive" });
        return;
      }
      setRegisterMatches(data.suggestions);
      setRegisterStep("details");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  };

  const submitRegistration = async () => {
    if (!selectedMatch || !registerEmail || !registerPassword || !registerRole) {
      toast({ title: "Missing info", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setRegisterSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedMatch.employeeId,
          email: registerEmail,
          password: registerPassword,
          fullName: selectedMatch.fullName,
          phone: registerPhone || null,
          role: registerRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setRegisterDone(true);
      setRegisterStep("confirm");
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const resetRegistration = () => {
    setRegisterStep("name");
    setRegisterName("");
    setRegisterMatches([]);
    setRegisterLoading(false);
    setSelectedMatch(null);
    setRegisterEmail("");
    setRegisterPhone("");
    setRegisterPassword("");
    setRegisterRole("");
    setRegisterSubmitting(false);
    setRegisterDone(false);
  };

  const submitAppeal = async () => {
    if (!appealEmail || !appealPassword || appealReason.trim().length < 10) {
      toast({ title: "Missing info", description: "Email, password and a reason (10+ chars) are required.", variant: "destructive" });
      return;
    }
    setAppealSubmitting(true);
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: appealEmail,
        password: appealPassword,
      });
      if (signInErr || !signInData?.user) {
        throw new Error(signInErr?.message || "Invalid credentials");
      }
      const uid = signInData.user.id;
      const { error: insertErr } = await supabase.from("account_appeals").insert({
        user_id: uid,
        message: `${blockReason}\n\nAppeal:\n${appealReason.trim()}`,
        status: "pending",
      } as any);
      await supabase.auth.signOut();
      if (insertErr) throw insertErr;
      toast({ title: "Appeal submitted", description: "The director will review your appeal shortly." });
      setAppealOpen(false);
      setAppealReason("");
      setAppealPassword("");
    } catch (e: any) {
      toast({ title: "Could not submit appeal", description: e.message, variant: "destructive" });
    } finally {
      setAppealSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 p-2">
              <img src="/icon-512x512.png" alt="School Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Alheib Mixed Day & Boarding School
          </h1>
          <p className="text-muted-foreground text-lg">
            School Management System - Uganda New Curriculum
          </p>
          <div className="mt-12 space-y-4 text-left">
            <div className="rounded-lg bg-background/50 p-4 border-l-4 border-primary">
              <h3 className="font-semibold">For Parents</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your child's attendance, grades, and communicate with teachers
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-4 border-l-4 border-blue-500">
              <h3 className="font-semibold">For Teachers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage classes, take attendance, and record learner progress
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-4 border-l-4 border-purple-500">
              <h3 className="font-semibold">For Administration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Full access to manage all school operations and staff
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 p-2">
              <img src="/icon-512x512.png" alt="School Logo" className="h-full w-full object-contain" />
            </div>
          </div>

          {blocked && (
            <div className="mb-6 rounded-xl border-2 border-destructive bg-destructive/10 p-5 text-sm">
              <p className="font-bold text-destructive uppercase tracking-wider text-xs mb-2">Account Disconnected</p>
              <p className="text-foreground mb-3">{blockReason}</p>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="destructive" onClick={() => { setAppealEmail(""); setAppealOpen(true); }}>
                  Submit an Appeal
                </Button>
                <p className="text-xs text-muted-foreground">
                  Or email{" "}
                  <a className="underline font-semibold" href={`mailto:director@alheib.test?subject=Account Appeal&body=${encodeURIComponent(blockReason)}`}>
                    director@alheib.test
                  </a>.
                </p>
              </div>
            </div>
          )}

          <Dialog open={appealOpen} onOpenChange={setAppealOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Appeal Account Block</DialogTitle>
                <DialogDescription>
                  Confirm your credentials and explain why your account should be reinstated.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input type="email" placeholder="Your email" value={appealEmail} onChange={(e) => setAppealEmail(e.target.value)} />
                <Input type="password" placeholder="Your password" value={appealPassword} onChange={(e) => setAppealPassword(e.target.value)} />
                <Textarea placeholder="Explain your appeal (minimum 10 characters)..." rows={5} value={appealReason} onChange={(e) => setAppealReason(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAppealOpen(false)} disabled={appealSubmitting}>Cancel</Button>
                <Button onClick={submitAppeal} disabled={appealSubmitting}>
                  {appealSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Appeal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden mb-8">
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setMode("login"); resetRegistration(); }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("register")}
            >
              Create Account
            </button>
          </div>

          {/* ===== LOGIN FORM ===== */}
          {mode === "login" && (
            <>
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-foreground">Welcome Back</h2>
                <p className="text-muted-foreground mt-2">Sign in to access the school management system</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" {...field} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                      <label htmlFor="remember-me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        Remember me
                      </label>
                    </div>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(loginForm.getValues("email")); }} className="text-sm text-primary hover:underline font-medium">
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </Form>
            </>
          )}

          {/* ===== REGISTRATION FORM ===== */}
          {mode === "register" && (
            <>
              {registerStep === "name" && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl font-bold text-foreground">Create Account</h2>
                    <p className="text-muted-foreground mt-2">
                      Enter your full name to check eligibility
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") checkEligibility(); }}
                      />
                    </div>
                    <Button className="w-full" onClick={checkEligibility} disabled={registerLoading}>
                      {registerLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Check Eligibility
                    </Button>
                  </div>
                </>
              )}

              {registerStep === "details" && !registerDone && (
                <>
                  <div className="mb-6">
                    <button onClick={() => setRegisterStep("name")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                    <h2 className="font-display text-2xl font-bold text-foreground">Complete Registration</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Select your record and fill in your details</p>
                  </div>

                  <div className="space-y-4">
                    {registerMatches.length > 1 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select your name</label>
                        {registerMatches.map((m) => (
                          <div
                            key={m.employeeId}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedMatch?.employeeId === m.employeeId ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                            onClick={() => {
                              setSelectedMatch(m);
                              setRegisterRole(m.roleSuggestion || "");
                            }}
                          >
                            <p className="font-medium">{m.fullName}</p>
                            {m.roleSuggestion && <p className="text-xs text-muted-foreground">{m.roleSuggestion}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {(registerMatches.length === 1) && (
                      <div className="p-3 rounded-lg border border-primary bg-primary/5">
                        <p className="font-medium">{registerMatches[0].fullName}</p>
                        {registerMatches[0].roleSuggestion && (
                          <p className="text-xs text-muted-foreground">{registerMatches[0].roleSuggestion}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="email" placeholder="your@email.com" className="pl-10" value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="tel" placeholder="+256..." className="pl-10" value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="password" placeholder="Minimum 6 characters" className="pl-10 pr-10" value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Role *</label>
                      <Select value={registerRole} onValueChange={setRegisterRole}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGISTRATION_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r] || r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full" onClick={submitRegistration} disabled={registerSubmitting}>
                      {registerSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </div>
                </>
              )}

              {registerStep === "confirm" && registerDone && (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Account Created!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your account has been created successfully. We've sent confirmation to your email, WhatsApp, and SMS.
                    Check your messages and sign in using your email and password.
                  </p>
                  <Button onClick={() => { setMode("login"); resetRegistration(); }}>
                    Go to Sign In
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Forgot Password Dialog */}
          <Dialog open={showForgot} onOpenChange={setShowForgot}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you a password reset link.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {forgotSent && (
                  <p className="text-sm text-green-600 font-medium">
                    If an account exists with that email, a reset link has been sent. Check your inbox.
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setShowForgot(false); setForgotSent(false); }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!forgotEmail) return;
                      setForgotLoading(true);
                      await forgotPassword(forgotEmail);
                      setForgotLoading(false);
                      setForgotSent(true);
                    }}
                    disabled={forgotLoading || !forgotEmail}
                  >
                    {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {mode === "register" && registerStep === "name" && (
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>First time?</strong><br />
                Enter your full name as registered with the school administration.
                If your name is not found, please contact the school office.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center flex items-center justify-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 inline" />
              This system will soon be migrating to <strong>sised.sc.ug</strong>.
              The current site will redirect automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
