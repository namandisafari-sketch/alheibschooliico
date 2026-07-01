import { UserPlus, DollarSign, ClipboardCheck, FileText, Filter, X, Calendar, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Activity {
  id: string;
  type: "enrollment" | "payment" | "attendance" | "report" | "discipline" | "health";
  message: string;
  userName?: string;
  time: string;
  link?: string;
  icon: any;
  color: string;
}

const activityTypeConfig = {
  enrollment: { icon: UserPlus, color: "text-success bg-success/10", label: "Enrollment" },
  payment: { icon: DollarSign, color: "text-primary bg-primary/10", label: "Payment" },
  attendance: { icon: ClipboardCheck, color: "text-info bg-info/10", label: "Attendance" },
  report: { icon: FileText, color: "text-warning bg-warning/10", label: "Report" },
  discipline: { icon: Filter, color: "text-destructive bg-destructive/10", label: "Discipline" },
  health: { icon: Calendar, color: "text-emerald-600 bg-emerald-100", label: "Health" },
};

const useRecentActivity = (typeFilter?: string, searchQuery?: string, dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ["recent-activity", typeFilter, searchQuery, dateFrom, dateTo],
    queryFn: async (): Promise<Activity[]> => {
      const [learnersRes, paymentsRes, attendanceRes, reportsRes, profilesRes] = await Promise.all([
        supabase.from("learners").select("id, full_name, created_at, classes(name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("fee_payments").select("id, amount, created_at, collected_by, learners(full_name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("attendance").select("id, status, created_at, recorded_by:profiles!recorded_by(full_name), learners(full_name), date").order("created_at", { ascending: false }).limit(10),
        supabase.from("report_cards").select("id, generated_at, learners(full_name), term, academic_year").order("generated_at", { ascending: false }).limit(10),
        supabase.from("profiles").select("id, full_name"),
      ]);

      const profileMap = new Map<string, string>();
      (profilesRes.data || []).forEach((p: any) => profileMap.set(p.id, p.full_name));

      const items: Activity[] = [];

      (learnersRes.data || []).forEach((l: any) => {
        items.push({
          id: `l-${l.id}`, type: "enrollment",
          message: `New learner ${l.full_name} enrolled${l.classes?.name ? ` in ${l.classes.name}` : ""}`,
          time: l.created_at, icon: UserPlus, color: "text-success bg-success/10",
          link: `/students?id=${l.id}`,
        });
      });

      (paymentsRes.data || []).forEach((p: any) => {
        const userName = profileMap.get(p.collected_by);
        items.push({
          id: `p-${p.id}`, type: "payment",
          message: `Payment of UGX ${Number(p.amount).toLocaleString()} from ${p.learners?.full_name || "learner"}`,
          userName: userName || undefined,
          time: p.created_at, icon: DollarSign, color: "text-primary bg-primary/10",
          link: `/fees?paymentId=${p.id}`,
        });
      });

      (attendanceRes.data || []).forEach((a: any) => {
        const userName = a.recorded_by?.full_name || profileMap.get(a.recorded_by);
        items.push({
          id: `a-${a.id}`, type: "attendance",
          message: `${a.learners?.full_name || "Learner"} marked ${a.status}`,
          userName: userName || undefined,
          time: a.created_at, icon: ClipboardCheck, color: "text-info bg-info/10",
          link: `/attendance?date=${a.date || ""}`,
        });
      });

      (reportsRes.data || []).forEach((r: any) => {
        items.push({
          id: `r-${r.id}`, type: "report",
          message: `Report card generated for ${r.learners?.full_name || "learner"}`,
          time: r.generated_at, icon: FileText, color: "text-warning bg-warning/10",
          link: `/students?reportId=${r.id}`,
        });
      });

      let filtered = items.filter((i) => i.time)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      if (typeFilter && typeFilter !== "all") {
        filtered = filtered.filter((i) => i.type === typeFilter);
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((i) => i.message.toLowerCase().includes(q));
      }

      if (dateFrom) {
        const from = new Date(dateFrom).getTime();
        filtered = filtered.filter((i) => new Date(i.time).getTime() >= from);
      }

      if (dateTo) {
        const to = new Date(dateTo).getTime() + 86400000;
        filtered = filtered.filter((i) => new Date(i.time).getTime() <= to);
      }

      return filtered.slice(0, 20);
    },
    refetchInterval: 30000,
  });
};

export const RecentActivity = () => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: activities, isLoading } = useRecentActivity(typeFilter, searchQuery, dateFrom, dateTo);

  const clearFilters = () => {
    setTypeFilter("all");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = typeFilter !== "all" || searchQuery || dateFrom || dateTo;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base md:text-lg font-semibold text-card-foreground">
          Recent Activity
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] font-black uppercase tracking-widest gap-1"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3 w-3" />
          {hasFilters ? "Filters Active" : "Filter"}
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border space-y-3">
          <div className="flex flex-wrap gap-2">
            {["all", "enrollment", "payment", "attendance", "report"].map((type) => (
              <Badge
                key={type}
                variant={typeFilter === type ? "default" : "outline"}
                className="cursor-pointer text-[9px] font-black uppercase tracking-widest h-5"
                onClick={() => setTypeFilter(type)}
              >
                {type === "all" ? "All" : type}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activity..."
                className="h-8 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2"
                placeholder="From"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2"
                placeholder="To"
              />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Clear Filters
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 md:h-14 w-full" />)
        ) : !activities?.length ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
            {hasFilters ? "No activity matches your filters" : "No recent activity"}
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 md:gap-4 p-2 -mx-2 rounded-lg transition-colors",
                activity.link && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => activity.link && navigate(activity.link)}
            >
              <div className={cn("rounded-lg p-2 shrink-0", activity.color)}>
                <activity.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-card-foreground leading-snug md:leading-normal">
                  {activity.message}
                </p>
                <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                  </p>
                  {activity.userName && (
                    <>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <p className="text-[10px] md:text-xs font-semibold text-primary">
                        by {activity.userName}
                      </p>
                    </>
                  )}
                  {activity.link && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
