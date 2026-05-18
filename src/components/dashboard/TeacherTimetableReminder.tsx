import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTimetable } from "@/hooks/useTimetable";
import { AlertCircle, BellRing, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const TeacherTimetableReminder = () => {
  const { user, role } = useAuth();
  const { data: slots = [] } = useTimetable();
  const [currentReminder, setCurrentReminder] = useState<{
    type: "active" | "upcoming";
    subjectName: string;
    className: string;
    roomName: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Check schedules every 15 seconds to give immediate real-time reminders
  useEffect(() => {
    if (!user || slots.length === 0) return;

    // Only teachers and admins need schedules / timetable reminders
    const isTeacherOrAdmin = role === "teacher" || role === "admin" || role === "head_teacher" || role === "dos";
    if (!isTeacherOrAdmin) return;

    const calculateReminder = () => {
      const now = new Date();
      // getDay() is 0 for Sunday, 1 for Monday, ..., 5 for Friday, 6 for Saturday.
      const currentDayVal = now.getDay();
      
      // If it's the weekend (Saturday or Sunday), show no school time reminders
      if (currentDayVal === 0 || currentDayVal === 6) {
        setCurrentReminder(null);
        return;
      }

      // Convert current time to a numeric value for easier calculations (e.g. 10:45 -> 10 * 60 + 45 = 645)
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Filter slots for the active teacher
      const mySlots = slots.filter(s => s.teacher_id === user.id && s.day_of_week === currentDayVal);

      if (mySlots.length === 0) {
        setCurrentReminder(null);
        return;
      }

      let activeClass = null;
      let nextClass = null;
      let nextClassTimeDiff = Infinity;

      for (const slot of mySlots) {
        // Parse "hh:mm"
        const [startH, startM] = slot.start_time.split(":").map(Number);
        const [endH, endM] = (slot.end_time || "17:00").split(":").map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Check if class is ACTIVE right now
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          activeClass = slot;
          break;
        }

        // Check if class is UPCOMING later today
        if (startMinutes > currentMinutes) {
          const diff = startMinutes - currentMinutes;
          if (diff < nextClassTimeDiff) {
            nextClassTimeDiff = diff;
            nextClass = slot;
          }
        }
      }

      if (activeClass) {
        setCurrentReminder({
          type: "active",
          subjectName: activeClass.subjects?.name || "Scheduled Class",
          className: activeClass.classes?.name || "Assigned Class",
          roomName: activeClass.room_id || "Main Classroom",
          startTime: activeClass.start_time,
          endTime: activeClass.end_time || "12:00",
        });
      } else if (nextClass && nextClassTimeDiff <= 120) {
        // If there's an upcoming class in the next 2 hours (120 minutes)
        setCurrentReminder({
          type: "upcoming",
          subjectName: nextClass.subjects?.name || "Scheduled Class",
          className: nextClass.classes?.name || "Assigned Class",
          roomName: nextClass.room_id || "Main Classroom",
          startTime: nextClass.start_time,
          endTime: nextClass.end_time || "12:00",
        });
      } else {
        setCurrentReminder(null);
      }
    };

    calculateReminder();
    const interval = setInterval(calculateReminder, 15000);
    return () => clearInterval(interval);
  }, [user, slots, role]);

  if (!currentReminder) return null;

  const isActive = currentReminder.type === "active";

  return (
    <div
      className={cn(
        "w-full px-4 py-3.5 mb-6 rounded-2xl border transition-all duration-300 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-subtle",
        isActive
          ? "bg-red-50/90 border-red-200 text-red-900 backdrop-blur-md"
          : "bg-amber-50/90 border-amber-200 text-amber-900 backdrop-blur-md"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm",
            isActive
              ? "bg-red-600 text-white animate-bounce"
              : "bg-amber-500 text-white animate-spin-slow"
          )}
        >
          {isActive ? (
            <BellRing className="h-5 w-5 animate-pulse" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                isActive
                  ? "bg-red-600 text-white"
                  : "bg-amber-600 text-white"
              )}
            >
              {isActive ? "🔴 Live Teaching Reminder" : "📅 Next Period Up"}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {currentReminder.roomName}
            </span>
          </div>
          <h4 className="text-sm font-bold truncate mt-1">
            {isActive ? "It's time to teach " : "Upcoming Class: "}
            <span className="underline decoration-wavy underline-offset-4 decoration-primary/40 font-black">
              {currentReminder.subjectName}
            </span>
            {" for "}
            <span className="font-extrabold">{currentReminder.className}</span>
          </h4>
          <p className="text-[11px] opacity-80 mt-0.5 font-medium">
            Session Schedule: <span className="font-bold">{currentReminder.startTime}</span> to{" "}
            <span className="font-bold">{currentReminder.endTime}</span>
          </p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "text-xs font-bold uppercase tracking-wider h-8 rounded-lg",
            isActive
              ? "border-red-300 text-red-800 hover:bg-red-100 bg-white"
              : "border-amber-300 text-amber-800 hover:bg-amber-100 bg-white"
          )}
          onClick={() => {
            window.location.href = "/dos/timetable";
          }}
        >
          View Full Schedule
        </Button>
      </div>
    </div>
  );
};
