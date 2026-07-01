// @ts-nocheck
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  UserPlus,
  Search,
  Shield,
  GraduationCap,
  Users,
  HardHat,
  Loader2,
  MoreHorizontal,
  Link as LinkIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLearners } from "@/hooks/useLearners";
import { UserActions } from "@/components/users/UserActions";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Link as LinkIcon } from "lucide-react";

type AppRole = "admin" | "teacher" | "parent" | "staff" | "security" | "accountant" | "head_teacher";

const roleConfig: Record<AppRole, { icon: typeof Shield; label: string; color: string }> = {
  admin: { icon: Shield, label: "Administrator", color: "bg-purple-500/10 text-purple-600" },
  teacher: { icon: GraduationCap, label: "Teacher", color: "bg-blue-500/10 text-blue-600" },
  parent: { icon: Users, label: "Parent", color: "bg-green-500/10 text-green-600" },
  staff: { icon: HardHat, label: "Support Staff", color: "bg-orange-500/10 text-orange-600" },
  security: { icon: Shield, label: "Security", color: "bg-slate-500/10 text-slate-600" },
  accountant: { icon: Shield, label: "Accountant", color: "bg-emerald-500/10 text-emerald-600" },
  head_teacher: { icon: Shield, label: "Head Teacher", color: "bg-red-500/10 text-red-600" },
};

