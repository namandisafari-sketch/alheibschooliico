import { UserPlus, FileText, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const actions = [
  { icon: UserPlus, label: "Add Student", variant: "default" as const, path: "/students" },
  { icon: FileText, label: "Generate Report", variant: "outline" as const, path: "/reports" },
  { icon: Calendar, label: "Schedule Event", variant: "outline" as const, path: "/calendar" },
  { icon: MessageSquare, label: "Send Notice", variant: "outline" as const, path: "/notifications" },
];

export const QuickActions = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <h3 className="font-display text-base md:text-lg font-semibold text-card-foreground">
        Quick Actions
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-2 md:gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto flex-col gap-1.5 md:gap-2 py-3 md:py-4 px-2"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-[10px] md:text-xs truncate w-full">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
