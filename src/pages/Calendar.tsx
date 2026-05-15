import { useState } from "react";
import { motion } from "motion/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useCalendar, useUpsertCalendarEvent, CalendarEvent } from "@/hooks/useCalendar";
import { Printer, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, School, Palmtree, Loader2, ClipboardList } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, isAfter, isBefore } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useIdCardSettings } from "@/hooks/useIdCardSettings";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const PRINT_STYLES = `
  @media screen {
    .poster-view { 
      background: #ffffff;
      max-width: 1400px;
      margin: 40px auto;
      padding: 60px;
      border: 1px solid rgba(0, 130, 132, 0.1);
      border-radius: 80px;
      box-shadow: 0 100px 150px -50px rgba(0, 80, 82, 0.2), 0 50px 100px -30px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }
    .poster-view::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: 
        radial-gradient(circle at 10% 10%, rgba(0, 130, 132, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 90%, rgba(0, 130, 132, 0.05) 0%, transparent 40%);
      pointer-events: none;
    }
    .calendar-card {
      border-radius: 32px !important;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .calendar-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px -10px rgba(0, 130, 132, 0.2);
    }
  }

  @media print {
    @page {
      size: A3 landscape;
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: visible !important;
    }
    /* Hide everything by default for print */
    body * {
      visibility: hidden !important;
    }
    /* Only show the poster and its contents */
    .poster-view, .poster-view * {
      visibility: visible !important;
    }
    .poster-view {
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      padding: 15mm !important;
      margin: 0 !important;
      background: white !important;
      border-radius: 0 !important;
      border: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-hidden { display: none !important; }
  }
`;