const createUserSchema = z.object({
  fullName: z.string().min(2, "Name required").max(100),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone required").max(20),
  password: z.string().min(6, "Min 6 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "teacher", "staff", "security", "accountant", "head_teacher"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const UserManagement = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profilesError) throw profilesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      return profiles.map((profile) => ({
        ...profile,
        role: roleMap.get(profile.id) as AppRole | undefined,
      }));
    },
  });

  // Real-time updates
  useRealtime("profiles", [["all-users"]]);
  useRealtime("user_roles", [["all-users"]]);
  useRealtime("parent_learner_links", [["parent-links"]]);

  const { data: learners = [] } = useLearners();

  // Fetch parent-learner links
  const { data: parentLinks = [] } = useQuery({
    queryKey: ["parent-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_learner_links")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "full_name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs",
            row.original.role ? roleConfig[row.original.role as AppRole]?.color : "bg-muted"
          )}>
            {((row.original.full_name || "").split(" ").map((n: string) => n[0] || "").join("").slice(0, 2)) || "?"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate">{row.original.full_name}</h3>
            <p className="text-[10px] text-muted-foreground truncate italic">{row.original.email}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: "role",
      header: "Access Role",
      cell: ({ row }) => {
        const config = row.original.role ? roleConfig[row.original.role as AppRole] : null;
        return config ? (
          <Badge className={cn("text-[9px] h-5 uppercase tracking-widest font-black", config.color)}>
            {config.label}
          </Badge>
        ) : null;
      }
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.phone || "—"}</span>
    },
    {
      id: "links",
      header: "Learner Links",
      cell: ({ row }) => {
        if (row.original.role !== "parent") return null;
        const linked = getLinkedLearners(row.original.id);
        return (
          <div className="flex flex-wrap gap-1">
            {linked.map((name, i) => (
              <Badge key={i} variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 bg-primary/5 text-primary">
                {name}
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded-full"
              onClick={() => {
                setSelectedParentId(row.original.id);
                setLinkDialogOpen(true);
              }}
            >
              <LinkIcon className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <UserActions user={row.original} onEdit={() => setEditingUser(row.original)} />
        </div>
      )
    }
  ];

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "1234school.com",
      role: "teacher",
    },
  });

  // Create staff/admin user mutation (auto-confirmed via server route)
  const createUserMutation = useMutation({
    mutationFn: async (values: CreateUserFormValues) => {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phone: values.phone,
          role: values.role,
        }),
      });

      let result: any;
      const text = await response.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: text || "Unexpected server response" };
      }

      if (!response.ok) {
        throw new Error(result.error || result.message || `Server error: ${response.status}`);
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User account created successfully" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      form.reset();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, fullName, email, phone, role, password }: any) => {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email, phone })
        .eq("id", id);
      if (profileError) throw profileError;

      // Delete any OTHER roles for this user first
      const { error: roleDeleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", id)
        .neq("role", role);
      if (roleDeleteError) throw roleDeleteError;

      // Now upsert the selected role
      const { error: roleInsertError } = await supabase
        .from("user_roles")
        .upsert({ user_id: id, role }, { onConflict: "user_id,role" });
      if (roleInsertError) throw roleInsertError;

      if (password) {
        const updateResponse = await fetch("/api/users/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: id, password }),
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
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User profile updated." });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const EditUserDialog = ({ user, onClose, mutation }: { user: any; onClose: () => void; mutation: any }) => {
    const editFormSchema = z.object({
      fullName: z.string().min(2, "Name required").max(100),
      email: z.string().email("Valid email required").optional().or(z.literal("")),
      phone: z.string().min(7, "Phone required").max(20),
      role: z.enum(["admin", "teacher", "staff", "security", "accountant", "head_teacher"]),
      password: z.string().optional().or(z.literal("")),
    });

    type EditUserFormValues = z.infer<typeof editFormSchema>;

    const form = useForm<EditUserFormValues>({
      resolver: zodResolver(editFormSchema),
      defaultValues: {
        fullName: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "teacher",
        password: "",
      },
    });

    useEffect(() => {
      if (user) {
        form.reset({
          fullName: user.full_name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "teacher",
          password: "",
        });
      }
    }, [user]);

    const onSubmit = (values: EditUserFormValues) => {
      mutation.mutate({ id: user.id, ...values });
    };

    return (
      <Dialog open={!!user} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Information</DialogTitle>
            <DialogDescription>Review and update the selected user account in detail.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3 rounded-xl border border-border p-4 bg-background/80">
                <p className="text-sm font-semibold">Basic profile</p>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="user@alheib.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+256 700 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 bg-background/80">
                <p className="text-sm font-semibold">Account details</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Role</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="accountant">Accountant</SelectItem>
                              <SelectItem value="head_teacher">Head Teacher</SelectItem>
                              <SelectItem value="security">Security Guard</SelectItem>
                              <SelectItem value="staff">Support Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" value="********" disabled />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Password is masked for security. Enter a new password below to change it.</p>
                  </FormItem>
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 bg-background/80">
                <p className="text-sm font-semibold">Review</p>
                <p className="text-sm text-muted-foreground">Make sure the user details are correct before saving. Role changes will update access levels immediately.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  // Link parent to learner mutation
  const linkParentMutation = useMutation({
    mutationFn: async ({ parentId, learnerId }: { parentId: string; learnerId: string }) => {
      const { error } = await supabase.from("parent_learner_links").insert({
        parent_user_id: parentId,
        learner_id: learnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Parent linked to learner" });
      queryClient.invalidateQueries({ queryKey: ["parent-links"] });
      setLinkDialogOpen(false);
      setSelectedParentId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link parent",
        variant: "destructive",
      });
    },
  });

  const getLinkedLearners = (parentId: string) => {
    const links = parentLinks.filter((l) => l.parent_user_id === parentId);
    return links.map((link) => {
      const learner = learners.find((l) => l.id === link.learner_id);
      return learner?.full_name || "Unknown";
    });
  };

  const onCreateSubmit = (values: CreateUserFormValues) => {
    // Standardize email format: {names@alheib.(role)}
    // Simplified: "Hanad Mohammed" -> "hanadmohammed@alheib.accountant"
    const names = values.fullName.trim().toLowerCase().replace(/\s+/g, "");
    const domain = `alheib.${values.role}`;
    const generatedEmail = `${names}@${domain}`;
    
    createUserMutation.mutate({
      ...values,
      email: generatedEmail,
      password: values.password || "1234school.com",
    });
  };

  return (
    <DashboardLayout title="User Management" subtitle="Manage system users and access roles">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(["admin", "teacher", "staff", "parent"] as AppRole[]).map((role) => {
          const config = roleConfig[role];
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                  <config.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}s</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Staff Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Staff/Admin Account</DialogTitle>
              <DialogDescription>
                Create a new account for teachers, staff, or administrators
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Credentials</p>
                  <p className="text-sm">Email will be: <span className="font-mono text-primary italic">names@alheib.role</span></p>
                  <p className="text-sm">Default Password: <span className="font-mono font-bold">1234school.com</span></p>
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+256 700 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Password (Optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Leave blank for 1234school.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="head_teacher">Head Teacher</SelectItem>
                          <SelectItem value="security">Security Guard</SelectItem>
                          <SelectItem value="staff">Other Support Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users DataTable */}
      <div className="mt-8 border-none shadow-xl bg-slate-50/50 rounded-xl overflow-hidden p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={users} 
            searchKey="full_name"
            searchPlaceholder="Search users by name..."
          />
        )}
      </div>

      {/* Link Parent Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Parent to Learner</DialogTitle>
            <DialogDescription>
              Select a learner to link to this parent account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              onValueChange={(learnerId) => {
                if (selectedParentId) {
                  linkParentMutation.mutate({ parentId: selectedParentId, learnerId });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select learner" />
              </SelectTrigger>
              <SelectContent>
                {learners.map((learner) => (
                  <SelectItem key={learner.id} value={learner.id}>
                    {learner.full_name} ({learner.class_name || "Unassigned"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          mutation={updateUserMutation}
        />
      )}
    </DashboardLayout>
  );
};

export default UserManagement;
