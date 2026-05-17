import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle2, Circle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useSalahAttendance } from "@/hooks/useMadrasa";
import { Skeleton } from "@/components/ui/skeleton";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Tahajjud"];

export const SalahAttendanceTab = () => {
  const [date, setDate] = useState(new Date());
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data: records = [], isLoading } = useSalahAttendance(formattedDate);

  const getStats = (prayer: string) => {
    const prayerRecords = records.filter(r => r.prayer_name === prayer);
    const present = prayerRecords.filter(r => r.status === "Jamaah" || r.status === "Individual").length;
    return { present, total: prayerRecords.length };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          {format(date, "EEEE, dd MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(date.getTime() - 86400000))}>Previous Day</Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(date.getTime() + 86400000))}>Next Day</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PRAYERS.map((prayer) => {
          const { present, total } = getStats(prayer);
          const percent = total > 0 ? (present / total) * 100 : 0;

          return (
            <Card key={prayer} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
              <CardHeader className="bg-muted/50 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold">{prayer}</CardTitle>
                <Badge className="bg-primary/10 text-primary border-none">Active</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-1.5 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-muted-foreground">Attendance:</span>
                      <span className="font-bold">{present} / {total || '—'}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                      Mark Attendance
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
