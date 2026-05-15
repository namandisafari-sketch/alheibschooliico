
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, CalendarClock } from "lucide-react";

export const HolidayWorkTab = () => {
  const packs = [
    { title: "P.4 End of Term 1 Package", date: "April 2024", size: "1.2MB" },
    { title: "P.4 Mathematics Holiday Set", date: "April 2024", size: "850KB" },
    { title: "General Islamic Studies Prep", date: "April 2024", size: "2.1MB" },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <CalendarClock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-amber-900">Term 1 Holiday Break</CardTitle>
            <CardDescription className="text-amber-800/60">Work packages are available for download until May 15th</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {packs.map((pack) => (
          <Card key={pack.title} className="group hover:shadow-lg transition-all border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                <FileDown className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold leading-tight">{pack.title}</CardTitle>
              <CardDescription>{pack.date} • {pack.size}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full gap-2 group-hover:bg-primary group-hover:text-white transition-colors">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
