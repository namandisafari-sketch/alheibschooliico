import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Clock, MapPin, User, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useClasses } from "@/hooks/useClasses";
import { useClassTimetable } from "@/hooks/useTimetable";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 }
];
const TIMES = ["08:30", "09:30", "10:30", "11:30", "12:30", "14:00", "15:00"];

const Timetable = () => {
    const { data: classes = [] } = useClasses();
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [term, setTerm] = useState("term_1");
    
    const { data: slots = [], isLoading } = useClassTimetable(selectedClassId, term);

    const getSlot = (dayValue: number, time: string) => {
        return slots.find(s => s.day_of_week === dayValue && s.start_time.startsWith(time));
    };

    return (
        <DashboardLayout title="Academic Timetable" subtitle="Master Schedule & Block Planning">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-xs font-bold px-3 uppercase">{term.replace("_", " ")}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                            <Download className="h-4 w-4" /> Export
                        </Button>
                        <Button size="sm" className="gap-2 flex-1 sm:flex-none">
                            <Plus className="h-4 w-4" /> Add Period
                        </Button>
                    </div>
                </div>

                {!selectedClassId ? (
                    <Card className="border-dashed py-20">
                        <CardContent className="text-center space-y-3">
                            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-bold">No Class Selected</h3>
                                <p className="text-sm text-muted-foreground">Select a class from the dropdown above to view its timetable.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[1000px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="grid grid-cols-6 border-b border-slate-100">
                                <div className="p-4 bg-slate-50/50 border-r border-slate-100 font-bold text-xs text-muted-foreground flex items-center justify-center">
                                    TIME
                                </div>
                                {DAYS.map(day => (
                                    <div key={day.value} className="p-4 font-bold text-xs text-center border-r border-slate-100 last:border-0 uppercase tracking-wider text-slate-500">
                                        {day.label}
                                    </div>
                                ))}
                            </div>

                            {isLoading ? (
                                TIMES.map(time => (
                                    <div key={time} className="grid grid-cols-6 border-b border-slate-100 min-h-[100px]">
                                        <div className="p-4 bg-slate-50/30 border-r border-slate-100 flex items-center justify-center">
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        {DAYS.map(day => (
                                            <div key={`${day.value}-${time}`} className="p-2 border-r border-slate-100 flex items-center justify-center">
                                                <Skeleton className="h-full w-full rounded-lg" />
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                TIMES.map((time) => (
                                    <div key={time} className="grid grid-cols-6 border-b border-slate-100 last:border-0 min-h-[100px]">
                                        <div className="p-4 bg-slate-50/30 border-r border-slate-100 font-medium text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {time}
                                        </div>
                                        {DAYS.map(day => {
                                            const slot = getSlot(day.value, time);
                                            return (
                                                <div key={`${day.value}-${time}`} className="p-2 border-r border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                                                    {slot ? (
                                                        <div className="h-full bg-blue-50 border border-blue-100 rounded-lg p-2 text-[10px] space-y-1 relative group-hover:shadow-sm">
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-bold text-blue-800">{slot.subject?.name}</span>
                                                                <Badge variant="outline" className="text-[8px] h-4 px-1 bg-white">
                                                                    {slot.room?.name || "N/A"}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-blue-600">
                                                                <User className="h-3 w-3" />
                                                                <span className="truncate">{slot.teacher?.full_name}</span>
                                                            </div>
                                                            {slot.notes && (
                                                                <p className="text-[9px] text-slate-400 italic truncate">{slot.notes}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full w-full border-2 border-dashed border-slate-50 rounded-lg group-hover:border-slate-200 transition-colors" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" /> 
                                Detected Conflicts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground text-center py-4 bg-slate-50 rounded-lg border border-dashed">
                                No scheduling conflicts detected for {selectedClass}.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                Teacher Utilization
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Mr. Okello J.</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: i === 1 ? '75%' : '40%' }}></div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{i === 1 ? '18/24' : '10/24'} hrs</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Timetable;
