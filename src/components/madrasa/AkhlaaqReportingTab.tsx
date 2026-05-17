import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { useAkhlaaqReports } from "@/hooks/useMadrasa";
import { Skeleton } from "@/components/ui/skeleton";

export const AkhlaaqReportingTab = () => {
  const { data: reports = [], isLoading } = useAkhlaaqReports();

  // Aggregate stats from reports
  const categories = Array.from(new Set(reports.map(r => r.trait_category)));
  const traits = categories.map(cat => {
    const catReports = reports.filter(r => r.trait_category === cat);
    const avg = catReports.reduce((s, r) => s + (r.rating || 0), 0) / catReports.length;
    return { name: cat, score: parseFloat(avg.toFixed(1)), count: catReports.length };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recent Character Reports (Akhlaaq)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))
          ) : reports.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No recent reports found.</p>
          ) : (
            reports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {r.learner?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.learner?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.trait_category} • {r.term || 'Term 1'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-primary" />
                  <span className="font-bold text-sm">{r.rating}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Trait Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : traits.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No analysis data available.</p>
          ) : (
            traits.map((trait) => (
              <div key={trait.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-xs">{trait.name}</span>
                  <span className="text-primary font-bold">{trait.score} / 5.0</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${(trait.score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground uppercase tracking-widest">
                  <span>{trait.count} total reports</span>
                  <MessageSquare className="h-3 w-3" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
