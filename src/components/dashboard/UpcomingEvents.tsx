import { Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("scheduled_notifications")
        .select("id, scheduled_for, target_audience, notification_templates(name, subject)")
        .gte("scheduled_for", now)
        .eq("status", "scheduled")
        .order("scheduled_for", { ascending: true })
        .limit(5);
      return data || [];
    },
    refetchInterval: 60000,
  });
};

const formatEventDate = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d, yyyy");
};

export const UpcomingEvents = () => {
  const { data: events, isLoading } = useUpcomingEvents();

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 animate-slide-up" style={{ animationDelay: "500ms" }}>
      <h3 className="font-display text-base md:text-lg font-semibold text-card-foreground">
        Upcoming Events
      </h3>
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 md:h-16 w-full" />)
        ) : !events?.length ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-4">No upcoming events scheduled</p>
        ) : (
          events.map((event: any) => {
            const date = new Date(event.scheduled_for);
            const title = event.notification_templates?.subject || event.notification_templates?.name || "Scheduled notification";
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 md:gap-4 rounded-lg border border-border p-2 md:p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-xs md:text-sm truncate w-full">{title}</p>
                  <div className="mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-400 font-medium">
                    <span>{formatEventDate(date)}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{format(date, "h:mm a")}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
