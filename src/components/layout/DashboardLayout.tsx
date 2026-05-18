import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PoweredBy } from "./PoweredBy";
import { PageGuide } from "../common/PageGuide";
import { Button } from "@/components/ui/button";
import { Menu, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { TeacherTimetableReminder } from "../dashboard/TeacherTimetableReminder";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "1";
  });
  const { isRTL } = useLanguage();
  const { role } = useAuth();
  const isDirector = role === "center_director";

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div
      className={cn(
        "min-h-screen islamic-pattern",
        isDirector
          ? "bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50"
          : "bg-background"
      )}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div
        className={cn(
          "transition-all duration-300 flex flex-col min-h-screen",
          isRTL
            ? collapsed ? "lg:mr-16" : "lg:mr-64"
            : collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        {/* Mobile header */}
        <div
          className={cn(
            "sticky top-0 z-30 flex items-center gap-4 border-b px-4 py-3 backdrop-blur lg:hidden",
            isDirector
              ? "border-amber-200/60 bg-gradient-to-r from-amber-50/95 via-white/95 to-amber-50/95"
              : "border-border bg-background/95"
          )}
        >
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Desktop header */}
        <div
          className={cn(
            "hidden lg:flex items-center gap-2 px-6 h-16 border-b backdrop-blur sticky top-0 z-30",
            isDirector
              ? "border-amber-200/60 bg-gradient-to-r from-amber-50/80 via-white/90 to-orange-50/80 shadow-sm"
              : "border-border bg-background/95 supports-[backdrop-filter]:bg-background/60"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 h-10 w-10 hover:bg-slate-100 transition-colors"
          >
            <PanelLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="flex-1">
            <Header title={title} subtitle={subtitle} hideBorder />
          </div>
        </div>

        <main id="dashboard-main-content" className="flex-1 p-4 lg:p-6">
          <TeacherTimetableReminder />
          {children}
        </main>
        <PoweredBy />
        <PoweredBy variant="print" />
      </div>
    </div>
  );
};
