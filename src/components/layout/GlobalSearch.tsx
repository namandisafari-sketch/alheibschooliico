import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { navSections, NavItem } from "@/config/navigation";
import { isWhitelistedAdmin } from "@/config/admins";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { user, role, roleFetched } = useAuth();
  const { isGlobalAdmin } = useIsAdmin();

  const isWhitelisted = isWhitelistedAdmin(user?.email);

  // Flattens the nested navigation sections for easier searching
  const allPages = React.useMemo(() => {
    return navSections.flatMap(section => 
      section.items.map(item => ({
        ...item,
        dept: section.titleKey
      }))
    );
  }, []);

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

  const isAllowed = (page: NavItem) => {
    if (isWhitelisted) return true;
    if (page.adminOnly && !isGlobalAdmin) return false;
    return !page.roles || (roleFetched && role && page.roles.includes(role));
  };

  const visiblePages = allPages.filter(isAllowed);

  // Group pages back into departments based on the source section
  const groups = visiblePages.reduce((acc, page) => {
    if (!acc[page.dept]) acc[page.dept] = [];
    acc[page.dept].push(page);
    return acc;
  }, {} as Record<string, typeof visiblePages>);

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
          {Object.entries(groups).map(([dept, pages], idx) => (
            <React.Fragment key={dept}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={dept}>
                {pages.map((page) => (
                  <CommandItem
                    key={page.path}
                    value={`${page.labelKey} ${dept}`}
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
                      <span className="font-medium text-sm leading-none">{page.labelKey}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 truncate">{dept}</span>
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
