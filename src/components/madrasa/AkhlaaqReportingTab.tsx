
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";

export const AkhlaaqReportingTab = () => {
  const traits = [
    { name: "Honesty (Sidq)", score: 4.8, count: 12 },
    { name: "Respect (Adab)", score: 4.5, count: 15 },
    { name: "Cleanliness (Taharah)", score: 4.9, count: 10 },
    { name: "Punctuality", score: 4.2, count: 8 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Top Performing Classes (Akhlaaq)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  P{i}
                </div>
                <div>
                  <p className="font-semibold">Primary {i}</p>
                  <p className="text-xs text-muted-foreground">Term 2 Overall Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Star className="h-4 w-4 fill-primary" />
                <span className="font-bold">4.{9-i}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Trait Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {traits.map((trait) => (
            <div key={trait.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{trait.name}</span>
                <span className="text-primary font-bold">{trait.score} / 5.0</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${(trait.score / 5) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                <span>{trait.count} Reports this month</span>
                <MessageSquare className="h-3 w-3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
