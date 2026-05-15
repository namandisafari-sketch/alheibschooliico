
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export const MadrasaTimetableTab = () => {
  const schedule = [
    { time: "05:00 AM - 06:00 AM", activity: "Fajr & Morning Adhkar", category: "Spiritual" },
    { time: "06:00 AM - 07:30 AM", activity: "Quran Hifdh Session", category: "Academic" },
    { time: "04:30 PM - 05:30 PM", activity: "Arabic Language", category: "Academic" },
    { time: "05:30 PM - 06:30 PM", activity: "Islamic Studies (IRE)", category: "Academic" },
    { time: "07:30 PM - 08:30 PM", activity: "Halaqa & Storytelling", category: "Akhlaaq" },
  ];

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <div className="bg-primary p-4 text-white">
        <h3 className="font-bold flex items-center gap-2">
          <Clock className="h-5 w-5" /> Daily Madrasa Routine
        </h3>
      </div>
      <CardContent className="p-0">
        <div className="divide-y">
          {schedule.map((item, i) => (
            <div key={i} className="flex items-center gap-6 p-4 hover:bg-muted/50 transition-colors">
              <div className="w-40 font-mono text-sm font-bold text-muted-foreground">
                {item.time}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{item.activity}</p>
                <Badge 
                  variant="outline" 
                  className={`mt-1 text-[10px] uppercase ${
                    item.category === 'Spiritual' ? 'border-amber-500 text-amber-500' : 
                    item.category === 'Academic' ? 'border-blue-500 text-blue-500' : 
                    'border-green-500 text-green-500'
                  }`}
                >
                  {item.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
