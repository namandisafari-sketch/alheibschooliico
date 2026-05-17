import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/roleConfig";

interface HeaderProps {
  title: string;
  subtitle?: string;
  hideBorder?: boolean;
}

export const Header = ({ title, subtitle, hideBorder }: HeaderProps) => {
  const { user, role } = useAuth();
  const openSearch = () => {
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
    document.dispatchEvent(event);
  };

  return (
    <header className={cn(
      "z-30 w-full transition-all duration-200",
      !hideBorder && "sticky top-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className={cn("flex h-16 items-center justify-between", !hideBorder && "px-4 sm:px-6")}>

        {/* Left: Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">
                {subtitle}
              </p>
            )}
          </div>
          {/* Online / Offline indicator */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 shrink-0">
            <div className={cn("h-1.5 w-1.5 rounded-full", navigator.onLine ? "bg-emerald-500" : "bg-red-500")} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              {navigator.onLine ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Full search bar — xl screens only */}
          <div className="hidden xl:block">
            <GlobalSearch />
          </div>

          {/* Icon-only search — below xl */}
          <button
            onClick={openSearch}
            className="xl:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200 transition-colors"
            title="Search pages (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <NotificationBell />

            <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="hidden lg:text-right lg:block">
                <p className="text-[10px] font-bold text-slate-900 leading-none">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Guest"}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                  {role ? (ROLE_LABEL[role] || role) : "No Access Role"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                asChild
              >
                <a href="/account-settings">
                  <User className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
