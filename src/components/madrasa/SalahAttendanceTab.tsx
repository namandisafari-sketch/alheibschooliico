
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle2, Circle, XCircle } from "lucide-react";
import { format } from "date-fns";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Tahajjud"];

export const SalahAttendanceTab = () => {
  const [date, setDate] = useState(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          {format(date, "EEEE, dd MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Previous Day</Button>
          <Button variant="outline" size="sm">Next Day</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PRAYERS.map((prayer) => (
          <Card key={prayer} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
            <CardHeader className="bg-muted/50 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">{prayer}</CardTitle>
              <Badge className="bg-primary/10 text-primary border-none">Jama'ah</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-muted-foreground">Attendance:</span>
                <span className="font-bold">42 / 45</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '93%' }}></div>
              </div>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                Mark Attendance
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
