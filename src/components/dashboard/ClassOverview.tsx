import { Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useClasses } from "@/hooks/useClasses";
import { Skeleton } from "@/components/ui/skeleton";

export const ClassOverview = () => {
  const { data: classes, isLoading } = useClasses();

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base md:text-lg font-semibold text-card-foreground">
            Class Overview
          </h3>
          <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-tight">Term 3 Capacity</p>
        </div>
        <span className="text-[10px] md:text-sm font-bold text-muted-foreground bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
          {classes?.length ?? 0} Streams
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 md:h-10 w-full" />)
        ) : !classes?.length ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-4 font-medium italic">No streams active</p>
        ) : (
          classes.map((cls) => {
            const capacity = cls.capacity || 40;
            return (
              <div key={cls.id} className="space-y-1.5 md:space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <span className="font-bold text-slate-800 text-xs md:text-sm truncate shrink-0">{cls.name}</span>
                    {cls.teacher_name && (
                      <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">({cls.teacher_name.split(' ')[0]})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] md:text-sm text-slate-500 font-black shrink-0">
                    <Users className="h-3 w-3 md:h-4 md:w-4" />
                    {cls.student_count}/{capacity}
                  </div>
                </div>
                <Progress value={(cls.student_count / capacity) * 100} className="h-1.5 md:h-2" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
