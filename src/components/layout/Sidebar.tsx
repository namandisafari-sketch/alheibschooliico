// @ts-nocheck
import { NavLink, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Bell,
  LogOut,
  HardHat,
  UserCog,
  PenLine,
  FileText,
  FileCheck,
  Settings,
  Wallet,
  CreditCard,
  Receipt,
  UserCheck,
  Box,
  Clock,
  Stethoscope,
  Star,
  Bed,
  BookMarked,
  X,
  Shield,
  Layers,
  Scale,
  ShoppingCart,
  BarChart3,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { navSections, bottomNavItems, NavItem } from "@/config/navigation";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ROLE_LABEL } from "@/lib/roleConfig";

export const Sidebar = ({ isOpen = false, onClose, collapsed = false }: SidebarProps) => {
  const { user, role, roleFetched, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const { isGlobalAdmin } = useIsAdmin();
  const [search, setSearch] = useState("");

  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);

  // Restore scroll position
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebar-scroll");
    if (navRef.current && savedScroll) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem("sidebar-scroll", navRef.current.scrollTop.toString());
    }
  };

  const adminEmails = [
    "muslim.ummahlink@gmail.com",
    "admin@ummahlink.app",
    "admin@alhebi.com",
    "info.kabejjasystems@gmail.com",
    "papa@alheib.teacher",
    "admin@alheib.com",
    "alhebiadmin@gmail.com"
  ];
  const isWhitelisted = user?.email && adminEmails.includes(user.email.toLowerCase().trim());

  const allowed = (item: NavItem) => {
    if (isWhitelisted) return true;
    if (item.adminOnly && !isGlobalAdmin) return false;
    return !item.roles || (role && item.roles.includes(role));
  };

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!allowed(item)) return false;
          if (!q) return true;
          return (
            t(item.labelKey).toLowerCase().includes(q) ||
            item.labelKey.toLowerCase().includes(q) ||
            item.path.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((section) => section.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, isGlobalAdmin, isWhitelisted, user, roleFetched]);

  const filteredBottomItems = bottomNavItems.filter(
    (item) => isWhitelisted || !item.roles || (role && item.roles.includes(role))
  );

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const roleLabel = isWhitelisted ? "Systems Administrator" : (role ? (ROLE_LABEL[role] ?? role) : "");

  const purgeSession = async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (isSupabaseConfigured) {
      await signOut();
    }
    window.location.href = "/auth";
  };

  const sideClass = isRTL
    ? cn(
        "fixed right-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 ease-in-out w-64",
        collapsed ? "lg:w-16" : "lg:w-64",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )
    : cn(
        "fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 ease-in-out w-64",
        collapsed ? "lg:w-16" : "lg:w-64",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      );


  return (
    <aside id="primary-sidebar" className={sideClass}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className={cn(
            "flex h-20 items-center justify-between border-b border-sidebar-border",
            collapsed ? "lg:px-2 px-6" : "px-6"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <h1 className="font-display text-lg font-semibold text-sidebar-foreground truncate">
                Alheib Mixed
              </h1>
              <p className="text-[10px] text-sidebar-foreground/70 truncate uppercase tracking-tighter">Day & Boarding School</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div
          className={cn(
            "border-b border-sidebar-border py-4",
            collapsed ? "lg:px-2 px-4" : "px-4"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-medium text-sidebar-accent-foreground border-2 border-sidebar-border shadow-sm overflow-hidden">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className={cn(
                "absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-sidebar shadow-sm",
                isSupabaseConfigured ? "bg-green-500" : "bg-orange-500 animate-pulse"
              )} title={isSupabaseConfigured ? "Live Database Connected" : "Running in Demo Mode"} />
            </div>
            <div className={cn("flex-1 min-w-0", collapsed && "lg:hidden")}>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-sidebar-foreground truncate tracking-tight">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                {isSupabaseConfigured ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                ) : (
                  <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase tracking-tighter bg-orange-100 text-orange-700 border-orange-200">Demo</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {role && (
                  <Badge variant="secondary" className="text-[9px] h-4 font-black uppercase tracking-widest bg-sidebar-primary/10 text-sidebar-primary border-none">
                    {roleLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {!collapsed && (
            <div className="mt-2.5 px-0.5">
              <p className="text-[10px] text-sidebar-foreground/40 font-mono truncate px-1">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search pages...")}
                className="w-full rounded-md bg-sidebar-accent/40 pl-8 pr-2 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 outline-none focus:ring-2 focus:ring-sidebar-primary/40"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className={cn(
            "flex-1 overflow-y-auto no-scrollbar",
            collapsed ? "lg:p-2 p-4" : "p-3"
          )}
        >
          {user && !roleFetched && !search && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-sidebar-primary/50" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-sidebar-foreground/40">Loading Access...</p>
            </div>
          )}

          {!isWhitelisted && !isSupabaseConfigured && (
            <div className="mx-2 mb-4 rounded-xl bg-orange-50 p-4 border-2 border-orange-200/50 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 text-orange-800 mb-1.5">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Connection Offline</span>
              </div>
              <p className="text-[11px] font-medium text-orange-700 leading-tight">
                Backend secrets missing. Please update your environment variables to sync with your real database.
              </p>
            </div>
          )}

          {user && roleFetched && !role && !search && !isWhitelisted && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 shadow-inner bg-destructive/5 rounded-xl border border-destructive/10 mx-2">
              <Shield className="h-8 w-8 text-destructive/40" />
              <div className="text-center">
                <p className="text-xs font-bold text-destructive/70">NO ACCESS ROLE</p>
                <p className="text-[10px] text-destructive/50 mt-1 leading-tight">Your account needs an assigned role. Registered as:</p>
                <p className="text-[9px] font-mono text-destructive/60 break-all mt-1 select-all">{user.email}</p>
                <p className="text-[10px] text-destructive/50 mt-2 leading-tight italic font-medium">Contact system HQ for activation.</p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 h-7 text-[10px] uppercase font-bold tracking-tight border-destructive/20 text-destructive/70 hover:bg-destructive/10"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Refresh Session
                </Button>
              </div>
            </div>
          )}
          
          {filteredSections.length === 0 && (roleFetched && role || !user) && (
            <p className="px-3 py-6 text-center text-xs text-sidebar-foreground/50">
              {t("No pages found")}
            </p>
          )}
          {filteredSections.map((section) => (
            <div key={section.titleKey} className="mb-3">
              {!collapsed && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                  {t(section.titleKey)}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={handleNavClick}
                    title={t(item.labelKey)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 px-3 py-2.5",
                        collapsed && "lg:justify-center lg:px-2",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={cn("truncate", collapsed && "lg:hidden")}>{t(item.labelKey)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className={cn("border-t border-sidebar-border bg-sidebar-accent/10", collapsed ? "lg:p-2 p-3" : "p-3")}>
          {filteredBottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={t(item.labelKey)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 px-3 py-2.5 mb-0.5",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn("truncate", collapsed && "lg:hidden font-medium")}>{t(item.labelKey)}</span>
            </NavLink>
          ))}
          
          <div className="mt-4 pt-4 border-t border-sidebar-border/50 space-y-2">
            <button
              onClick={signOut}
              title={t("logout")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg text-xs font-bold uppercase tracking-wider text-sidebar-foreground/60 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive px-3 py-2.5",
                collapsed && "lg:justify-center lg:px-2"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", collapsed && "lg:hidden")}>{t("logout")}</span>
            </button>

            {!collapsed && (
              <button
                onClick={purgeSession}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-orange-600/50 hover:text-orange-600 transition-colors"
                title="Clears all local data and forces fresh login"
              >
                <RefreshCw className="h-3 w-3" />
                Purge & Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};