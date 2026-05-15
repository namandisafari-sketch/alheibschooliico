
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisciplineFlagProps {
  disciplineCase: any;
  className?: string;
}

export function DisciplineFlag({ disciplineCase, className }: DisciplineFlagProps) {
  if (!disciplineCase) return null;

  return (
    <div className={cn(
      "p-3 rounded-2xl border-2 animate-pulse flex flex-col gap-2 shadow-lg",
      disciplineCase.severity === 'critical' ? "bg-red-50 border-red-500 text-red-900" : "bg-orange-50 border-orange-500 text-orange-900",
      className
    )}>
      <div className="flex items-center gap-2">
        <ShieldAlert className={cn(
          "h-5 w-5",
          disciplineCase.severity === 'critical' ? "text-red-600" : "text-orange-600"
        )} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Red Flag Alert</span>
      </div>
      
      <div className="space-y-0.5">
        <p className="text-xs font-black uppercase leading-tight">{disciplineCase.incident_type}</p>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">
          Punishment: {disciplineCase.action_taken || "Pending Decision"}
        </p>
      </div>
      
      <div className="mt-1 py-1 px-2 bg-white/50 rounded-lg border border-current/10">
        <p className="text-[9px] font-black uppercase tracking-tighter opacity-70">Case Status: {disciplineCase.status}</p>
      </div>
    </div>
  );
}
