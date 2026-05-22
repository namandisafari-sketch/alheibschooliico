// @ts-nocheck
import { UserPlus, DollarSign, ClipboardCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  type: "enrollment" | "payment" | "attendance" | "report";
  message: string;
  time: string;
  icon: any;
  color: string;
}

const useRecentActivity = () => {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async (): Promise<Activity[]> => {
      const [learners, payments, attendance, reports] = await Promise.all([
        supabase.from("learners").select("id, full_name, created_at, classes(name)").order("created_at", { ascending: false }).limit(3),
        supabase.from("fee_payments").select("id, amount, created_at, learners(full_name)").order("created_at", { ascending: false }).limit(3),
        supabase.from("attendance").select("id, status, created_at, learners(full_name)").order("created_at", { ascending: false }).limit(2),
        supabase.from("report_cards").select("id, generated_at, learners(full_name)").order("generated_at", { ascending: false }).limit(2),
      ]);

      const items: Activity[] = [];

      (learners.data || []).forEach((l: any) => {
        items.push({
          id: `l-${l.id}`,
          type: "enrollment",
          message: `New learner ${l.full_name} enrolled${l.classes?.name ? ` in ${l.classes.name}` : ""}`,
          time: l.created_at,
          icon: UserPlus,
          color: "text-success bg-success/10",
        });
      });

      (payments.data || []).forEach((p: any) => {
        items.push({
          id: `p-${p.id}`,
          type: "payment",
          message: `Payment of UGX ${Number(p.amount).toLocaleString()} from ${p.learners?.full_name || "learner"}`,
          time: p.created_at,
          icon: DollarSign,
          color: "text-primary bg-primary/10",
        });
      });

      (attendance.data || []).forEach((a: any) => {
        items.push({
          id: `a-${a.id}`,
          type: "attendance",
          message: `${a.learners?.full_name || "Learner"} marked ${a.status}`,
          time: a.created_at,
          icon: ClipboardCheck,
          color: "text-info bg-info/10",
        });
      });

      (reports.data || []).forEach((r: any) => {
        items.push({
          id: `r-${r.id}`,
          type: "report",
          message: `Report card generated for ${r.learners?.full_name || "learner"}`,
          time: r.generated_at,
          icon: FileText,
          color: "text-warning bg-warning/10",
        });
      });

      return items
        .filter((i) => i.time)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 6);
    },
    refetchInterval: 30000,
  });
};

export const RecentActivity = () => {
  const { data: activities, isLoading } = useRecentActivity();

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <h3 className="font-display text-base md:text-lg font-semibold text-card-foreground">
        Recent Activity
      </h3>
      <div className="mt-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 md:h-12 w-full" />)
        ) : !activities?.length ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 md:gap-4">
              <div className={cn("rounded-lg p-2 shrink-0", activity.color)}>
                <activity.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-card-foreground leading-snug md:leading-normal">{activity.message}</p>
                <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-muted-foreground font-medium">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
