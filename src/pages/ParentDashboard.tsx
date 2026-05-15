import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  GraduationCap,
  LogOut,
  MessageSquare,
  User,
  Users,
  X,
  Loader2,
} from "lucide-react";

const ParentDashboard = () => {
  const { user, signOut } = useAuth();

  // Fetch parent's linked learners
  const { data: linkedLearners = [], isLoading } = useQuery({
    queryKey: ["parent-learners", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: links, error: linksError } = await supabase
        .from("parent_learner_links")
        .select("learner_id")
        .eq("parent_user_id", user.id);

      if (linksError || !links?.length) return [];

      const learnerIds = links.map((l) => l.learner_id);

      const { data: learners, error: learnersError } = await supabase
        .from("learners")
        .select("*")
        .in("id", learnerIds);

      if (learnersError) return [];

      // Fetch classes for learners
      const { data: classes } = await supabase.from("classes").select("id, name");
      const classMap = new Map(classes?.map((c) => [c.id, c.name]) || []);

      // Fetch recent attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .in("learner_id", learnerIds)
        .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .lte("date", today);

      return learners.map((learner) => ({
        ...learner,
        class_name: learner.class_id ? classMap.get(learner.class_id) : null,
        recent_attendance: attendance?.filter((a) => a.learner_id === learner.id) || [],
      }));
    },
    enabled: !!user?.id,
  });

  const getAttendanceStats = (attendance: any[]) => {
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const late = attendance.filter((a) => a.status === "late").length;
    return { present, absent, late, total: attendance.length };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold">Alheb Islamic</h1>
              <p className="text-xs text-muted-foreground">Parent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
              <Badge variant="secondary">Parent</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold">Welcome Back!</h2>
          <p className="text-muted-foreground">
            Track your children's progress and stay connected with the school
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : linkedLearners.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No Children Linked</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your account hasn't been linked to any learners yet. Please contact the school
              administration to link your children to your account.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Children Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {linkedLearners.map((learner: any) => {
                const stats = getAttendanceStats(learner.recent_attendance);
                return (
                  <div
                    key={learner.id}
                    className="rounded-xl border border-border bg-card p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary">
                        {learner.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-semibold">
                          {learner.full_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{learner.class_name || "Unassigned"}</Badge>
                          <Badge variant="secondary" className="capitalize">
                            {learner.gender}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Last 7 Days Attendance
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-success/10 p-3 text-center">
                          <Check className="mx-auto h-5 w-5 text-success mb-1" />
                          <p className="text-2xl font-bold">{stats.present}</p>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        <div className="rounded-lg bg-destructive/10 p-3 text-center">
                          <X className="mx-auto h-5 w-5 text-destructive mb-1" />
                          <p className="text-2xl font-bold">{stats.absent}</p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        <div className="rounded-lg bg-warning/10 p-3 text-center">
                          <Clock className="mx-auto h-5 w-5 text-warning mb-1" />
                          <p className="text-2xl font-bold">{stats.late}</p>
                          <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        View Grades
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <Calendar className="h-8 w-8" />
                <span>School Calendar</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <MessageSquare className="h-8 w-8" />
                <span>Contact Teachers</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <GraduationCap className="h-8 w-8" />
                <span>Report Cards</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <User className="h-8 w-8" />
                <span>My Profile</span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;
