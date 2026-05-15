import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LearnerActions } from "./LearnerActions";
import { Phone, Mail, User, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearnerDetailsDialog } from "./LearnerDetailsDialog";

interface LearnerFolderCardProps {
  student: any;
}

export const LearnerFolderCard = ({ student }: LearnerFolderCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setDetailsOpen(true)}
        className="group relative w-full max-w-[280px] transition-all duration-300 hover:-translate-y-2 cursor-pointer active:scale-95"
      >
        {/* Folder Back */}
        <div className="absolute inset-0 bg-[#FBBF24] rounded-xl shadow-lg transform skew-x-1" />
        
        {/* Folder Tab - High Visibility */}
        <div className="absolute -top-6 left-6 min-w-[120px] px-4 h-9 bg-slate-900 rounded-t-xl shadow-md flex items-center justify-center border-t border-x border-slate-700 z-20">
          <span className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
            #{student.admission_number || "NO-ADM"}
          </span>
        </div>

        {/* The "Paper" inside */}
        <div className="relative mt-2 mx-2 bg-white rounded-lg shadow-inner overflow-hidden transition-all duration-500 group-hover:mt-0 group-hover:mb-2 h-[220px]">
          {/* Paper Content */}
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-800 truncate leading-tight">{student.full_name}</h3>
                <Badge variant="outline" className="mt-1 text-[9px] px-1.5 h-4 border-slate-200 text-slate-500">
                  {student.class_name || "UNASSIGNED"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2.5 flex-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Guardian</span>
                <span className="text-xs text-slate-700 font-medium">{student.guardian_name || "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Gender / Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-700 capitalize">{student.gender}</span>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    student.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                  )} />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5" 
                  disabled={!student.guardian_phone}
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5" 
                  disabled
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <LearnerActions learner={student} />
              </div>
            </div>
          </div>

          {/* Paper lines decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50/50 to-transparent -mr-12 -mt-12 rounded-full pointer-events-none" />
          
          {/* View Folder Hint on Hover */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none">
            <FolderOpen className="h-8 w-8 text-white animate-bounce" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Open Folder</span>
          </div>
        </div>

        {/* Folder Front Cover (half-height) */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#F59E0B] rounded-b-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-amber-400/30 flex items-end p-3 pointer-events-none">
          <div className="w-full h-px bg-amber-600/20 mb-2" />
        </div>

        {/* Reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-xl pointer-events-none" />
      </div>

      <LearnerDetailsDialog 
        student={student} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
    </>
  );
};
