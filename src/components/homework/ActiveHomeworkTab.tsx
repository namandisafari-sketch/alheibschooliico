
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, CheckCircle2, Clock } from "lucide-react";

export const ActiveHomeworkTab = () => {
  const assignments = [
    { id: "HW-001", subject: "Mathematics", title: "Long Division Practice", deadline: "Tomorrow", status: "Active" },
    { id: "HW-002", subject: "English", title: "Creative Writing: My Village", deadline: "Friday", status: "Active" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {assignments.map((hw) => (
          <Card key={hw.id} className="border-none shadow-md overflow-hidden group">
            <div className="h-1 w-full bg-primary" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="font-mono text-[10px]">{hw.id}</Badge>
                <Badge className="bg-primary/10 text-primary border-none">{hw.subject}</Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-2">{hw.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Due: {hw.deadline}
                </div>
                <div className="flex items-center gap-1.5 text-success font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  {hw.status}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
