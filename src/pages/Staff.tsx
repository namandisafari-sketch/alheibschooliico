import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  MoreHorizontal,
  Loader2,
  Users,
  Shield,
  Car,
  UtensilsCrossed,
  Briefcase,
} from "lucide-react";
import { useAllStaff, STAFF_ROLES, StaffRole } from "@/hooks/useStaff";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { StaffActions } from "@/components/staff/StaffActions";
import { StaffPerformanceTab } from "@/components/staff/StaffPerformanceTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, List } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-4 w-4" />,
  driver: <Car className="h-4 w-4" />,
  cook: <UtensilsCrossed className="h-4 w-4" />,
  accountant: <Briefcase className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-600",
  teacher: "bg-blue-500/10 text-blue-600",
  support: "bg-green-500/10 text-green-600",
  driver: "bg-orange-500/10 text-orange-600",
  security: "bg-red-500/10 text-red-600",
  cook: "bg-yellow-500/10 text-yellow-600",
  cleaner: "bg-cyan-500/10 text-cyan-600",
  accountant: "bg-indigo-500/10 text-indigo-600",
};

const Staff = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { data: staff = [], isLoading, error } = useAllStaff();

  // Filter out teachers (they have their own page)
  const nonTeacherStaff = staff.filter((s) => s.role !== "teacher");

  const filteredStaff = nonTeacherStaff.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.includes(searchQuery);

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string | null) => {
    const found = STAFF_ROLES.find((r) => r.value === role);
    return found?.label || role || "Staff";
  };

  // Stats
  const stats = STAFF_ROLES.filter((r) => r.value !== "teacher").map((role) => ({
    ...role,
    count: nonTeacherStaff.filter((s) => s.role === role.value).length,
  }));

  return (
    <DashboardLayout title="Staff & Workers" subtitle="Manage non-teaching staff and workers">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {stats.map((stat) => (
          <div
            key={stat.value}
            className="rounded-lg border border-border bg-card p-2 sm:p-4 text-center"
          >
            <div className={`mx-auto mb-1 sm:mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${roleColors[stat.value] || "bg-muted"}`}>
              {roleIcons[stat.value] || <Users className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
            <p className="text-lg sm:text-2xl font-bold">{stat.count}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
          </div>
        ))}
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2"><List className="h-4 w-4" /> Staff List</TabsTrigger>
          <TabsTrigger value="performance" className="gap-2"><BarChart3 className="h-4 w-4" /> Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-4 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {STAFF_ROLES.filter((r) => r.value !== "teacher").map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AddStaffDialog>
              <Button size="sm" className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </AddStaffDialog>
          </div>

          {/* Staff Grid */}
          <div className="animate-slide-up">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                Failed to load staff. Please try again.
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No staff members found</p>
                <p className="text-sm">Add your first staff member to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStaff.map((member) => (
                  <div 
                    key={member.id} 
                    className="group relative rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${roleColors[member.role || ""] || "bg-primary/10 text-primary"}`}>
                          {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate pr-6">{member.full_name}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={cn("p-1 rounded-full", roleColors[member.role || ""])}>
                              {roleIcons[member.role || ""] || <Users className="h-3 w-3" />}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{getRoleLabel(member.role)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <StaffActions member={member} />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {member.qualification && (
                        <p className="text-xs text-muted-foreground line-clamp-1 italic">
                          {member.qualification}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{member.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{member.phone || "No phone"}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Joined {member.created_at ? format(new Date(member.created_at), "MMM yyyy") : "—"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!member.phone}>
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!member.email}>
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing {filteredStaff.length} of {nonTeacherStaff.length} staff
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <StaffPerformanceTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Staff;