const Calendar = () => {
  const { data: events = [], isLoading } = useCalendar();
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "head_teacher";
  const { data: idSettings } = useIdCardSettings();
  const upsertEvent = useUpsertCalendarEvent();

  const [academicYear, setAcademicYear] = useState(2025);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"yearly" | "termly" | "monthly" | "weekly">("yearly");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state for new event
  const [newEvent, setNewEvent] = useState({
    title: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    event_type: "event" as CalendarEvent["event_type"],
    description: "",
    recurrence: "none" as NonNullable<CalendarEvent["recurrence"]>
  });

  if (isLoading) {
     return (
       <DashboardLayout title="Academic Calendar" subtitle="School Program & Yearly Itinerary">
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
               <Loader2 className="w-12 h-12 text-[#008284] animate-spin mx-auto" />
               <p className="text-[#008284] font-black uppercase tracking-widest text-xs">Propagating Calendar Data...</p>
            </div>
         </div>
       </DashboardLayout>
     );
  }

  const handleUpsert = async () => {
    if (!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await upsertEvent.mutateAsync({
        ...newEvent,
        color: newEvent.event_type === 'holiday' ? '#f59e0b' : 
               newEvent.event_type === 'exam' ? '#3b82f6' : 
               newEvent.event_type === 'term' ? '#10b981' : '#008284'
      });
      
      toast({
        title: "EVENT REGISTERED",
        description: `${newEvent.title} has been added to the master academic cycle.`,
      });
      
      setIsAddOpen(false);
      setNewEvent({
        title: "",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
        event_type: "event",
        description: "",
        recurrence: "none"
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error saving the event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredEvents = events.filter(e => {
    if (selectedType === "all") return true;
    return e.event_type === selectedType;
  });

  // Standard Calendar Year for Uganda (Jan to Dec)
  const monthOrder = [
    { name: "JANUARY", month: 0 },
    { name: "FEBRUARY", month: 1 },
    { name: "MARCH", month: 2 },
    { name: "APRIL", month: 3 },
    { name: "MAY", month: 4 },
    { name: "JUNE", month: 5 },
    { name: "JULY", month: 6 },
    { name: "AUGUST", month: 7 },
    { name: "SEPTEMBER", month: 8 },
    { name: "OCTOBER", month: 9 },
    { name: "NOVEMBER", month: 10 },
    { name: "DECEMBER", month: 11 },
  ];

  const handlePrint = () => { 
    toast({
      title: "PREPARING MASTER POSTER",
      description: "If print window doesn't open, please click the 'Open in New Tab' icon in the top right and try again.",
    });
    setTimeout(() => {
      window.print();
    }, 800);
  };

  const isEventOnDay = (event: CalendarEvent, day: Date) => {
    const start = parseISO(event.start_date);
    const end = parseISO(event.end_date);
    
    // Standard overlap check
    const overlaps = isWithinInterval(day, { start, end });
    if (overlaps) return true;

    // Recurrence check
    if (event.recurrence && event.recurrence !== 'none') {
      // If day is before start date, skip (recurrence starts from start_date)
      if (isBefore(day, start) && !isSameDay(day, start)) return false;

      if (event.recurrence === 'weekly') {
        return day.getDay() === start.getDay();
      }
      if (event.recurrence === 'monthly') {
        return day.getDate() === start.getDate();
      }
      if (event.recurrence === 'annually') {
        return day.getDate() === start.getDate() && day.getMonth() === start.getMonth();
      }
      if (event.recurrence === 'termly') {
        // Simple heuristic: repeat every 4 months
        const diffMonths = (day.getFullYear() - start.getFullYear()) * 12 + (day.getMonth() - start.getMonth());
        return diffMonths % 4 === 0 && day.getDate() === start.getDate();
      }
    }
    return false;
  };

  const getDayStatus = (day: Date) => {
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Check events from filtered set
    const dayEvents = filteredEvents.filter(e => isEventOnDay(e, day));

    if (dayEvents.some(e => e.event_type === 'holiday')) return 'holiday';
    if (dayEvents.some(e => e.event_type === 'exam')) return 'exam';
    if (dayEvents.some(e => e.event_type === 'term')) return 'term';
    
    return isWeekend ? 'weekend' : 'workday';
  };

  const MonthCard = ({ name, month, year }: { name: string, month: number, year: number }) => {
    const monthDate = new Date(year, month, 1);
    const days = eachDayOfInterval({ 
      start: startOfMonth(monthDate), 
      end: endOfMonth(monthDate) 
    });
    
    // Week numbering (Uganda standard)
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    const firstDay = days[0].getDay();
    const padding = (firstDay + 6) % 7; // Monday start
    
    for (let i = 0; i < padding; i++) {
      currentWeek.push(null as any);
    }

    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null as any);
      weeks.push(currentWeek);
    }

    return (
      <div className="flex flex-col group">
        <div className="bg-[#008284] text-white text-center font-black py-2.5 text-[10px] tracking-[0.3em] uppercase rounded-t-[32px] border-b border-white/10 shadow-sm">
          {name}
        </div>
        <div className="calendar-card border-[#008284]/20 border bg-white rounded-b-[32px]">
          <div className="grid grid-cols-7 text-[8px] font-black border-b border-[#008284]/5 bg-slate-50/50">
            {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(d => (
              <div key={d} className="text-[#008284]/60 text-center py-2">{d}</div>
            ))}
          </div>
          {weeks.map((week, wkIdx) => (
            <div key={wkIdx} className="grid grid-cols-7 text-[9px] border-b border-[#008284]/5 last:border-0 h-7">
              {week.map((day, dIdx) => {
                if (!day) return <div key={dIdx} className="bg-slate-50/20" />;
                const status = getDayStatus(day);
                const isSun = day.getDay() === 0;
                const isHoli = status === 'holiday' || isSun;
                const isExam = status === 'exam';
                const isTerm = status === 'term';
                
                return (
                  <div 
                    key={dIdx} 
                    className={cn(
                      "flex items-center justify-center border-l border-[#008284]/5 first:border-0 font-bold transition-all",
                      isSun ? "bg-red-50 text-red-600" : "text-slate-600",
                      isHoli && !isSun ? "bg-amber-50 text-amber-700" : "",
                      isExam ? "bg-blue-50 text-blue-700" : "",
                      isTerm ? "bg-emerald-50 text-emerald-700" : ""
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 flex items-center justify-center rounded-full text-[9px]",
                      isSameDay(day, new Date()) && "bg-[#008284] text-white shadow-lg scale-110"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="text-right text-[7px] font-black mt-1 px-2 text-[#008284] tracking-[0.2em] opacity-40 uppercase">
          {days.length} DAYS
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Academic Center" subtitle="Alheib Primary Portfolio">
      <div className="mb-8 flex flex-wrap gap-4 print:hidden print-hidden">
        <div className="flex bg-white p-1 rounded-2xl border border-[#008284]/10 shadow-sm overflow-hidden">
          {(["yearly", "termly", "monthly", "weekly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === mode 
                  ? "bg-[#008284] text-white shadow-lg" 
                  : "text-[#008284]/50 hover:text-[#008284]"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <Button variant="outline" onClick={handlePrint} className="rounded-2xl border-[#008284] text-[#008284] font-black hover:bg-[#008284] hover:text-white transition-all shadow-sm">
          <Printer className="mr-2 h-4 w-4" /> GENERATE MASTER POSTER
        </Button>
        {isAdmin && <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-[#008284] font-black hover:bg-[#006e70] shadow-md transition-all">
          <Plus className="mr-2 h-4 w-4" /> REGISTER ACADEMIC EVENT
        </Button>}
        
        <div className="flex items-center gap-3 bg-white px-6 py-1.5 rounded-2xl border border-[#008284]/10 shadow-sm">
          <Label className="font-black text-[#008284]/60 uppercase text-[10px] tracking-widest">Filter Strategy:</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40 border-none bg-transparent font-black text-[#008284] text-lg ring-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#008284]/20">
              <SelectItem value="all">ALL ENTRIES</SelectItem>
              <SelectItem value="holiday">HOLIDAYS ONLY</SelectItem>
              <SelectItem value="exam">EXAM PERIODS</SelectItem>
              <SelectItem value="term">TERM DATES</SelectItem>
              <SelectItem value="activity">ACTIVITIES</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-3 bg-white px-6 py-1.5 rounded-2xl border border-[#008284]/10 shadow-sm">
          <Label className="font-black text-[#008284]/60 uppercase text-[10px] tracking-widest">Academic Cycle:</Label>
          <Select value={academicYear.toString()} onValueChange={(v) => setAcademicYear(parseInt(v))}>
            <SelectTrigger className="w-32 border-none bg-transparent font-black text-[#008284] text-lg ring-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#008284]/20">
              <SelectItem value="2024">CY 2024</SelectItem>
              <SelectItem value="2025">CY 2025</SelectItem>
              <SelectItem value="2026">CY 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {viewMode === "yearly" ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="poster-view"
        >
          <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
          
          {/* Header Section */}
          <div className="flex gap-16 items-center border-b-[4px] border-[#008284] pb-12 mb-16 relative">
            <div className="w-60 h-60 flex items-center justify-center bg-white border-[4px] border-[#008284] rounded-[70px] p-5 shadow-2xl relative z-10 rotate-3 transition-transform hover:rotate-0 duration-500 overflow-hidden">
               <div className="absolute inset-0 border-2 border-dashed border-[#008284]/20 rounded-[60px] animate-spin-slow"></div>
               <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 rounded-[50px] font-black text-[#008284] text-[14px] text-center leading-[1.1] z-10 uppercase tracking-tighter overflow-hidden">
                 {idSettings?.school_logo_url ? (
                   <img 
                     src={idSettings.school_logo_url} 
                     alt="School Logo" 
                     className="w-full h-full object-contain p-2"
                     crossOrigin="anonymous"
                   />
                 ) : (
                   <>
                     <div className="bg-[#008284] p-4 rounded-2xl mb-3 shadow-lg scale-110">
                       <School className="w-10 h-10 text-white" />
                     </div>
                     ALHEIB<br/>PRIMARY
                     <span className="text-[8px] mt-2 opacity-50 uppercase tracking-[0.4em]">Uganda</span>
                   </>
                 )}
               </div>
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#008284]/10 px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-[#008284] animate-pulse"></span>
                <p className="text-[12px] font-black text-[#008284] tracking-[0.4em] uppercase">Uganda National School Curriculum</p>
              </div>
              <h1 className="text-7xl font-black text-[#008284] tracking-tighter leading-[0.85] uppercase drop-shadow-xl mb-4">
                Academic Master<br/>Calendar
              </h1>
              <div className="flex items-center gap-6 mt-6">
                <div className="h-[2px] w-16 bg-[#008284]/20"></div>
                <p className="text-2xl font-black text-[#008284] tracking-[0.5em] uppercase">Global Cycle {academicYear}</p>
                <div className="h-[2px] w-16 bg-[#008284]/20"></div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 flex flex-col items-end opacity-[0.03] pointer-events-none -rotate-12 translate-x-10 -translate-y-10">
               <div className="text-[240px] font-black text-[#008284] leading-none">ALHEIB</div>
            </div>
          </div>
  
          <div className="grid grid-cols-[1fr_360px] gap-16 relative">
            {/* Main Calendar Grid */}
            <div className="grid grid-cols-4 gap-x-8 gap-y-16">
               {monthOrder.map((m, idx) => (
                 <MonthCard key={idx} name={m.name} month={m.month} year={academicYear} />
               ))}
            </div>
  
            {/* Sidebar Section */}
            <div className="flex flex-col gap-10 text-[#008284]">
              <div className="bg-[#008284] text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mb-24 -mr-24 scale-150 group-hover:scale-175 transition-transform duration-700"></div>
                <h3 className="font-black text-sm uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-4 flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5" /> Academic Cycle
                </h3>
                <div className="flex flex-col gap-6 text-[12px] leading-relaxed">
                  <div className="group/item">
                    <span className="opacity-60 block font-black uppercase text-[10px] mb-1 tracking-widest italic group-hover/item:opacity-100 transition-opacity">TERM I WINDOW</span>
                    <span className="font-black text-xl">FEB 05 - MAY 03</span>
                  </div>
                  <div className="group/item">
                    <span className="opacity-60 block font-black uppercase text-[10px] mb-1 tracking-widest italic group-hover/item:opacity-100 transition-opacity">TERM II WINDOW</span>
                    <span className="font-black text-xl">MAY 27 - AUG 23</span>
                  </div>
                  <div className="group/item">
                    <span className="opacity-60 block font-black uppercase text-[10px] mb-1 tracking-widest italic group-hover/item:opacity-100 transition-opacity">TERM III WINDOW</span>
                    <span className="font-black text-xl">SEP 16 - DEC 05</span>
                  </div>
                </div>
              </div>
  
              <div className="flex flex-col gap-4 border-[3px] border-[#008284]/20 p-8 rounded-[40px] bg-[#008284]/[0.02] relative transition-colors hover:bg-white duration-300">
                 <div className="absolute -top-3.5 left-8 bg-white px-4 text-[10px] font-black tracking-[0.4em] uppercase text-[#008284]">Key Index</div>
                 <div className="flex items-center gap-5 text-xs font-black">
                   <div className="w-6 h-6 bg-white border-[3px] border-[#008284] rounded-xl shadow-inner" />
                   <span className="opacity-70">Instructional Attendance</span>
                 </div>
                 <div className="flex items-center gap-5 text-xs font-black">
                   <div className="w-6 h-6 bg-red-50 border-[3px] border-red-500/20 rounded-xl shadow-inner" />
                   <span className="opacity-70">Sabbath Recognition (SUN)</span>
                 </div>
                 <div className="flex items-center gap-5 text-xs font-black">
                   <div className="w-6 h-6 bg-amber-50 border-[3px] border-amber-500/20 rounded-xl shadow-inner" />
                   <span className="opacity-70">Statutory Public Holiday</span>
                 </div>
                 <div className="flex items-center gap-5 text-xs font-black">
                   <div className="w-6 h-6 bg-blue-50 border-[3px] border-blue-500/20 rounded-xl shadow-inner" />
                   <span className="opacity-70">Examination Registry Period</span>
                 </div>
              </div>
  
              <div className="mt-6 relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-[2px] flex-1 bg-[#008284]/15"></div>
                  <h3 className="font-black text-xs uppercase tracking-[0.3em] text-[#008284]/40">National Calendar</h3>
                  <div className="h-[2px] flex-1 bg-[#008284]/15"></div>
                </div>
                <ul className="text-[11px] space-y-4 font-bold pl-3">
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">JAN 01</span> <span className="group-hover:translate-x-1 transition-transform">New Year's Day</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">JAN 26</span> <span className="group-hover:translate-x-1 transition-transform">NRM Liberation Day</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">FEB 16</span> <span className="group-hover:translate-x-1 transition-transform">Archbishop Janani Luwum Day</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">MAR 08</span> <span className="group-hover:translate-x-1 transition-transform">International Women's Day</span></li>
                  <li className="flex gap-4 items-center group text-red-700 font-black"><span className="opacity-30 font-black text-[9px] w-12 tracking-tighter">APR 18</span> <span className="group-hover:translate-x-1 transition-transform">Good Friday</span></li>
                  <li className="flex gap-4 items-center group text-red-700 font-black"><span className="opacity-30 font-black text-[9px] w-12 tracking-tighter">APR 21</span> <span className="group-hover:translate-x-1 transition-transform">Easter Monday</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">MAY 01</span> <span className="group-hover:translate-x-1 transition-transform">Labour Day</span></li>
                  <li className="flex gap-4 items-center group font-black underline"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">JUN 03</span> <span className="group-hover:translate-x-1 transition-transform">Uganda Martyrs' Day</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">JUN 09</span> <span className="group-hover:translate-x-1 transition-transform">National Heroes' Day</span></li>
                  <li className="flex gap-4 items-center group font-black underline decoration-[#008284] decoration-2"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">OCT 09</span> <span className="group-hover:translate-x-1 transition-transform">Independence Day</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">DEC 25</span> <span className="group-hover:translate-x-1 transition-transform">Christmas Day</span></li>
                  <li className="flex gap-4 items-center group"><span className="text-[#008284]/40 font-black text-[9px] w-12 tracking-tighter">DEC 26</span> <span className="group-hover:translate-x-1 transition-transform">Boxing Day</span></li>
                </ul>
              </div>
            </div>
          </div>
  
          {/* Footer Summary Table */}
          <div className="mt-24 flex gap-12 items-end justify-between">
            <div className="flex-1 bg-white border-[4px] border-[#008284] rounded-[50px] overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 right-0 w-60 h-60 bg-[#008284]/5 -mr-30 -mt-30 rounded-full transition-transform duration-1000 group-hover:scale-125"></div>
              <div className="grid grid-cols-[1fr_140px_140px] font-black bg-[#f8fafc] border-b-[4px] border-[#008284] uppercase tracking-[0.3em] text-[11px]">
                <div className="p-5 text-[#008284] flex items-center gap-3 italic">
                  <ClipboardList className="w-5 h-5" /> ACADEMIC METRICS REGISTRY
                </div>
                <div className="p-5 border-l-[4px] border-[#008284] text-center">PUPILS</div>
                <div className="p-5 border-l-[4px] border-[#008284] text-center">FACULTY</div>
              </div>
              <div className="grid grid-cols-[1fr_140px_140px] font-bold border-b border-[#008284]/15 hover:bg-[#008284]/5 transition-colors text-sm">
                <div className="p-5 pl-10 opacity-70 italic tracking-tight">Instructional Term I Capacity Coverage</div>
                <div className="p-5 border-l-[4px] border-[#008284] text-center font-black">88 DAYS</div>
                <div className="p-5 border-l-[4px] border-[#008284] text-center font-black">92 DAYS</div>
              </div>
              <div className="grid grid-cols-[1fr_140px_140px] font-bold border-b border-[#008284]/15 hover:bg-[#008284]/5 transition-colors text-sm">
                <div className="p-5 pl-10 opacity-70 italic tracking-tight">Instructional Term II Capacity Coverage</div>
                <div className="p-5 border-l-[4px] border-[#008284] text-center font-black">89 DAYS</div>
                <div className="p-5 border-l-[4px] border-[#008284] text-center font-black">89 DAYS</div>
              </div>
              <div className="grid grid-cols-[1fr_140px_140px] font-black bg-[#008284] text-white py-2 group/total">
                <div className="p-6 pl-10 text-[16px] tracking-[0.5em] uppercase">CUMULATIVE SESSION TOTAL</div>
                <div className="p-6 border-l-[4px] border-white/20 text-center text-3xl font-black italic shadow-inner">265</div>
                <div className="p-6 border-l-[4px] border-white/20 text-center text-3xl font-black italic shadow-inner">273</div>
              </div>
            </div>
  
            <div className="w-[340px] flex flex-col items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000 group/stamp">
               <div className="w-48 h-48 border-[4px] border-[#008284] rounded-[60px] flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500 group-hover/stamp:opacity-100">
                  <div className="absolute inset-0 border-2 border-dashed border-[#008284]/40 rounded-[60px] animate-spin-slow"></div>
                  <div className="w-full h-full border-2 border-[#008284]/20 rounded-[50px] flex flex-col items-center justify-center text-[11px] font-black text-[#008284] text-center uppercase tracking-tighter leading-tight z-10">
                    <span className="opacity-40 mb-1">VALIDATED BY</span>
                    <div className="bg-[#008284] text-white px-2 py-0.5 rounded-md mb-1 scale-90">SECURE</div>
                    MANAGEMENT<br/>BOARD
                  </div>
               </div>
               <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#008284] border-t-2 border-[#008284]/20 pt-4">OFFICIAL MASTER STAMP</div>
            </div>
          </div>
  
          <div className="mt-16 flex justify-between items-end opacity-20 border-t border-[#008284]/10 pt-6 group/footer">
             <div className="text-[9px] font-black uppercase tracking-[0.3em] leading-tight">
               ALHEIB PRIMARY SCHOOL ACADEMIC MANAGEMENT SYSTEM v2.5<br/>
               <span className="opacity-60">© {new Date().getFullYear()} Regional Office Uganda. All Rights Reserved.</span>
             </div>
             <div className="flex gap-4">
               <div className="w-12 h-2 bg-[#008284]/30 rounded-full"></div>
               <div className="w-12 h-2 bg-[#008284]/20 rounded-full"></div>
               <div className="w-12 h-2 bg-[#008284]/10 rounded-full"></div>
             </div>
          </div>
        </motion.div>
      ) : viewMode === "monthly" ? (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="py-12"
        >
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[32px] border border-[#008284]/10 shadow-sm">
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                   <ChevronLeft className="w-6 h-6 text-[#008284]" />
                </Button>
                <h2 className="text-3xl font-black text-[#008284] uppercase tracking-tighter">
                   {format(currentDate, "MMMM yyyy")}
                </h2>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                   <ChevronRight className="w-6 h-6 text-[#008284]" />
                </Button>
             </div>
             <Button variant="outline" className="rounded-xl border-[#008284]/20" onClick={() => setCurrentDate(new Date())}>Today</Button>
          </div>

          <div className="bg-white rounded-[40px] border border-[#008284]/20 p-10 shadow-2xl">
             <div className="grid grid-cols-7 mb-6">
                {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-[#008284]/40 tracking-widest uppercase">{d}</div>
                ))}
             </div>
             <div className="grid grid-cols-7 gap-4">
                {(() => {
                  const days = eachDayOfInterval({ 
                    start: startOfMonth(currentDate), 
                    end: endOfMonth(currentDate) 
                  });
                  const firstDay = days[0].getDay();
                  const padding = (firstDay + 6) % 7;
                  const cells = [];
                  
                  for (let i = 0; i < padding; i++) cells.push(<div key={`pad-${i}`} className="h-32 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" />);
                  
                    days.forEach(day => {
                      const status = getDayStatus(day);
                      const dayEvents = filteredEvents.filter(e => isEventOnDay(e, day));
  
                      cells.push(
                        <div key={day.toISOString()} className={cn(
                          "h-32 p-4 rounded-2xl border transition-all hover:shadow-lg relative overflow-hidden group",
                          status === 'weekend' ? "bg-red-50/30 border-red-100" : "bg-white border-slate-100",
                          status === 'holiday' && "bg-amber-50/50 border-amber-100",
                          status === 'exam' && "bg-blue-50/50 border-blue-100",
                          status === 'term' && "bg-emerald-50/50 border-emerald-100",
                          isSameDay(day, new Date()) && "ring-2 ring-[#008284] shadow-xl"
                        )}>
                          <div className="flex justify-between items-start">
                            <span className={cn(
                               "text-lg font-black",
                               isSameDay(day, new Date()) ? "text-[#008284]" : "text-slate-400"
                             )}>{format(day, "d")}</span>
                             {status === 'holiday' && <Palmtree className="w-4 h-4 text-amber-400 opacity-50" />}
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            {dayEvents.slice(0, 3).map((e, idx) => (
                              <div key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md truncate text-white" style={{ backgroundColor: e.color }}>
                                {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-[9px] font-black text-[#008284]/40 mt-1 uppercase">+{dayEvents.length - 3} More</div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  return cells;
                })()}
             </div>
          </div>
        </motion.div>
      ) : viewMode === "weekly" ? (
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="py-12"
        >
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[32px] border border-[#008284]/10 shadow-sm">
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 7)))}>
                   <ChevronLeft className="w-6 h-6 text-[#008284]" />
                </Button>
                <h2 className="text-3xl font-black text-[#008284] uppercase tracking-tighter">
                   Weekly Program
                </h2>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 7)))}>
                   <ChevronRight className="w-6 h-6 text-[#008284]" />
                </Button>
             </div>
             <p className="text-[#008284] font-black text-sm tracking-widest opacity-60 uppercase">
                {format(currentDate, "'Week of' MMMM do, yyyy")}
             </p>
          </div>

          <div className="grid gap-6">
             {Array.from({ length: 7 }).map((_, i) => {
               const day = new Date(currentDate);
               const first = day.getDate() - day.getDay() + (day.getDay() === 0 ? -6 : 1); // Monday start
               day.setDate(first + i);
               
               const status = getDayStatus(day);
               const dayEvents = filteredEvents.filter(e => isEventOnDay(e, day));

               return (
                 <div key={i} className="bg-white rounded-[32px] border border-[#008284]/10 p-8 shadow-sm flex items-center gap-12 group hover:border-[#008284]/30 transition-all">
                    <div className="w-24 text-center">
                       <span className="block text-[10px] font-black text-[#008284]/40 uppercase tracking-widest mb-1">{format(day, "EEEE")}</span>
                       <span className={cn(
                         "text-4xl font-black block",
                         isSameDay(day, new Date()) ? "text-[#008284]" : (day.getDay() === 0 ? "text-red-300" : "text-slate-300")
                       )}>{format(day, "d")}</span>
                       {status === 'holiday' && <p className="text-[8px] font-black text-amber-500 uppercase mt-1">Holiday</p>}
                    </div>
                    <div className="flex-1 border-l-[3px] border-[#008284]/5 pl-12 space-y-4">
                       {dayEvents.length > 0 ? (
                         dayEvents.map((e, idx) => (
                           <div key={idx} className="flex items-center gap-4">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }}></div>
                              <div>
                                 <h4 className="font-black text-[#008284] uppercase tracking-tight">{e.title}</h4>
                                 {e.description && <p className="text-xs text-slate-500 font-bold italic">{e.description}</p>}
                              </div>
                              <span className="ml-auto text-[10px] font-black uppercase text-[#008284]/30 bg-slate-50 px-3 py-1 rounded-full">{e.event_type}</span>
                           </div>
                         ))
                       ) : (
                         <p className="text-slate-300 font-black italic uppercase text-xs tracking-widest">Normal Academic Operating Hours</p>
                       )}
                    </div>
                 </div>
               );
             })}
          </div>
        </motion.div>
      ) : (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="py-12"
        >
          {/* Termly View */}
          <div className="grid gap-12">
             {events.filter(e => e.event_type === 'term').map((term, idx) => (
               <div key={idx} className="bg-white rounded-[50px] border-[4px] border-[#008284] p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#008284]/5 -mr-40 -mt-40 rounded-full"></div>
                  <div className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-5xl font-black text-[#008284] tracking-tighter uppercase mb-2">{term.title}</h2>
                        <div className="flex items-center gap-4 text-[#008284]/60 font-black tracking-widest text-sm uppercase">
                           <CalendarIcon className="w-4 h-4" />
                           {format(parseISO(term.start_date), "MMMM do")} - {format(parseISO(term.end_date), "MMMM do, yyyy")}
                        </div>
                     </div>
                     <div className="bg-[#008284] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.3em]">Termly Program</div>
                  </div>

                  <div className="grid grid-cols-3 gap-8">                      {/* Filter events within this term */}
                     {events
                       .filter(e => {
                         if (e.event_type === 'term') return false;
                         const eStart = parseISO(e.start_date);
                         const tStart = parseISO(term.start_date);
                         const tEnd = parseISO(term.end_date);
                         return (isAfter(eStart, tStart) || isSameDay(eStart, tStart)) && (isBefore(eStart, tEnd) || isSameDay(eStart, tEnd));
                       })
                       .slice(0, 12)
                       .map((e, eIdx) => (
                         <div key={eIdx} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-start gap-4 transition-transform hover:scale-[1.02]">
                            <div className="w-2 h-12 rounded-full shrink-0" style={{ backgroundColor: e.color }}></div>
                            <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-[#008284]/40 uppercase tracking-widest">{format(parseISO(e.start_date), "MMM d")}</span>
                                  {e.recurrence && e.recurrence !== 'none' && <Badge variant="outline" className="text-[8px] py-0 px-1.5 h-3.5 border-[#008284]/20 uppercase font-black text-[#008284]/40">{e.recurrence}</Badge>}
                               </div>
                               <h4 className="font-black text-[#008284] uppercase leading-tight mt-1 truncate">{e.title}</h4>
                               <p className="text-[10px] text-slate-500 font-bold mt-2 line-clamp-1">{e.description || "School internal operation"}</p>
                            </div>
                         </div>
                       ))
                     }
                  </div>
               </div>
             ))}
          </div>
        </motion.div>
      )}


      {/* Save Dialog */}
      {isAdmin && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="rounded-[32px] border-[#008284]/20 p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-[#008284] tracking-tight uppercase">Register Academic Event</DialogTitle>
              <DialogDescription className="font-bold text-slate-500 italic">Add a new event, holiday, or examination period to the school calendar.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 font-bold">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-[#008284] uppercase tracking-widest text-[10px]">Event Designation</Label>
                <Input 
                  id="title"
                  placeholder="e.g. Term I Opening Ceremony" 
                  className="rounded-xl border-[#008284]/20 focus:border-[#008284] focus:ring--[#008284]"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start" className="text-[#008284] uppercase tracking-widest text-[10px]">Start Epoch</Label>
                  <Input 
                    id="start"
                    type="date" 
                    className="rounded-xl border-[#008284]/20 focus:border-[#008284] focus:ring--[#008284]"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end" className="text-[#008284] uppercase tracking-widest text-[10px]">End Epoch</Label>
                  <Input 
                    id="end"
                    type="date" 
                    className="rounded-xl border-[#008284]/20 focus:border-[#008284] focus:ring--[#008284]"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-[#008284] uppercase tracking-widest text-[10px]">Registry Category</Label>
                  <Select 
                    value={newEvent.event_type} 
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, event_type: v as any }))}
                  >
                    <SelectTrigger className="rounded-xl border-[#008284]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#008284]/20">
                      <SelectItem value="term">Academic Term</SelectItem>
                      <SelectItem value="holiday">Public Holiday</SelectItem>
                      <SelectItem value="exam">Examination Period</SelectItem>
                      <SelectItem value="activity">School Activity</SelectItem>
                      <SelectItem value="event">General Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recurrence" className="text-[#008284] uppercase tracking-widest text-[10px]">Repeating Cycle</Label>
                  <Select 
                    value={newEvent.recurrence} 
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, recurrence: v as any }))}
                  >
                    <SelectTrigger className="rounded-xl border-[#008284]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#008284]/20">
                      <SelectItem value="none">Onetime Occurence</SelectItem>
                      <SelectItem value="weekly">Every Week</SelectItem>
                      <SelectItem value="monthly">Every Month</SelectItem>
                      <SelectItem value="termly">Every Term</SelectItem>
                      <SelectItem value="annually">Every Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-[#008284] uppercase tracking-widest text-[10px]">Operational Details</Label>
                <Textarea 
                  id="desc"
                  placeholder="Optional notes regarding this entry..." 
                  className="rounded-xl border-[#008284]/20 min-h-[100px] focus:border-[#008284] focus:ring--[#008284]"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Abandon</Button>
              <Button 
                onClick={handleUpsert} 
                disabled={upsertEvent.isPending}
                className="rounded-xl bg-[#008284] font-black uppercase tracking-widest text-[10px] px-8 shadow-lg hover:shadow-xl transition-all"
              >
                {upsertEvent.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                COMMIT TO CYCLE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default Calendar;
