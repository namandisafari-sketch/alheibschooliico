import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useInAppNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useInAppNotifications";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const NotificationBell = () => {
  const { data: notifications = [] } = useInAppNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.is_read);
  const count = unread.length;

  const typeColor = (t: string) => {
    switch (t) {
      case "success": return "bg-green-500";
      case "warning": return "bg-amber-500";
      case "error": return "bg-destructive";
      default: return "bg-primary";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h4 className="font-semibold text-sm">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {count > 0 ? `${count} unread` : "All caught up"}
            </p>
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAll.mutate()}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id);
                    if (n.link) navigate(n.link);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3",
                    !n.is_read && "bg-primary/5"
                  )}
                >
                  <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", typeColor(n.type), n.is_read && "opacity-30")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-tight", !n.is_read ? "font-semibold" : "font-medium")}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">NEW</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Check
                      className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 mt-1.5"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
