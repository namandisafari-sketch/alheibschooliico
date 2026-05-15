// @ts-nocheck
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffOption {
  id: string;
  full_name: string;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  role?: string | null;
}

interface Props {
  value: string;
  onSelect: (name: string, staff?: StaffOption) => void;
  placeholder?: string;
  excludeUserId?: string;
  className?: string;
}

/**
 * Searchable staff dropdown — pulls from `profiles`, lets the user
 * type to filter, and returns the chosen full name (plus the row).
 */
export const StaffSearchSelect = ({ value, onSelect, placeholder = "Select staff…", excludeUserId, className }: Props) => {
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["staff-options"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, department, position, phone, role")
        .order("full_name");
      return (data || []) as StaffOption[];
    },
    staleTime: 60_000,
  });

  const options = useMemo(
    () => data.filter((s) => s.full_name && (!excludeUserId || s.id !== excludeUserId)),
    [data, excludeUserId]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name, role or department…" />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
              </div>
            ) : (
              <>
                <CommandEmpty>No staff found.</CommandEmpty>
                <CommandGroup>
                  {options.map((s) => {
                    const meta = [s.position, s.department, s.role].filter(Boolean).join(" · ");
                    const searchValue = `${s.full_name} ${meta}`.toLowerCase();
                    return (
                      <CommandItem
                        key={s.id}
                        value={searchValue}
                        onSelect={() => {
                          onSelect(s.full_name, s);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", value === s.full_name ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col">
                          <span className="font-medium">{s.full_name}</span>
                          {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
