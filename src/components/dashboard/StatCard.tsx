import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: "primary" | "secondary" | "success" | "warning" | "info";
  delay?: number;
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export const StatCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "primary",
  delay = 0,
}: StatCardProps) => {
  return (
    <div
      className="card-hover rounded-xl border border-border bg-card p-4 md:p-6 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 md:mt-2 font-display text-xl md:text-3xl font-semibold text-card-foreground truncate">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "mt-2 text-[10px] md:text-sm font-medium truncate",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2 md:p-3 shrink-0", iconColorClasses[iconColor])}>
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </div>
  );
};
