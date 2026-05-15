import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, Users, BookOpen, GraduationCap, HardHat, Shield, Box, Stethoscope, Bed, Scale, Wallet, ShoppingCart, Receipt, UserCheck, ClipboardCheck, Calendar, PenLine, BookMarked, FileText, Star, Layers, UserCog, CreditCard, Clock } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface PageEntry {
  icon: React.ElementType;
  title: string;
  path: string;
  roles?: AppRole[];
  adminOnly?: boolean;
}

interface DeptGroup {
  dept: string;
  pages: PageEntry[];
}

const deptGroups: DeptGroup[] = [
  {
    dept: "Administration Dept.",
    pages: [
      { icon: LayoutDashboard, title: "Dashboard", path: "/", roles: ["admin", "teacher", "staff", "security", "head_teacher", "accountant"] },
      { icon: Calendar, title: "Calendar & Programme", path: "/calendar", roles: ["admin", "teacher", "staff", "security", "parent", "head_teacher", "accountant"] },
      { icon: Clock, title: "Schedule", path: "/schedule", roles: ["admin", "teacher", "staff", "security", "head_teacher"] },
    ],
  },
  {
    dept: "Academic Dept.",
    pages: [
      { icon: Users, title: "Learners", path: "/students", roles: ["admin", "teacher", "head_teacher"] },
      { icon: BookOpen, title: "Classes", path: "/classes", roles: ["admin", "teacher", "head_teacher"] },
      { icon: PenLine, title: "Marks Entry", path: "/marks", roles: ["admin", "teacher", "head_teacher"] },
      { icon: BookMarked, title: "Digital Homework", path: "/homework", roles: ["admin", "teacher", "head_teacher"] },
      { icon: ClipboardCheck, title: "Attendance", path: "/attendance", roles: ["admin", "teacher", "head_teacher"] },
      { icon: FileText, title: "Reports", path: "/reports", roles: ["admin", "teacher", "head_teacher"] },
      { icon: Star, title: "Madrasa & Deen", path: "/madrasa", roles: ["admin", "teacher", "staff", "head_teacher"] },
    ],
  },
  {
    dept: "Human Resources (HR)",
    pages: [
      { icon: GraduationCap, title: "Teachers", path: "/teachers", roles: ["admin", "head_teacher"] },
      { icon: HardHat, title: "Staff & Workers", path: "/staff", roles: ["admin", "head_teacher"] },
      { icon: Layers, title: "Staff Assignments", path: "/staff-assignments", roles: ["admin"], adminOnly: true },
      { icon: UserCog, title: "User Management", path: "/users", roles: ["admin", "head_teacher"] },
      { icon: CreditCard, title: "ID Cards", path: "/id-cards", roles: ["admin", "head_teacher"] },
    ],
  },
  {
    dept: "School Operations & Security",
    pages: [
      { icon: Shield, title: "Gate Passes & Visitors", path: "/visitors", roles: ["admin", "staff", "security", "head_teacher"] },
      { icon: Box, title: "Inventory & Stock", path: "/inventory", roles: ["admin", "staff", "security", "head_teacher"] },
      { icon: Stethoscope, title: "Health Records", path: "/health", roles: ["admin", "teacher", "staff", "head_teacher"] },
      { icon: Bed, title: "Hostel & Welfare", path: "/hostel", roles: ["admin", "staff", "head_teacher"] },
      { icon: Scale, title: "Discipline", path: "/discipline", roles: ["admin", "head_teacher"] },
    ],
  },
  {
    dept: "Finance Dept.",
    pages: [
      { icon: Wallet, title: "Financial Accounts", path: "/accountant/accounts", roles: ["admin", "accountant"] },
      { icon: ShoppingCart, title: "Procurement & Store", path: "/accountant/procurement", roles: ["admin", "accountant"] },
      { icon: Receipt, title: "Petty Cash", path: "/accountant/petty-cash", roles: ["admin", "accountant"] },
      { icon: UserCheck, title: "Payroll & HR", path: "/accountant/payroll", roles: ["admin", "head_teacher", "accountant"] },
      { icon: ClipboardCheck, title: "Audit Log", path: "/accountant/audit-log", roles: ["admin", "accountant"] },
    ],
  },
];

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();
  const { isGlobalAdmin } = useIsAdmin();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isAllowed = (page: PageEntry) => {
    if (page.adminOnly && !isGlobalAdmin) return false;
    return !page.roles || (role && page.roles.includes(role));
  };

  const visibleGroups = deptGroups
    .map((g) => ({ ...g, pages: g.pages.filter(isAllowed) }))
    .filter((g) => g.pages.length > 0);

  return (
    <>
      {/* Full search bar — large screens */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-64 px-3 py-1.5 text-sm text-muted-foreground bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors text-left"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Search pages...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-white px-1.5 font-mono text-[10px] font-bold text-slate-500 shadow-sm">
          <span className="text-xs leading-none">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search any page or department..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>
            <div className="py-8 text-center text-sm text-muted-foreground">
              No pages found. Try a department name.
            </div>
          </CommandEmpty>
          {visibleGroups.map((group, idx) => (
            <React.Fragment key={group.dept}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group.dept}>
                {group.pages.map((page) => (
                  <CommandItem
                    key={page.path}
                    value={`${page.title} ${group.dept}`}
                    onSelect={() => {
                      navigate(page.path);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <page.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm leading-none">{page.title}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 truncate">{group.dept}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
