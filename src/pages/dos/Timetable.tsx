import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Clock, MapPin, User, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["08:30", "09:30", "10:30", "11:30", "12:30", "14:00", "15:00"];

const Timetable = () => {
    const [selectedClass, setSelectedClass] = useState("Primary 1");

    return (
        <DashboardLayout title="Academic Timetable" subtitle="Master Schedule & Block Planning">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Primary 1">Primary 1</SelectItem>
                                <SelectItem value="Primary 2">Primary 2</SelectItem>
                                <SelectItem value="Primary 3">Primary 3</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-xs font-bold px-3">Term 1, 2024</span>
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

                <div className="overflow-x-auto">
                    <div className="min-w-[800px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="grid grid-cols-6 border-b border-slate-100">
                            <div className="p-4 bg-slate-50/50 border-r border-slate-100 font-bold text-xs text-muted-foreground flex items-center justify-center">
                                TIME
                            </div>
                            {DAYS.map(day => (
                                <div key={day} className="p-4 font-bold text-xs text-center border-r border-slate-100 last:border-0 uppercase tracking-wider text-slate-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {TIMES.map((time, idx) => (
                            <div key={time} className="grid grid-cols-6 border-b border-slate-100 last:border-0 min-h-[100px]">
                                <div className="p-4 bg-slate-50/30 border-r border-slate-100 font-medium text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                </div>
                                {DAYS.map(day => (
                                    <div key={`${day}-${time}`} className="p-2 border-r border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                                        {/* Mock data for visualization */}
                                        {(idx + day.length) % 3 === 0 && (
                                            <div className="h-full bg-blue-50 border border-blue-100 rounded-lg p-2 text-[10px] space-y-1 relative group-hover:shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-blue-800">English</span>
                                                    <Badge variant="outline" className="text-[8px] h-4 px-1 bg-white">RM 4</Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-blue-600">
                                                    <User className="h-3 w-3" />
                                                    <span>Mr. Okello</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Block B</span>
                                                </div>
                                            </div>
                                        )}
                                        {(idx + day.length) % 5 === 0 && idx < 4 && (
                                            <div className="h-full bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-[10px] space-y-1 relative group-hover:shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-emerald-800">Science</span>
                                                    <Badge variant="outline" className="text-[8px] h-4 px-1 bg-white">Lab</Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <User className="h-3 w-3" />
                                                    <span>Ms. Atim</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

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
